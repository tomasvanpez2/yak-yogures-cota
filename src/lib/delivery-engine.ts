import { ZONES, DELIVERY_ROUTES } from './config'

export interface DeliveryInfo {
  deliveryDate: Date
  dayName: string
  dayOfWeek: number
  isWithinCutoff: boolean
  cutoffDay: string
  cutoffTime: string
  cutoffDate: Date
}

const DAY_NAMES = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']

// Cada ruta tiene un día de corte exactamente 2 días calendario antes de la entrega.
const CUTOFF_DAY_OFFSET = 2
// La hora de corte es configurable por zona (ZONES[id].cutoffHour), default 14:00.
// El cliente debe reportar el pago antes de las 11:59 PM del mismo día de corte.
const PAYMENT_DEADLINE_HOUR = 23
const PAYMENT_DEADLINE_MINUTE = 59

function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Devuelve la próxima ocurrencia estrictamente posterior de `targetDay` (0 = domingo).
 * Si hoy ya es el día objetivo, avanza a la siguiente semana, porque el corte
 * (2 días antes) ya expiró para esa entrega.
 */
function getNextDayOfWeek(date: Date, targetDay: number): Date {
  const result = startOfDay(date)
  let daysUntilTarget = targetDay - result.getDay()
  if (daysUntilTarget <= 0) daysUntilTarget += 7
  result.setDate(result.getDate() + daysUntilTarget)
  return result
}

/**
 * Calcula la fecha de entrega para un pedido.
 *
 * La fecha depende del momento en que el pedido fue CREADO y de cuándo se
 * REPORTÓ el pago. Para conservar la ruta cercana deben cumplirse ambas:
 *   1. Pedido creado antes de las 2:00 PM del día de corte.
 *   2. Pago reportado antes de las 11:59 PM del mismo día de corte.
 * Si alguna falla, el pedido pasa a la siguiente semana de esa misma ruta.
 *
 * `paymentReportedAt` es opcional: cuando aún no hay reporte se asume que el
 * pago será oportuno, por lo que solo la condición 1 determina el resultado.
 */
export function calculateDeliveryDate(
  orderCreatedAt: Date,
  zoneId: string,
  paymentReportedAt?: Date | null
): DeliveryInfo {
  const zone = ZONES[zoneId]
  if (!zone) throw new Error(`Zona inválida: ${zoneId}`)

  const route = DELIVERY_ROUTES.find((r) => r.zoneId === zoneId)
  if (!route) throw new Error(`No hay ruta configurada para la zona: ${zoneId}`)

  const deliveryDayIndex = route.dayIndex
  const cutoffHour = zone.cutoffHour ?? 14
  const cutoffDayIndex = (deliveryDayIndex - CUTOFF_DAY_OFFSET + 7) % 7

  // Siguiente fecha de entrega de esta ruta a partir de la creación del pedido.
  const nextDelivery = getNextDayOfWeek(orderCreatedAt, deliveryDayIndex)

  // Fecha y hora de corte correspondiente a esa entrega (entrega menos 2 días).
  const cutoffDate = new Date(nextDelivery)
  cutoffDate.setDate(cutoffDate.getDate() - CUTOFF_DAY_OFFSET)
  cutoffDate.setHours(cutoffHour, 0, 0, 0)

  // Condición 1: el pedido se creó antes de las 2:00 PM (estrictamente antes).
  const orderWithinCutoff = orderCreatedAt.getTime() < cutoffDate.getTime()

  // Condición 2: el pago se reportó antes de las 11:59 PM del día de corte.
  let paymentKeepsRoute = true
  if (paymentReportedAt) {
    const paymentDeadline = startOfDay(cutoffDate)
    paymentDeadline.setHours(PAYMENT_DEADLINE_HOUR, PAYMENT_DEADLINE_MINUTE, 0, 0)
    paymentKeepsRoute = paymentReportedAt.getTime() <= paymentDeadline.getTime()
  }

  const withinCutoff = orderWithinCutoff && paymentKeepsRoute

  const deliveryDate = new Date(nextDelivery)
  if (!withinCutoff) {
    deliveryDate.setDate(deliveryDate.getDate() + 7)
  }
  deliveryDate.setHours(9, 0, 0, 0)

  const dayOfWeek = deliveryDate.getDay()

  return {
    deliveryDate,
    dayName: DAY_NAMES[dayOfWeek],
    dayOfWeek,
    isWithinCutoff: withinCutoff,
    cutoffDay: DAY_NAMES[cutoffDayIndex],
    cutoffTime: `${cutoffHour}:00`,
    cutoffDate: new Date(cutoffDate),
  }
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function isDeliveryDay(dayName: string): boolean {
  return dayName !== 'DOMINGO'
}