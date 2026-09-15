import { Order } from './order'
import {
  PRODUCTS,
  ZONES,
  ORDER_STATUSES,
  DELIVERY_ROUTES,
  sugarLabel,
  type SugarOption,
} from './config'
import { formatDeliveryDate } from './delivery-engine'

interface TelegramConfig {
  botToken: string
  chatId: string
}

const TELEGRAM_API = 'https://api.telegram.org'

export async function sendTelegramMessage(
  config: TelegramConfig,
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<boolean> {
  if (!config.botToken || !config.chatId) {
    console.error('[telegram] ❌ Faltan variables de entorno:', {
      hasBotToken: !!config.botToken,
      hasChatId: !!config.chatId,
    })
    return false
  }
  try {
    const response = await fetch(`${TELEGRAM_API}/bot${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: 'HTML',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('[telegram] ❌ API respondió con error:', {
        status: response.status,
        description: data?.description,
        error_code: data?.error_code,
      })
      return false
    }
    console.log('[telegram] ✅ Mensaje enviado correctamente, message_id:', data?.result?.message_id)
    return true
  } catch (error) {
    console.error('[telegram] ❌ Error de red:', error)
    return false
  }
}

export function getTelegramConfig(): TelegramConfig {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  }
}

/**
 * Responde un callback_query de Telegram. Esto detiene el "spinner" de carga
 * del botón y da feedback inmediato al admin. Sin esta respuesta, el botón
 * queda girando para siempre aunque el servidor sí haya procesado el trabajo.
 */
export async function answerCallbackQuery(
  config: TelegramConfig,
  callbackQueryId: string,
  text?: string
): Promise<boolean> {
  if (!config.botToken || !callbackQueryId) return false
  try {
    const body: Record<string, unknown> = { callback_query_id: callbackQueryId }
    if (text) body.text = text
    const response = await fetch(`${TELEGRAM_API}/bot${config.botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      console.error('[telegram] ❌ answerCallbackQuery error:', {
        status: response.status,
        description: data?.description,
      })
      return false
    }
    return true
  } catch (error) {
    console.error('[telegram] ❌ answerCallbackQuery error de red:', error)
    return false
  }
}

// Normaliza el teléfono del cliente al formato wa.me internacional (sin '+').
// Colombia: si son 10 dígitos, anteponemos 57.
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '')
  if (digits.length === 10) return `57${digits}`
  if (digits.length === 12 && digits.startsWith('57')) return digits
  if (digits.length === 13 && digits.startsWith('057')) return digits.slice(1)
  return digits
}

function productsList(order: Order): string {
  return order.items
    .map((item) => {
      const product = PRODUCTS[item.productId]
      const name = product ? product.name : item.productId
      const sugar = item.sugar ? ` (${sugarLabel(item.sugar)})` : ''
      return `• ${item.quantity} x ${name}${sugar}`
    })
    .join('\n')
}

export async function sendPaymentNotification(order: Order, config: TelegramConfig) {
  const deliveryDate = new Date(order.deliveryDate)
  const zone = ZONES[order.customer.zone]

  const message = `
🔔 PAGO POR VERIFICAR

Pedido: #${order.id}

Cliente:
${order.customer.name}

WhatsApp:
${order.customer.phone}

Productos:
${productsList(order)}

Unidades:
${order.totalUnits}

Subtotal:
$${order.subtotal.toLocaleString('es-CO')}

Domicilio:
${order.deliveryCost === 0 ? 'GRATIS' : `$${order.deliveryCost.toLocaleString('es-CO')}`}

TOTAL:
$${order.total.toLocaleString('es-CO')}

Zona:
${zone.name}

Entrega:
${order.deliveryDay} ${formatDeliveryDate(deliveryDate)}

Dirección:
${order.customer.address}
${order.customer.apartment ? `Apto/Casa: ${order.customer.apartment}` : ''}
${order.customer.instructions ? `Indicaciones: ${order.customer.instructions}` : ''}

El cliente reportó que realizó la transferencia.
  `.trim()

  return sendTelegramMessage(config, message, {
    inline_keyboard: [
      [
        { text: '✅ CONFIRMAR PAGO', callback_data: `confirm_${order.id}` },
        { text: '❌ RECHAZAR PAGO', callback_data: `reject_${order.id}` },
      ],
    ],
  })
}

