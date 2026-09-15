import { NextRequest, NextResponse } from 'next/server'
import { confirmPayment, rejectPayment } from '@/lib/order-service'
import {
  sendTelegramMessage,
  getTelegramConfig,
  answerCallbackQuery,
  sendWeeklySummary,
  WEEKLY_SUMMARY_STATUSES,
} from '@/lib/telegram'
import { listOrdersByStatus } from '@/lib/store'

/**
 * Webhook de Telegram para botones inline del mensaje de verificación de pago.
 *
 * Callback data: `confirm_<orderId>` o `reject_<orderId>`.
 *
 * Flujo:
 * 1. Se responde el callback_query de inmediato (detiene el spinner del botón
 *    y confirma que el bot recibió el toque).
 * 2. Se delega en `order-service` (máquina de estados + efectos colaterales).
 * 3. Si el pago se confirma, además se envía el resumen semanal de pedidos.
 * 4. Siempre se responde 200 a Telegram (requisito de la API de bots).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.callback_query) {
      return NextResponse.json({ ok: true })
    }

    const { callback_query } = body
    const { data, id: callbackId } = callback_query

    // Parse: "confirm_ORDERID" | "reject_ORDERID"
    const [action, ...rest] = (data ?? '').split('_')
    const orderId = rest.join('_')

    if (!action || !orderId) {
      return NextResponse.json({ ok: true })
    }

    const config = getTelegramConfig()

    // Feedback inmediato al admin: detiene el spinner del botón.
    const actionLabel = action === 'confirm' ? 'Confirmando pago' : 'Rechazando pago'
    await answerCallbackQuery(config, callbackId, `⏳ ${actionLabel}…`).catch(() => {})

    if (action === 'confirm') {
      const result = await confirmPayment(orderId, 'TELEGRAM')
      if (result.ok) {
        await sendTelegramMessage(config, `✅ Pedido #${result.data.id} confirmado correctamente.`)
        // El admin quiere ver el estado de la semana al confirmar un pago.
        const weekOrders = await listOrdersByStatus(WEEKLY_SUMMARY_STATUSES).catch(() => [])
        await sendWeeklySummary(weekOrders).catch((err) => {
          console.error('[telegram-webhook] ❌ No se pudo enviar el resumen semanal:', err)
        })
      } else {
        await sendTelegramMessage(
          config,
          `⚠️ No se pudo confirmar el pago del pedido ${orderId}:\n${result.error}`
        )
      }
    } else if (action === 'reject') {
      const result = await rejectPayment(orderId)
      if (result.ok) {
        // rejectPayment() ya envía sendPaymentRejected().
        await sendTelegramMessage(config, `❌ Pedido #${result.data.id} rechazado.`)
      } else {
        await sendTelegramMessage(
          config,
          `⚠️ No se pudo rechazar el pago del pedido ${orderId}:\n${result.error}`
        )
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error handling Telegram callback:', error)
    return NextResponse.json({ ok: true }) // Siempre 200 para Telegram
  }
}