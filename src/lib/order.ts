import { OrderStatus, SugarOption } from './config'

export interface OrderItem {
  productId: string
  quantity: number
  price: number
  /** Preferencia de azúcar: 'CON' | 'SIN'. Solo aplica a sabores de fruta (no al Griego). */
  sugar?: SugarOption
}

export interface CustomerData {
  name: string
  phone: string
  zone: string
  address: string
  apartment?: string
  instructions?: string
}

export interface Order {
  id: string
  items: OrderItem[]
  customer: CustomerData
  subtotal: number
  deliveryCost: number
  total: number
  totalUnits: number
  deliveryDate: string
  deliveryDay: string
  cutoffDate?: string
  cutoffTime?: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  paymentReportedAt?: string
  paymentConfirmedAt?: string
  paymentRejectedAt?: string
  confirmedBy?: string
  telegramMessageId?: string
}

// Estado inicial de todo pedido al crearse.
export const INITIAL_ORDER_STATUS: OrderStatus = 'PENDING_PAYMENT'

export function generateOrderId(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  // Usar timestamp de alta precisión en lugar de random para evitar colisiones
  const time = Date.now().toString(36).toUpperCase()
  return `PED-${year}${month}${day}-${time}`
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^\d{10}$/.test(cleaned) || /^\+57\d{10}$/.test(cleaned)
}

export function validateZone(zone: string): boolean {
  const validZones = ['COTA', 'CHIA', 'CAJICA', 'CALLE_80', 'SUBA', 'SUR']
  return validZones.includes(zone)
}

export function validateOrderItems(items: OrderItem[]): boolean {
  if (!items || items.length === 0) return false
  return items.every(
    (item) =>
      typeof item.productId === 'string' &&
      item.productId.length > 0 &&
      typeof item.quantity === 'number' &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      (item.sugar === undefined || item.sugar === 'CON' || item.sugar === 'SIN')
  )
}