export function generateWhatsAppLink(order: Order): string {
  // El mensaje se envía al cliente confirmando su pedido (wa.me usa el teléfono del cliente).
  const customerNumber = normalizeWhatsAppNumber(order.customer.phone)
  const deliveryDate = new Date(order.deliveryDate)
  const zone = ZONES[order.customer.zone]

  const message = `Hola ${order.customer.name}, tu pago ha sido confirmado.

Tu pedido #${order.id} quedó confirmado.

Productos:
${order.items
  .map((item) => {
    const product = PRODUCTS[item.productId]
    const sugar = item.sugar ? ` (${sugarLabel(item.sugar)})` : ''
    return `${item.quantity} x ${product.name}${sugar}`
  })
  .join('\n')}

Total: $${order.total.toLocaleString('es-CO')} COP

Entrega:
${order.deliveryDay} ${formatDeliveryDate(deliveryDate)}

Zona:
${zone.name}

Dirección:
${order.customer.address}
${order.customer.apartment ? `Apto/Casa: ${order.customer.apartment}` : ''}

Gracias por tu pedido.`

  return `https://wa.me/${customerNumber}?text=${encodeURIComponent(message)}`
}

export async function sendPaymentConfirmed(order: Order, config: TelegramConfig) {
  const deliveryDate = new Date(order.deliveryDate)
  const zone = ZONES[order.customer.zone]
  const waLink = generateWhatsAppLink(order)

  const message = `
✅ PAGO CONFIRMADO

Pedido: #${order.id}

Cliente:
${order.customer.name}

Total:
$${order.total.toLocaleString('es-CO')}

Zona:
${zone.name}

Entrega:
${order.deliveryDay} ${formatDeliveryDate(deliveryDate)}

Registrado correctamente.
  `.trim()

  return sendTelegramMessage(config, message, {
    inline_keyboard: [[{ text: '📲 ENVIAR CONFIRMACIÓN POR WHATSAPP', url: waLink }]],
  })
}

export async function sendPaymentRejected(order: Order, config: TelegramConfig) {
  const message = `
❌ PAGO RECHAZADO

Pedido #${order.id}

El pago no fue confirmado.

El pedido NO entra en producción.

El cliente debe ser contactado.
  `.trim()

  return sendTelegramMessage(config, message)
}

// ---------------------------------------------------------------------------
// Resumen diario de pedidos (se envía a Telegram todos los días a las 6pm)
// ---------------------------------------------------------------------------

export interface DailySummaryOrder {
  id: string
  customer: { name: string; phone: string; zone: string }
  items: { productId: string; quantity: number; sugar?: SugarOption }[]
  total: number
  totalUnits: number
  deliveryDay: string
  status: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: '🟡 PENDIENTES DE PAGO',
  PAYMENT_REPORTED: '🔴 POR VERIFICAR',
  PAID: '🟢 CONFIRMADOS',
  IN_PRODUCTION: '🏭 EN PRODUCCIÓN',
  OUT_FOR_DELIVERY: '🚚 EN REPARTO',
  DELIVERED: '✅ ENTREGADOS',
  PAYMENT_REJECTED: '❌ RECHAZADOS',
  CANCELLED: '✖️ CANCELADOS',
  EXPIRED: '⏳ EXPIRADOS',
}

export function buildDailySummary(orders: DailySummaryOrder[], date: Date = new Date()): string {
  if (!orders || orders.length === 0) {
    return `📋 RESUMEN DE PEDIDOS\n\nNo hay pedidos activos hoy.`
  }

  // Agrupa pedidos por estado, conservando el orden de STATES_PRIORITY.
  const STATES_PRIORITY = [
    'PAYMENT_REPORTED',
    'PENDING_PAYMENT',
    'PAID',
    'IN_PRODUCTION',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'PAYMENT_REJECTED',
    'CANCELLED',
    'EXPIRED',
  ]
  const byStatus: Record<string, DailySummaryOrder[]> = {}
  for (const o of orders) {
    ;(byStatus[o.status] ??= []).push(o)
  }

  const dateLine = date.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const lines: string[] = [
    `📋 RESUMEN DE PEDIDOS`,
    `📅 ${dateLine}`,
    ``,
  ]

  let grandTotal = 0
  let grandUnits = 0

  for (const status of STATES_PRIORITY) {
    const list = byStatus[status]
    if (!list || list.length === 0) continue

    const label = STATUS_LABELS[status] ?? status
    lines.push(`— ${label} (${list.length}) —`)
    for (const o of list) {
      const products = o.items
        .map((i) => {
          const base = `${i.quantity}x ${PRODUCTS[i.productId]?.name ?? i.productId}`
          return i.sugar ? `${base} (${sugarLabel(i.sugar)})` : base
        })
        .join(', ')
      const zoneName = ZONES[o.customer.zone]?.name ?? o.customer.zone
      lines.push(`• ${o.id} — ${o.customer.name}`)
      lines.push(`   ${products}`)
      lines.push(
        `   💰 $${o.total.toLocaleString('es-CO')} · 🚚 ${zoneName} · 📅 ${o.deliveryDay}`
      )
      grandTotal += o.total
      grandUnits += o.totalUnits
    }
    lines.push('')
  }

  lines.push(`👥 Total: ${orders.length} pedidos · ${grandUnits} unidades`)
  lines.push(`💰 Total: $${grandTotal.toLocaleString('es-CO')} COP`)

  return lines.join('\n')
}

