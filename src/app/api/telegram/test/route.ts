import { NextRequest, NextResponse } from 'next/server'
import { getTelegramConfig, sendTelegramMessage } from '@/lib/telegram'

/**
 * GET /api/telegram/test — Verifica la conexión con Telegram.
 * Retorna el estado de las variables de entorno y envía un mensaje de prueba.
 */
async function getWebhookDiagnostics(botToken: string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    )
    const data = await response.json()
    const info = data?.ok ? (data.result ?? {}) : {}
    return {
      webhookSet: !!(info.url && info.url.length > 0),
      webhookUrl: info.url ?? null,
      pendingUpdates: info.pending_update_count ?? 0,
      lastError: info.last_error_message ?? null,
    }
  } catch {
    return {
      webhookSet: null,
      webhookUrl: null,
      error: 'No se pudo consultar getWebhookInfo',
    }
  }
}

/** Configura el webhook del bot apuntando a una URL pública. */
async function configureWebhook(botToken: string, url: string) {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          allowed_updates: ['callback_query', 'message'],
        }),
      }
    )
    const data = await response.json()
    return {
      ok: data.ok,
      webhookUrl: url,
      message: data.ok
        ? `✅ Webhook configurado: ${url}`
        : `❌ Error: ${data.description}`,
      result: data,
    }
  } catch (error) {
    return {
      ok: false,
      error: 'Error al configurar webhook',
      details: String(error),
    }
  }
}

export async function GET(request: NextRequest) {
  const config = getTelegramConfig()

  // ── MODO CONFIGURACIÓN ─────────────────────────────────────
  // GET /api/telegram/test?configure=1  → configura el webhook con el
  // dominio actual y envía un mensaje de prueba. Úsalo DESPUÉS de
  // desplegar: simplemente abre el enlace en el navegador.
  // Ej: https://TU-DOMINIO.vercel.app/api/telegram/test?configure=1
  const wantsConfigure = new URL(request.url).searchParams.get('configure') === '1'
  if (wantsConfigure && config.botToken) {
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const proto = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    if (host) {
      const webhookUrl = `${proto}://${host}/api/telegram`
      const res = await configureWebhook(config.botToken, webhookUrl)
      const diag = await getWebhookDiagnostics(config.botToken)
      return NextResponse.json({ ...res, diagnostics: diag })
    }
  }

  const diagnostics: Record<string, unknown> = {
    hasBotToken: !!config.botToken,
    botTokenLength: config.botToken.length,
    hasChatId: !!config.chatId,
    chatIdValue: config.chatId,
    nodeEnv: process.env.NODE_ENV,
  }

  if (config.botToken) {
    // Saber si los botones van a funcionar: el webhook debe apuntar a una URL
    // pública (los bots no pueden llegar a tu localhost).
    Object.assign(diagnostics, await getWebhookDiagnostics(config.botToken))
  }

  if (!config.botToken || !config.chatId) {
    return NextResponse.json({
      ok: false,
      error: 'Faltan variables de entorno de Telegram',
      diagnostics,
    })
  }

  const testMessage = `🧪 <b>Test de YAK Yogurt</b>\n\nConexión verificada correctamente.\nFecha: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`

  const sent = await sendTelegramMessage(config, testMessage)

  return NextResponse.json({
    ok: sent,
    message: sent
      ? '✅ Mensaje de prueba enviado. Revisa tu Telegram.'
      : '❌ No se pudo enviar. Revisa que TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID sean correctos.',
    diagnostics,
  })
}

/**
 * POST /api/telegram/test — Configura el webhook de Telegram.
 * Body: { "url": "https://tu-app.onrender.com/api/telegram" }
 * O sin body: auto-detecta la URL del request.
 */
export async function POST(request: NextRequest) {
  const config = getTelegramConfig()

  if (!config.botToken) {
    return NextResponse.json({
      ok: false,
      error: 'TELEGRAM_BOT_TOKEN no está configurado',
    })
  }

  let webhookUrl: string

  try {
    const body = await request.json().catch(() => ({}))
    webhookUrl = body.url
  } catch {
    webhookUrl = ''
  }

  if (!webhookUrl) {
    // Auto-detect from request headers
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    if (host) {
      webhookUrl = `${proto}://${host}/api/telegram`
    } else {
      return NextResponse.json({
        ok: false,
        error: 'No se pudo detectar la URL. Envía { "url": "https://tu-dominio/api/telegram" }',
      })
    }
  }

  return NextResponse.json(await configureWebhook(config.botToken, webhookUrl))
}
