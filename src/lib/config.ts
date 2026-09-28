export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  color: string
}

export interface Zone {
  id: string
  name: string
  deliveryCost: number
  routeDay: string
  cutoffHour: number
  /** Cantidad mínima en litros para poder pedir en esta zona. undefined = sin mínimo. */
  minLiters?: number
}

export interface DeliveryRoute {
  day: string
  zoneId: string
  dayIndex: number
}

function productImage(slug: string): string {
  return `/assets/${slug}.jpeg`
}

/** Imagen promocional: los 5 sabores en banner (public/assets/all-flavors.jpeg) */
export const FEATURED_IMAGE = '/assets/all-flavors.jpeg'

export const PRODUCTS: Record<string, Product> = {
  GRIEGO: {
    id: 'GRIEGO',
    name: 'Yogur Griego',
    price: 25000,
    description: 'Nuestro yogur griego cremoso y natural, perfecto para tu día.',
    image: productImage('griego'),
    color: '#F5F5F5',
  },
  MORA: {
    id: 'MORA',
    name: 'Yogur de Mora',
    price: 19000,
    description: 'Yogur artesanal con moras frescas, puro sabor natural.',
    image: productImage('mora'),
    color: '#B8739E',
  },
  MANGO: {
    id: 'MANGO',
    name: 'Yogur de Mango',
    price: 19000,
    description: 'La dulzura natural del mango en cada sorbo.',
    image: productImage('mango'),
    color: '#D4A574',
  },
  FRESA: {
    id: 'FRESA',
    name: 'Yogur de Fresa',
    price: 19000,
    description: 'Fresas frescas seleccionadas para un yogur irresistible.',
    image: productImage('fresa'),
    color: '#E89BB5',
  },
  FEIJOA: {
    id: 'FEIJOA',
    name: 'Yogur de Feijoa',
    price: 19000,
    description: 'Un sabor único con la exótica feijoa colombiana.',
    image: productImage('feijoa'),
    color: '#B8D4A0',
  },
}

export const ZONES: Record<string, Zone> = {
  COTA: { id: 'COTA', name: 'Cota', deliveryCost: 0, routeDay: 'VIERNES', cutoffHour: 18 },
  CHIA: { id: 'CHIA', name: 'Chía', deliveryCost: 6000, routeDay: 'MIÉRCOLES', cutoffHour: 18 },
  CAJICA: { id: 'CAJICA', name: 'Cajicá', deliveryCost: 7000, routeDay: 'MIÉRCOLES', cutoffHour: 18 },
  CALLE_80: { id: 'CALLE_80', name: 'Calle 80', deliveryCost: 7000, routeDay: 'SÁBADO', cutoffHour: 18 },
  SUBA: { id: 'SUBA', name: 'Suba', deliveryCost: 6000, routeDay: 'JUEVES', cutoffHour: 18 },
  SUR: { id: 'SUR', name: 'Sur de Bogotá', deliveryCost: 9000, routeDay: 'MARTES', cutoffHour: 18, minLiters: 2 },
}

export const DELIVERY_ROUTES: DeliveryRoute[] = [
  { day: 'MARTES', zoneId: 'SUR', dayIndex: 2 },
  { day: 'MIÉRCOLES', zoneId: 'CHIA', dayIndex: 3 },
  { day: 'MIÉRCOLES', zoneId: 'CAJICA', dayIndex: 3 },
  { day: 'JUEVES', zoneId: 'SUBA', dayIndex: 4 },
  { day: 'VIERNES', zoneId: 'COTA', dayIndex: 5 },
  { day: 'SÁBADO', zoneId: 'CALLE_80', dayIndex: 6 },
]

export const ORDER_STATUSES = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAYMENT_REPORTED: 'PAYMENT_REPORTED',
  PAID: 'PAID',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  IN_PRODUCTION: 'IN_PRODUCTION',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES]

/**
 * Tarifa de entrega según zona y condición del cliente.
 * El domicilio es $0 ÚNICAMENTE si:
 *   - El cliente es Fundador (isFounder: true)
 *   - O la zona es Cota
 */
export function getDeliveryCost(zoneId: string, isFounder = false): number {
  if (isFounder) return 0
  const zone = ZONES[zoneId]
  if (!zone) return 0
  if (zone.id === 'COTA') return 0
  return zone.deliveryCost
}

/**
 * Valida si un pedido cumple con el mínimo de litros requerido por la zona.
 * Retorna { valid: boolean, message?: string }
 */
export function validateZoneMinLiters(zoneId: string, totalLiters: number): { valid: boolean; message?: string } {
  const zone = ZONES[zoneId]
  if (!zone || !zone.minLiters) return { valid: true }
  if (totalLiters < zone.minLiters) {
    return {
      valid: false,
      message: `El pedido mínimo para ${zone.name} es de ${zone.minLiters} litros.`
    }
  }
  return { valid: true }
}

// ─── Regla de negocio: azúcar (con/sin) ─────────────────────────
// El yogur Griego es el natural/cremoso y NO lleva selector de azúcar.
// Los 4 sabores de fruta (Mora, Mango, Fresa, Feijoa) sí ofrecen con/sin.
export const SUGAR_OPTIONS = ['CON', 'SIN'] as const
export type SugarOption = (typeof SUGAR_OPTIONS)[number]

/** Producto que NO ofrece selector de azúcar (el Griego natural). */
export const PRODUCT_WITHOUT_SUGAR_OPTION = 'GRIEGO'

/**
 * Normaliza la preferencia de azúcar de una línea de producto.
 * - Griego → siempre undefined (no aplica).
 * - Sabores de fruta → 'CON' por defecto; 'SIN' solo si se pidió explícito.
 */
export function resolveSugar(productId: string, sugar?: string): SugarOption | undefined {
  if (productId === PRODUCT_WITHOUT_SUGAR_OPTION) return undefined
  return sugar === 'SIN' ? 'SIN' : 'CON'
}

/** Etiqueta legible para mostrar en Telegram / UI. */
export function sugarLabel(sugar?: SugarOption): string {
  return sugar === 'SIN' ? 'sin azúcar' : 'con azúcar'
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS[id]
}

export function getZoneById(id: string): Zone | undefined {
  return ZONES[id]
}