export async function sendDailySummary(orders: DailySummaryOrder[]): Promise<boolean> {
  const config = getTelegramConfig()
  const text = buildDailySummary(orders)
  return sendTelegramMessage(config, text)
}

// ---------------------------------------------------------------------------
// Resumen semanal de pedidos (se envía al confirmar un pago desde Telegram)
// ---------------------------------------------------------------------------

// Estados que se incluyen en el resumen semanal: todo el trabajo por hacer de
// la semana (pagos pendientes, por verificar, confirmados y en proceso).
export const WEEKLY_SUMMARY_STATUSES = [
  ORDER_STATUSES.PENDING_PAYMENT,
  ORDER_STATUSES.PAYMENT_REPORTED,
  ORDER_STATUSES.PAID,
  ORDER_STATUSES.IN_PRODUCTION,
  ORDER_STATUSES.OUT_FOR_DELIVERY,
]

const STATUS_EMOJI: Record<string, string> = {
  [ORDER_STATUSES.PENDING_PAYMENT]: '🟡',
  [ORDER_STATUSES.PAYMENT_REPORTED]: '🔴',
  [ORDER_STATUSES.PAID]: '🟢',
  [ORDER_STATUSES.IN_PRODUCTION]: '🏭',
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: '🚚',
  [ORDER_STATUSES.DELIVERED]: '✅',
}

// Colombia es UTC-5 fijo (sin horario de verano).
const BOGOTA_OFFSET_MS = -5 * 60 * 60 * 1000

/** Convierte una fecha a sus componentes de "hora de pared" de Bogotá. */
function bogotaParts(date: Date): { year: number; month: number; day: number; dow: number } {
  const shifted = new Date(date.getTime() + BOGOTA_OFFSET_MS)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    dow: shifted.getUTCDay(),
  }
}

/** Rango de la semana actual (lunes 00:00 → domingo 23:59, hora Bogotá). */
export function currentWeekRange(now: Date = new Date()): { start: Date; end: Date } {
  const p = bogotaParts(now)
  const daysSinceMonday = (p.dow + 6) % 7 // lunes=0 ... domingo=6
  // Hora de pared Bogotá 00:00 del lunes, vuelta a UTC real.
  const start = new Date(Date.UTC(p.year, p.month, p.day - daysSinceMonday, 0, 0, 0) - BOGOTA_OFFSET_MS)
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
  return { start, end }
}

const WEEK_DAYS_ES = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
]
const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function formatWeekDay(dt: Date): string {
  const p = bogotaParts(dt)
  return `${WEEK_DAYS_ES[p.dow]} ${p.day} de ${MONTHS_ES[p.month]}`
}

function formatWeekRange(start: Date): string {
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  return `del ${formatWeekDay(start)} al ${formatWeekDay(end)}`
}

function plural(n: number, singular: string, pluralWord: string): string {
  return n === 1 ? singular : pluralWord
}

/**
 * Construye el texto del resumen semanal: todos los pedidos cuya entrega cae en
 * la semana actual + la siguiente (2 semanas, lunes a domingo), agrupados por
 * día de ruta/zona, con total por sabor y total general.
 */
