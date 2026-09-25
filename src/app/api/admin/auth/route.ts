import { NextRequest, NextResponse } from 'next/server'
import {
  verifyTotpToken,
  createAdminSessionToken,
  verifyAdminSession,
  getTotpUri,
  ADMIN_COOKIE_NAME,
} from '@/lib/admin-auth'

// GET: Verifica si la sesión está activa o devuelve la URI de configuración inicial de 2FA
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isSetup = searchParams.get('setup') === 'true'

  if (isSetup) {
    // Devuelve datos para escanear/configurar el autenticador en iPhone/Google Auth
    const { secret, uri } = getTotpUri()
    return NextResponse.json({
      success: true,
      secret,
      uri,
    })
  }

  const authenticated = verifyAdminSession()
  return NextResponse.json({ authenticated })
}

// POST: Valida el código TOTP de 6 dígitos e inicia sesión con cookie segura
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Código de 6 dígitos requerido' },
        { status: 400 }
      )
    }

    const isValid = verifyTotpToken(code)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Código 2FA incorrecto o expirado' },
        { status: 401 }
      )
    }

    const token = createAdminSessionToken()
    const response = NextResponse.json({
      success: true,
      message: 'Autenticación 2FA exitosa',
    })

    // Cookie segura válida por 24 horas
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24h
    })

    return response
  } catch (error) {
    console.error('Error en login admin 2FA:', error)
    return NextResponse.json(
      { error: 'Error al procesar autenticación' },
      { status: 500 }
    )
  }
}

// DELETE: Cierra la sesión
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(ADMIN_COOKIE_NAME)
  return response
}