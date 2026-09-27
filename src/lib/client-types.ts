// Tipos para el sistema de clientes YAK
//
// La autenticación es en 1 clic por número de teléfono (sin contraseñas ni
// SMS): el cliente se identifica con su celular y sus datos se autocompletan.

export interface Customer {
  phone: string // ID principal, 10 dígitos normalizados (ej: '3013109200')
  name: string
  address: string
  zone: string // ID de zona (ZONES en config.ts)
  apartment?: string
  instructions?: string
  isFounder: boolean // Cliente fundador: domicilio siempre $0
  bottlesInPossession: number // Botellas de vidrio que tiene en casa
  bottlesHistory: number // Total histórico acumulado (programa 10+1)
  createdAt: string // ISO date
  updatedAt: string // ISO date
}

/** Datos que el cliente puede autocompletar al identificarse (lookup). */
export type CustomerPublicData = Omit<
  Customer,
  'createdAt' | 'updatedAt' | 'isFounder' | 'bottlesHistory'
> & {
  isFounder: boolean
  bottlesHistory: number
}

// ─── Constantes del sistema de botellas y fidelidad ──────────────
export const BOTTLE_DISCOUNT = 2000 // $2.000 por cada botella devuelta
export const BOTTLES_FOR_FREE = 10 // Cada 10 botellas históricas → 1 gratis

/**
 * Botellas máximas que el cliente puede devolver en un pedido:
 * hasta lo que tiene en casa o lo que compra, lo menor.
 */
export function maxReturnableBottles(
  bottlesInPossession: number,
  totalUnits: number
): number {
  return Math.max(0, Math.min(bottlesInPossession, totalUnits))
}

/** Descuento aplicable por devolución de botellas. */
export function bottleReturnDiscount(bottlesReturned: number): number {
  return Math.max(0, bottlesReturned) * BOTTLE_DISCOUNT
}

/**
 * Progreso del programa 10+1: cuántas botellas faltan para el próximo
 * yogur gratis. hasFreeBottle es true SOLO en múltiplos exactos de 10 (10, 20, 30...).
 */
export function loyaltyProgress(bottlesHistory: number): {
  hasFreeBottle: boolean
  bottlesToNextFree: number
  progressInCycle: number // 0..9 dentro del ciclo actual
} {
  const progressInCycle = bottlesHistory % BOTTLES_FOR_FREE
  const hasFreeBottle = bottlesHistory > 0 && progressInCycle === 0
  return {
    hasFreeBottle,
    bottlesToNextFree: hasFreeBottle ? BOTTLES_FOR_FREE : BOTTLES_FOR_FREE - progressInCycle,
    progressInCycle,
  }
}

/** Normaliza el teléfono de Colombia a 10 dígitos. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // '573001234567' (con indicativo) → '3001234567'
  if (digits.length === 12 && digits.startsWith('57')) return digits.slice(2)
  // '+57 300 123 4567' con + → ya sin el + tras el replace
  if (digits.length === 11 && digits.startsWith('57')) return digits.slice(2)
  return digits.slice(-10)
}