export function buildWeeklySummary(orders: Order[], now: Date = new Date()): string {
  const { start } = currentWeekRange(now)
  // Rango de 2 semanas: lunes de la semana actual → domingo de la próxima.
  const week2Start = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  const end = new Date(week2Start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)

  const week1 = orders.filter((o) => {
    const d = new Date(o.deliveryDate).getTime()
    return d >= start.getTime() && d < week2Start.getTime()
  })
  const week2 = orders.filter((o) => {
    const d = new Date(o.deliveryDate).getTime()
    return d >= week2Start.getTime() && d <= end.getTime()
  })

  if (week1.length + week2.length === 0) {
    return `📊 RESUMEN SEMANAL\n\nNo hay pedidos para las próximas 2 semanas.`
  }

  // Agrupa una lista de pedidos por zona conservando el orden de ruta.
  const groupByZone = (list: Order[]): [string, Order[]][] => {
    const byZone: Record<string, Order[]> = {}
    for (const o of list) {
      const zone = o.customer.zone
      if (byZone[zone]) byZone[zone].push(o)
      else byZone[zone] = [o]
    }
    return DELIVERY_ROUTES.map((r) => r.zoneId)
      .filter((zid) => byZone[zid])
      .map((zid) => [zid, byZone[zid]] as [string, Order[]])
  }

  const lines: string[] = [
    '📊 RESUMEN DE 2 SEMANAS',
    `🗓 ${formatWeekRange(start)} → ${formatWeekRange(week2Start)}`,
    '',
  ]

  // Total por sabor: cambia según el producto
  const flavorTotals: Record<string, number> = {}
  for (const id of Object.keys(PRODUCTS)) flavorTotals[id] = 0

  // Renderiza una sección completa de una semana (lista de zonas + pedidos).
  const renderWeek = (
    tag: string,
    weekStart: Date,
    list: Order[]
  ): string[] => {
    if (list.length === 0) return []
    const out: string[] = [
      `┌─ ${tag} ─┐`,
      `│ 📅 ${formatWeekRange(weekStart)}`,
    ]

    for (const [zoneId, zoneOrders] of groupByZone(list)) {
      const zone = ZONES[zoneId]
      out.push(`│ ${routeDayFor(zoneId)} · ${zone.name} (${zoneOrders.length}) —`)

      let zoneTotal = 0
      let zoneUnits = 0
      for (const o of zoneOrders) {
        const emoji = STATUS_EMOJI[o.status] ?? '•'
        const products = o.items
          .map((i) => {
            const name = PRODUCTS[i.productId]?.name ?? i.productId
            const sugar = i.sugar ? ` (${sugarLabel(i.sugar)})` : ''
            flavorTotals[i.productId] = (flavorTotals[i.productId] ?? 0) + i.quantity
            return `${i.quantity}x ${name}${sugar}`
          })
          .join(', ')

        out.push(`│   ${emoji} ${o.id} · ${o.customer.name}`)
        out.push(`│     ${products}`)
        out.push(`│     💰 $${o.total.toLocaleString('es-CO')}`)

        zoneTotal += o.total
        zoneUnits += o.totalUnits
      }

      const ped = plural(zoneOrders.length, 'pedido', 'pedidos')
      out.push(`│   👥 ${zoneOrders.length} ${ped} · ${zoneUnits} unid · 💰 $${zoneTotal.toLocaleString('es-CO')}`)
    }

    out.push(`└───────────┘`)
    out.push('')
    return out
  }

  // Semana 1 y Semana 2, cada una organizada por zona/ruta.
  lines.push(...renderWeek('SEMANA 1', start, week1))
  lines.push(...renderWeek('SEMANA 2', week2Start, week2))

  // Total por sabor (2 semanas).
  lines.push('— 🍦 SABORES (2 SEMANAS) —')
  for (const id of Object.keys(PRODUCTS)) {
    lines.push(`• ${PRODUCTS[id]?.name}: ${flavorTotals[id]} unid`)
  }
  lines.push('')

  const grandOrders = week1.length + week2.length
  const grandUnits = [...week1, ...week2].reduce((acc, o) => acc + o.totalUnits, 0)
  const grandTotal = [...week1, ...week2].reduce((acc, o) => acc + o.total, 0)

  const pedTot = plural(grandOrders, 'pedido', 'pedidos')
  const unidTot = plural(grandUnits, 'unidad', 'unidades')
  lines.push('—— TOTAL (2 SEMANAS) ——')
  lines.push(`👥 ${grandOrders} ${pedTot} · ${grandUnits} ${unidTot}`)
  lines.push(`💰 $${grandTotal.toLocaleString('es-CO')} COP`)

  return lines.join('\n')
}

/** Devuelve la etiqueta de día de ruta de una zona (ej: 'MIÉRCOLES'). */
function routeDayFor(zoneId: string): string {
  const route = DELIVERY_ROUTES.find((r) => r.zoneId === zoneId)
  return route ? route.day : zoneId
}

export async function sendWeeklySummary(orders: Order[]): Promise<boolean> {
  const config = getTelegramConfig()
  const text = buildWeeklySummary(orders)
  return sendTelegramMessage(config, text)
}