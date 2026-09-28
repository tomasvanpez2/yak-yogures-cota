import {
  type Order,
  type OrderItem,
  generateOrderId,
  validatePhone,
  validateZone,
  validateOrderItems,
} from './order'
import {
  PRODUCTS,
  getDeliveryCost,
  ORDER_STATUSES,
  resolveSugar,
  validateZoneMinLiters,
  type OrderStatus,
} from './config'
import { calculateDeliveryDate } from './delivery-engine'
import {
  getOrderById,
  insertOrder,
  updateOrderStatus,
  getCustomerByPhone,
  upsertCustomer,
} from './store'
import {
  getTelegramConfig,
  sendPaymentNotification,
  sendPaymentConfirmed,
  sendPaymentRejected,
} from './telegram'
import {
  BOTTLE_DISCOUNT,
  BOTTLES_FOR_FREE,
  normalizePhone,
  maxReturnableBottles,
  loyaltyProgress,
  type Customer,
} from './client-types'

// Máquina de estados: solo se permiten estas transiciones.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [ORDER_STATUSES.PENDING_PAYMENT]: [ORDER_STATUSES.PAYMENT_REPORTED],
  [ORDER_STATUSES.PAYMENT_REPORTED]: [ORDER_STATUSES.PAID, ORDER_STATUSES.PAYMENT_REJECTED],
  [ORDER_STATUSES.PAID]: [ORDER_STATUSES.IN_PRODUCTION],
  [ORDER_STATUSES.IN_PRODUCTION]: [ORDER_STATUSES.OUT_FOR_DELIVERY],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.PAYMENT_REJECTED]: [],
  [ORDER_STATUSES.DELIVERED]: [],
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.EXPIRED]: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export interface CreateOrderInput {
  items: OrderItem[]
  customer: {
    name: string
    phone: string
    zone: string
    address: string
    apartment?: string
    instructions?: string
  }
  bottlesToReturn?: number
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

export async function getOrder(orderId: string): Promise<Order | null> {
  return getOrderById(orderId)
}

/**
 * Crea un pedido: valida, busca cliente, aplica descuentos por botellas
 * retornables y programa de fidelidad (10+1), calcula domicilio y persiste.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<ServiceResult<Order>> {
  if (!input.items || input.items.length === 0)
    return { ok: false, error: 'El pedido debe contener al menos un producto' }
  if (!validateOrderItems(input.items))
    return { ok: false, error: 'Productos inválidos' }
  if (
    !input.customer?.name ||
    !input.customer?.phone ||
    !input.customer?.zone ||
    !input.customer?.address
  )
    return { ok: false, error: 'Datos de cliente incompletos' }
  if (!validatePhone(input.customer.phone))
    return { ok: false, error: 'Número de WhatsApp inválido (10 dígitos)' }
  if (!validateZone(input.customer.zone))
    return { ok: false, error: 'Zona no válida' }

  const normalizedPhone = normalizePhone(input.customer.phone)

  // 1. Buscar si el cliente ya existe en el sistema
  const existingCustomer = await getCustomerByPhone(normalizedPhone)
  const isFounder = existingCustomer?.isFounder ?? false
  const bottlesInPossession = existingCustomer?.bottlesInPossession ?? 0
  const bottlesHistory = existingCustomer?.bottlesHistory ?? 0

  // 2. Calcular subtotal y unidades compradas
  let subtotal = 0
  let totalUnits = 0
  const orderItems = input.items.map((item) => {
    const product = PRODUCTS[item.productId]
    if (!product) throw new Error(`Producto no encontrado: ${item.productId}`)
    subtotal += product.price * item.quantity
    totalUnits += item.quantity
    const sugar = resolveSugar(item.productId, item.sugar)
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      ...(sugar ? { sugar } : {}),
    }
  })

  // 2b. Mínimo de litros por zona (Sur de Bogotá: mínimo 2 litros).
  // Cada unidad equivale a 1 litro.
  const minCheck = validateZoneMinLiters(input.customer.zone, totalUnits)
  if (!minCheck.valid) {
    return { ok: false, error: minCheck.message ?? 'No cumple el pedido mínimo de la zona', status: 400 }
  }

  // 3. Descuento de retorno de botellas:
  // Solo se pueden devolver botellas que ya tiene en casa (primer pedido = 0),
  // y como máximo las que compra en este pedido.
  const requestedReturn = Math.max(0, input.bottlesToReturn ?? 0)
  const allowedReturn = maxReturnableBottles(bottlesInPossession, totalUnits)
  const actualBottlesReturned = Math.min(requestedReturn, allowedReturn)
  const bottleDiscount = actualBottlesReturned * BOTTLE_DISCOUNT

  // 4. Programa de Fidelidad (10 + 1):
  // Solo se aplica si el cliente HA GANADO un yogur gratis (progreso en ciclo = 0 y historial > 0).
  // Usamos loyaltyProgress para no aplicar el descuento cuando el historial es 11, 12, etc.
  let loyaltyDiscount = 0
  const progress = loyaltyProgress(bottlesHistory)
  if (progress.hasFreeBottle && totalUnits > 0) {
    // Se descuenta el producto más económico del pedido (ej. $19.000 fruta o $25.000 si solo lleva griego)
    const cheapestPrice = Math.min(...orderItems.map((i) => i.price))
    loyaltyDiscount = cheapestPrice
  }

  // 5. Costo de Domicilio:
  // $0 si es Fundador o la zona es Cota. De lo contrario tarifa oficial.
  const deliveryCost = getDeliveryCost(input.customer.zone, isFounder)

  // Total final asegurando que no sea negativo
  const total = Math.max(0, subtotal - bottleDiscount - loyaltyDiscount + deliveryCost)

  const now = new Date()
  const info = calculateDeliveryDate(now, input.customer.zone)

  const order: Order = {
    id: generateOrderId(),
    items: orderItems,
    customer: {
      ...input.customer,
      phone: normalizedPhone,
    },
    subtotal,
    bottlesReturned: actualBottlesReturned,
    bottleDiscount,
    loyaltyDiscount,
    deliveryCost,
    total,
    totalUnits,
    isFounderApplied: isFounder,
    deliveryDate: info.deliveryDate.toISOString(),
    deliveryDay: info.dayName,
    cutoffDate: info.cutoffDate.toISOString(),
    cutoffTime: info.cutoffTime,
    status: ORDER_STATUSES.PENDING_PAYMENT,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  // 6. Guardar/actualizar cliente (upsert)
  const customerToSave: Customer = {
    phone: normalizedPhone,
    name: input.customer.name.trim(),
    address: input.customer.address.trim(),
    zone: input.customer.zone,
    apartment: input.customer.apartment?.trim() || undefined,
    instructions: input.customer.instructions?.trim() || undefined,
    isFounder,
    bottlesInPossession,
    bottlesHistory,
    createdAt: existingCustomer?.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
  }
  await upsertCustomer(customerToSave).catch((err) => {
    console.error('[order-service] Error guardando cliente:', err)
  })

  // 7. Persistir pedido
  const saved = await insertOrder(order)
  return { ok: true, data: saved }
}

/**
 * Reporte de pago → PAYMENT_REPORTED.
 */
export async function reportPayment(
  orderId: string,
  reportedAt?: Date
): Promise<ServiceResult<Order>> {
  const order = await getOrder(orderId)
  if (!order) return { ok: false, error: 'Pedido no encontrado', status: 404 }

  const reported = reportedAt ?? new Date()

  if (order.status === ORDER_STATUSES.PAYMENT_REPORTED) {
    return { ok: true, data: order }
  }
  if (order.status !== ORDER_STATUSES.PENDING_PAYMENT) {
    return {
      ok: false,
      error: `El pedido no está en estado ${ORDER_STATUSES.PENDING_PAYMENT}`,
      status: 409,
    }
  }

  const info = calculateDeliveryDate(
    new Date(order.createdAt),
    order.customer.zone,
    reported
  )

  const updates: Partial<Order> = {
    status: ORDER_STATUSES.PAYMENT_REPORTED,
    paymentReportedAt: reported.toISOString(),
    deliveryDate: info.deliveryDate.toISOString(),
    deliveryDay: info.dayName,
    cutoffDate: info.cutoffDate.toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updated = await updateOrderStatus(
    orderId,
    ORDER_STATUSES.PENDING_PAYMENT,
    updates
  )
  if (!updated) {
    return { ok: false, error: 'No se pudo actualizar el pedido', status: 409 }
  }

  const config = getTelegramConfig()
  if (config.botToken && config.chatId) {
    await sendPaymentNotification(updated, config).catch((err) => {
      console.error('[order-service] Error enviando notificación Telegram:', err)
    })
  }

  return { ok: true, data: updated }
}

/**
 * Confirmación de pago → PAID.
 * Al confirmarse el pago, se actualiza el saldo de botellas del cliente:
 *   - bottlesInPossession: resta las botellas devueltas y suma las nuevas botellas compradas.
 *   - bottlesHistory: suma las botellas compradas. Si usó descuento de fidelidad, descuenta 10 del acumulado.
 */
export async function confirmPayment(
  orderId: string,
  confirmedBy?: string
): Promise<ServiceResult<Order>> {
  const order = await getOrder(orderId)
  if (!order) return { ok: false, error: 'Pedido no encontrado', status: 404 }

  if (order.status === ORDER_STATUSES.PAID) {
    return { ok: true, data: order }
  }
  if (order.status !== ORDER_STATUSES.PAYMENT_REPORTED) {
    return {
      ok: false,
      error: `El pedido debe estar en ${ORDER_STATUSES.PAYMENT_REPORTED} para confirmar`,
      status: 409,
    }
  }

  const updates: Partial<Order> = {
    status: ORDER_STATUSES.PAID,
    paymentConfirmedAt: new Date().toISOString(),
    confirmedBy: confirmedBy ?? 'ADMIN',
    updatedAt: new Date().toISOString(),
  }

  const updated = await updateOrderStatus(
    orderId,
    ORDER_STATUSES.PAYMENT_REPORTED,
    updates
  )
  if (!updated) {
    const fresh = await getOrder(orderId)
    if (fresh && fresh.status === ORDER_STATUSES.PAID) return { ok: true, data: fresh }
    return { ok: false, error: 'No se pudo confirmar el pago', status: 409 }
  }

  // Actualizar inventario de botellas del cliente
  try {
    const customer = await getCustomerByPhone(order.customer.phone)
    if (customer) {
      const prevPossession = customer.bottlesInPossession || 0
      const prevHistory = customer.bottlesHistory || 0

      // Nuevas botellas en posesión = (actuales - devueltas) + nuevas compradas
      const newPossession = Math.max(0, prevPossession - (order.bottlesReturned || 0)) + order.totalUnits

      // Historial: si redimió fidelidad (loyaltyDiscount > 0), restamos 10 del ciclo
      // Usamos order.loyaltyDiscount (calculado en createOrder con lógica correcta)
      // NO usamos prevHistory >= BOTTLES_FOR_FREE porque eso daría true para 11, 12, 13...
      let newHistory = prevHistory + order.totalUnits
      if (order.loyaltyDiscount > 0) {
        newHistory = Math.max(0, newHistory - BOTTLES_FOR_FREE)
      }

      await upsertCustomer({
        ...customer,
        bottlesInPossession: newPossession,
        bottlesHistory: newHistory,
        updatedAt: new Date().toISOString(),
      })
    }
  } catch (err) {
    console.error('[order-service] Error actualizando botellas del cliente:', err)
  }

  const config = getTelegramConfig()
  if (config.botToken && config.chatId) {
    await sendPaymentConfirmed(updated, config).catch((err) => {
      console.error('[order-service] Error enviando confirmación Telegram:', err)
    })
  }

  return { ok: true, data: updated }
}

/** Rechazo de pago → PAYMENT_REJECTED. */
export async function rejectPayment(orderId: string): Promise<ServiceResult<Order>> {
  const order = await getOrder(orderId)
  if (!order) return { ok: false, error: 'Pedido no encontrado', status: 404 }

  if (order.status === ORDER_STATUSES.PAYMENT_REJECTED) {
    return { ok: true, data: order }
  }
  if (order.status !== ORDER_STATUSES.PAYMENT_REPORTED) {
    return {
      ok: false,
      error: `El pedido debe estar en ${ORDER_STATUSES.PAYMENT_REPORTED} para rechazar`,
      status: 409,
    }
  }

  const updates: Partial<Order> = {
    status: ORDER_STATUSES.PAYMENT_REJECTED,
    paymentRejectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updated = await updateOrderStatus(
    orderId,
    ORDER_STATUSES.PAYMENT_REPORTED,
    updates
  )
  if (!updated) {
    return { ok: false, error: 'No se pudo rechazar el pago', status: 409 }
  }

  const config = getTelegramConfig()
  if (config.botToken && config.chatId) {
    await sendPaymentRejected(updated, config).catch((err) => {
      console.error('[order-service] Error enviando rechazo Telegram:', err)
    })
  }

  return { ok: true, data: updated }
}

/** Transiciones de producción (PAID → IN_PRODUCTION → OUT_FOR_DELIVERY → DELIVERED). */
export async function advanceStatus(
  orderId: string,
  to: OrderStatus
): Promise<ServiceResult<Order>> {
  const order = await getOrder(orderId)
  if (!order) return { ok: false, error: 'Pedido no encontrado', status: 404 }
  if (!canTransition(order.status, to)) {
    return {
      ok: false,
      error: `No se permite pasar de ${order.status} a ${to}`,
      status: 409,
    }
  }

  const updates: Partial<Order> = {
    status: to,
    updatedAt: new Date().toISOString(),
  }

  const updated = await updateOrderStatus(orderId, order.status, updates)
  if (!updated) {
    return { ok: false, error: 'No se pudo actualizar el estado', status: 409 }
  }

  return { ok: true, data: updated }
}