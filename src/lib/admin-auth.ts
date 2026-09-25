import { generateURI, verifySync } from 'otplib/functional'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// Configuración de TOTP y JWT
// Se puede configurar en variables de entorno o usa un fallback seguro para desarrollo
const DEFAULT_TOTP_SECRET = process.env.ADMIN_TOTP_SECRET || 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'yak-artesanal-secret-key-cota-2024'
export const ADMIN_COOKIE_NAME = 'yak_admin_session'

export function getAdminTotpSecret(): string {
  return process.env.ADMIN_TOTP_SECRET || DEFAULT_TOTP_SECRET
}

/** Genera la URI para vincular en Google Authenticator o Llavero de Apple */
export function getTotpUri(accountName = 'admin@yak.com.co'): {
  secret: string
  uri: string
} {
  const secret = getAdminTotpSecret()
  const uri = generateURI({
    label: accountName,
    issuer: 'YAK Yogur Artesanal',
    secret,
  })
  return { secret, uri }
}

/** Verifica el código de 6 dígitos */
export function verifyTotpToken(token: string): boolean {
  try {
    const secret = getAdminTotpSecret()
    const cleanToken = token.replace(/\s+/g, '')
    const result = verifySync({ token: cleanToken, secret })
    return result.valid
  } catch (err) {
    console.error('[admin-auth] Error verificando TOTP:', err)
    return false
  }
}

/** Genera el JWT de sesión administrativa */
export function createAdminSessionToken(): string {
  return jwt.sign(
    { role: 'admin', authorizedAt: new Date().toISOString() },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

/** Valida el JWT desde las cookies de la petición */
export function verifyAdminSession(): boolean {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)
    if (!sessionCookie || !sessionCookie.value) return false

    const decoded = jwt.verify(sessionCookie.value, JWT_SECRET) as { role?: string }
    return decoded?.role === 'admin'
  } catch {
    return false
  }
}