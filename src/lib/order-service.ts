import {
  type Order,
  type OrderItem,
  generateOrderId,
  validatePhone,
  validateZone,
  validateOrderItems,
} from './order'
import { PRODUCTS, getDeliveryCost, ORDER_STATUSES, resolveSugar, type OrderStatus } from './config'
import { calculateDeliveryDate } from './delivery-engine'
import {
  getOrderById,
  insertOrder,
  updateOrderStatus,
} from './store'
import {
  getTelegramConfig,
  sendPaymentNotification,
  sendPaymentConfirmed,
  sendPaymentRejected,
} from './telegram'

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
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

export async function getOrder(orderId: string): Promise<Order | null> {
  return getOrderById(orderId)
}

/** Crea un pedido: valida, recalcula precios/delivery/total y persiste en JSON. */
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
    return { ok: false, error: 'Número de WhatsApp inválido' }
  if (!validateZone(input.customer.zone))
    return { ok: false, error: 'Zona no válida' }

  let subtotal = 0
  let totalUnits = 0
  const orderItems = input.items.map((item) => {
    const product = PRODUCTS[item.productId]
    if (!product) throw new Error(`Producto no encontrado: ${item.productId}`)
    subtotal += product.price * item.quantity
    totalUnits += item.quantity
    // Azúcar: el server normaliza la regla (Griego nunca lleva; fruta default 'CON').
    const sugar = resolveSugar(item.productId, item.sugar)
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: product.price,
      ...(sugar ? { sugar } : {}),
    }
  })

  const deliveryCost = getDeliveryCost(input.customer.zone, totalUnits)
  const total = subtotal + deliveryCost

  const now = new Date()
  const info = calculateDeliveryDate(now, input.customer.zone)

  const order: Order = {
    id: generateOrderId(),
    items: orderItems,
    customer: input.customer,
    subtotal,
    deliveryCost,
    total,
    totalUnits,
    deliveryDate: info.deliveryDate.toISOString(),
    deliveryDay: info.dayName,
    cutoffDate: info.cutoffDate.toISOString(),
    cutoffTime: info.cutoffTime,
    status: ORDER_STATUSES.PENDING_PAYMENT,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  // Persiste en JSON — insertOrder es idempotente (si ya existe el ID, retorna el existente)
  const saved = await insertOrder(order)
  return { ok: true, data: saved }
}

/**
 * Reporte de pago → PAYMENT_REPORTED.
 * Idempotente: si ya está en PAYMENT_REPORTED, retorna el pedido sin cambios.
 * Desplaza la entrega a la semana siguiente si el pago llegó después del cutoff.
 */
export async function reportPayment(
  orderId: string,
  reportedAt?: Date
): Promise<ServiceResult<Order>> {
  const order = await getOrder(orderId)
  if (!order) return { ok: false, error: 'Pedido no encontrado', status: 404 }

  const reported = reportedAt ?? new Date()

  if (order.status === ORDER_STATUSES.PAYMENT_REPORTED) {
    return { ok: true, data: order } // ya reportado (idempotente)
  }
  if (order.status !== ORDER_STATUSES.PENDING_PAYMENT) {
    return {
      ok: false,
      error: `El pedido no está en estado ${ORDER_STATUSES.PENDING_PAYMENT}`,
      status: 409,
    }
  }

  // Recalcula la fecha de entrega incluyendo cuándo se reportó el pago.
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
    return { ok: false, error: 'No se pudo actualizar el pedido (¿ya fue reportado?)', status: 409 }
  }

  // Telegram: notifica al equipo que hay un pago por verificar
  const config = getTelegramConfig()
  if (config.botToken && config.chatId) {
    const telegramSent = await sendPaymentNotification(updated, config).catch((err) => {
      console.error('[order-service] ❌ Error enviando notificación Telegram:', err)
      return false
    })
    if (!telegramSent) {
      console.error('[order-service] ⚠️ Notificación Telegram NO enviada para pedido', updated.id)
    } else {
      console.log('[order-service] ✅ Notificación Telegram enviada para pedido', updated.id)
    }
  } else {
    console.warn('[order-service] ⚠️ Telegram no configurado — saltando notificación')
  }

  return { ok: true, data: updated }
}

/**
 * Confirmación de pago → PAID.
 * Idempotente: si ya está en PAID, retorna sin cambios.
 * Desde Telegram: el botón CONFIRMAR PAGO llama este flujo.
 */
export async function confirmPayment(
  orderId: string,
  confirmedBy?: string
): Promise<ServiceResult<Order>> {
  const order = await getOrder(orderId)
  if (!order) return { ok: false, error: 'Pedido no encontrado', status: 404 }

  if (order.status === ORDER_STATUSES.PAID) {
    return { ok: true, data: order } // ya confirmado (idempotente)
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
    confirmedBy: confirmedBy ?? 'TELEGRAM',
    updatedAt: new Date().toISOString(),
  }

  const updated = await updateOrderStatus(
    orderId,
    ORDER_STATUSES.PAYMENT_REPORTED,
    updates
  )
  if (!updated) {
    // Verificar si ya fue confirmado (race condition-safe)
    const fresh = await getOrder(orderId)
    if (fresh && fresh.status === ORDER_STATUSES.PAID) return { ok: true, data: fresh }
    return { ok: false, error: 'No se pudo confirmar el pago', status: 409 }
  }

  // Telegram: notifica confirmación + genera wa.me para enviar al cliente
  const config = getTelegramConfig()
  if (config.botToken && config.chatId) {
    const telegramSent = await sendPaymentConfirmed(updated, config).catch((err) => {
      console.error('[order-service] ❌ Error enviando confirmación Telegram:', err)
      return false
    })
    if (!telegramSent) {
      console.error('[order-service] ⚠️ Confirmación Telegram NO enviada para pedido', orderId)
    }
  }

  return { ok: true, data: updated }
}

/** Rechazo de pago → PAYMENT_REJECTED. Idempotente. */
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
      console.error('[order-service] ❌ Error enviando rechazo Telegram:', err)
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
