import { NextRequest, NextResponse } from 'next/server'
import { ORDER_STATUSES } from '@/lib/config'
import { listOrdersByStatus } from '@/lib/store'
import { sendDailySummary, type DailySummaryOrder } from '@/lib/telegram'

// Estados considerados "activos" — se excluyen los terminales (entregados, rechazados,
// cancelados y expirados) para que el resumen muestre solo trabajo por hacer.
const ACTIVE_STATUSES = [
  ORDER_STATUSES.PENDING_PAYMENT,
  ORDER_STATUSES.PAYMENT_REPORTED,
  ORDER_STATUSES.PAID,
  ORDER_STATUSES.IN_PRODUCTION,
  ORDER_STATUSES.OUT_FOR_DELIVERY,
]

/**
 * Resumen diario de pedidos → Telegram.
 *
 * Disparado por cron (Vercel Cron: ver `vercel.json`, 23:00 UTC = 6pm hora Colombia).
 * También puede llamarse manualmente por cualquier servicio de cron externo
 * (GitHub Actions, cron-job.org, etc.) siempre que envíe el header Authorization.
 *
 * Protección: si `CRON_SECRET` está definido en el entorno, exige
 * `Authorization: Bearer <CRON_SECRET>`. Si no está definido, acepta sin auth
 * (útil en dev).
 */
export async function GET(request: NextRequest) {
  // Validación de secreto si está configurado.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  try {
    const docs = await listOrdersByStatus(ACTIVE_STATUSES)

    // Extrae solo los campos que necesita el resumen.
    const orders: DailySummaryOrder[] = docs.map((o) => ({
      id: o.id,
      customer: {
        name: o.customer.name,
        phone: o.customer.phone,
        zone: o.customer.zone,
      },
      items: o.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        ...(i.sugar ? { sugar: i.sugar } : {}),
      })),
      total: o.total,
      totalUnits: o.totalUnits,
      deliveryDay: o.deliveryDay,
      status: o.status,
    }))

    const ok = await sendDailySummary(orders)
    return NextResponse.json({ ok, count: orders.length, sentAt: new Date().toISOString() })
  } catch (err) {
    console.error('[daily-summary] Error:', err)
    return NextResponse.json(
      { ok: false, error: 'No se pudo enviar el resumen diario' },
      { status: 500 }
    )
  }
}
