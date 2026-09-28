import { describe, it, expect } from 'vitest'
import { calculateDeliveryDate, isDeliveryDay } from '../delivery-engine'
import { PRODUCTS, ZONES, DELIVERY_ROUTES, getDeliveryCost, validateZoneMinLiters } from '../config'

/*
 * Referencias de fechas (hora local):
 * 2024-09-16 LUN · 2024-09-17 MAR · 2024-09-18 MIÉ · 2024-09-19 JUE
 * 2024-09-20 VIE · 2024-09-21 SÁB · 2024-09-22 DOM · 2024-09-23 LUN
 * 2024-09-24 MAR · 2024-09-26 JUE · 2024-09-28 SÁB · 2024-10-01 MAR
 * 2024-10-02 MIÉ · 2024-12-31 MAR · 2025-01-07 MAR
 *
 * Rutas (corte = 2 días antes de la entrega, 6:00 PM):
 * SUR      entrega MARTES   corte DOMINGO 18:00
 * CHIA     entrega MIÉRCOLES corte LUNES 18:00
 * CAJICA   entrega MIÉRCOLES corte LUNES 18:00
 * SUBA     entrega JUEVES   corte MARTES 18:00
 * COTA     entrega VIERNES  corte MIÉRCOLES 18:00
 * CALLE_80 entrega SÁBADO   corte JUEVES 18:00
 */

describe('Delivery Engine — Reglas comerciales por ruta', () => {
  describe('Martes (Sur) — corte domingo 18:00', () => {
    const zone = 'SUR'

    it('pedido antes del corte (dom 17:59) entrega el martes cercano', () => {
      const orderDate = new Date('2024-09-22T17:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MARTES')
      expect(result.deliveryDate.getDate()).toBe(24)
      expect(result.isWithinCutoff).toBe(true)
      expect(result.cutoffDay).toBe('DOMINGO')
      expect(result.cutoffTime).toBe('18:00')
    })

    it('pedido exactamente en el corte (dom 18:00) va a la siguiente semana', () => {
      const orderDate = new Date('2024-09-22T18:00:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MARTES')
      expect(result.deliveryDate.getDate()).toBe(1)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido después del corte (dom 18:01) va a la siguiente semana', () => {
      const orderDate = new Date('2024-09-22T18:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MARTES')
      expect(result.deliveryDate.getDate()).toBe(1)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido temprano en la semana (lun 10:00) → siguiente martes (corte domingo ya pasó)', () => {
      const orderDate = new Date('2024-09-16T10:00:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MARTES')
      expect(result.deliveryDate.getDate()).toBe(24) // siguiente martes
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido antes del corte + pago a tiempo conserva la ruta', () => {
      const orderDate = new Date('2024-09-22T17:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-22T22:00:00'))
      expect(result.dayName).toBe('MARTES')
      expect(result.isWithinCutoff).toBe(true)
    })

    it('pedido antes del corte + pago tardío (lunes) pasa la ruta', () => {
      const orderDate = new Date('2024-09-22T17:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-23T09:00:00'))
      expect(result.dayName).toBe('MARTES')
      expect(result.deliveryDate.getDate()).toBe(1)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido después del corte pasa la ruta aunque pague a tiempo', () => {
      const orderDate = new Date('2024-09-22T19:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-22T22:00:00'))
      expect(result.dayName).toBe('MARTES')
      expect(result.isWithinCutoff).toBe(false)
    })
  })

  describe('Miércoles (Chía) — corte lunes 18:00', () => {
    const zone = 'CHIA'

    it('pedido antes del corte (lun 17:59) entrega el miércoles', () => {
      const orderDate = new Date('2024-09-23T17:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.deliveryDate.getDate()).toBe(25)
      expect(result.isWithinCutoff).toBe(true)
      expect(result.cutoffTime).toBe('18:00')
    })

    it('pedido después del corte (lun 18:01) va al siguiente miércoles', () => {
      const orderDate = new Date('2024-09-23T18:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.deliveryDate.getDate()).toBe(2)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido antes del corte + pago tardío (martes) pasa la ruta', () => {
      const orderDate = new Date('2024-09-23T17:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-24T08:00:00'))
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.isWithinCutoff).toBe(false)
    })
  })

  describe('Miércoles (Cajicá) — corte lunes 18:00', () => {
    const zone = 'CAJICA'

    it('pedido antes del corte (lun 17:59) entrega el miércoles', () => {
      const orderDate = new Date('2024-09-23T17:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.deliveryDate.getDate()).toBe(25)
      expect(result.isWithinCutoff).toBe(true)
      expect(result.cutoffDay).toBe('LUNES')
    })

    it('pedido después del corte (lun 18:01) va al siguiente miércoles', () => {
      const orderDate = new Date('2024-09-23T18:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.deliveryDate.getDate()).toBe(2)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido antes del corte + pago tardío (martes) pasa la ruta', () => {
      const orderDate = new Date('2024-09-23T17:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-24T08:00:00'))
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.isWithinCutoff).toBe(false)
    })
  })

  describe('Jueves (Suba) — corte martes 18:00', () => {
    const zone = 'SUBA'

    it('caso 1: pedido lun 17:59 + pago lun 23:59 → jueves de esa semana', () => {
      const orderDate = new Date('2024-09-16T17:59:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-16T23:59:00'))
      expect(result.dayName).toBe('JUEVES')
      expect(result.deliveryDate.getDate()).toBe(19)
      expect(result.isWithinCutoff).toBe(true)
    })

    it('caso 2: pedido después del corte (mar 18:01) → siguiente jueves', () => {
      const orderDate = new Date('2024-09-17T18:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('JUEVES')
      expect(result.deliveryDate.getDate()).toBe(26)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('caso 3: pedido antes del corte + pago miércoles → siguiente jueves', () => {
      const orderDate = new Date('2024-09-17T17:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-18T08:00:00'))
      expect(result.dayName).toBe('JUEVES')
      expect(result.deliveryDate.getDate()).toBe(26)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('caso 4: pedido temprano el día del corte (mar 10:00) → jueves cercano', () => {
      const orderDate = new Date('2024-09-17T10:00:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('JUEVES')
      expect(result.deliveryDate.getDate()).toBe(19)
      expect(result.isWithinCutoff).toBe(true)
    })
  })

  describe('Viernes (Cota) — corte miércoles 18:00', () => {
    const zone = 'COTA'

    it('pedido antes del corte (mié 17:59) entrega el viernes', () => {
      const orderDate = new Date('2024-09-18T17:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('VIERNES')
      expect(result.deliveryDate.getDate()).toBe(20)
      expect(result.isWithinCutoff).toBe(true)
      expect(result.cutoffDay).toBe('MIÉRCOLES')
    })

    it('pedido después del corte (mié 18:01) va al siguiente viernes', () => {
      const orderDate = new Date('2024-09-18T18:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('VIERNES')
      expect(result.deliveryDate.getDate()).toBe(27)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido antes del corte + pago tardío (jueves) pasa la ruta', () => {
      const orderDate = new Date('2024-09-18T17:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-19T10:00:00'))
      expect(result.dayName).toBe('VIERNES')
      expect(result.isWithinCutoff).toBe(false)
    })
  })

  describe('Sábado (Calle 80) — corte jueves 18:00', () => {
    const zone = 'CALLE_80'

    it('pedido antes del corte (jue 17:59) entrega el sábado', () => {
      const orderDate = new Date('2024-09-19T17:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('SÁBADO')
      expect(result.deliveryDate.getDate()).toBe(21)
      expect(result.isWithinCutoff).toBe(true)
      expect(result.cutoffDay).toBe('JUEVES')
    })

    it('pedido después del corte (jue 18:01) va al siguiente sábado', () => {
      const orderDate = new Date('2024-09-19T18:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('SÁBADO')
      expect(result.deliveryDate.getDate()).toBe(28)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('domingo no es día de entrega', () => {
      expect(isDeliveryDay('DOMINGO')).toBe(false)
    })
  })
})

describe('Delivery Engine — bordes temporales', () => {
  it('cambio de mes: pedido dentro del corte (dom 29 sep 17:59) cruza a octubre', () => {
    const orderDate = new Date('2024-09-29T17:59:00') // domingo
    const result = calculateDeliveryDate(orderDate, 'SUR')
    expect(result.dayName).toBe('MARTES')
    expect(result.deliveryDate.getDate()).toBe(1)
    expect(result.deliveryDate.getMonth()).toBe(9) // octubre (0-indexado)
    expect(result.isWithinCutoff).toBe(true)
  })

  it('cambio de año: pedido antes del corte entrega en enero del siguiente año', () => {
    const orderDate = new Date('2024-12-31T17:59:00') // martes
    const result = calculateDeliveryDate(orderDate, 'SUR')
    expect(result.dayName).toBe('MARTES')
    expect(result.deliveryDate.getFullYear()).toBe(2025)
    expect(result.deliveryDate.getDate()).toBe(7)
    expect(result.isWithinCutoff).toBe(true)
  })

  it('cambio de año: pedido con corte pasado entrega en enero del siguiente año', () => {
    const orderDate = new Date('2024-12-30T10:00:00') // lunes
    const result = calculateDeliveryDate(orderDate, 'SUR')
    expect(result.dayName).toBe('MARTES')
    expect(result.deliveryDate.getFullYear()).toBe(2025)
    expect(result.isWithinCutoff).toBe(false)
  })
})

describe('Delivery Engine — casos inválidos y configuración', () => {
  it('lanza error con zona inválida', () => {
    expect(() => calculateDeliveryDate(new Date(), 'INVALID')).toThrow('Zona inválida')
  })

  it('todas las zonas tienen corte a las 18:00', () => {
    for (const zone of Object.values(ZONES)) {
      expect(zone.cutoffHour).toBe(18)
    }
  })

  it('todas las rutas tienen entrega en un día hábil (ninguna el domingo)', () => {
    expect(DELIVERY_ROUTES.every((r) => r.dayIndex !== 0)).toBe(true)
  })

  it('están configuradas las 6 rutas comerciales', () => {
    expect(DELIVERY_ROUTES).toHaveLength(6)
    expect(DELIVERY_ROUTES.map((r) => r.zoneId).sort()).toEqual(
      ['CAJICA', 'CALLE_80', 'CHIA', 'COTA', 'SUBA', 'SUR'].sort()
    )
  })

  it('tarifas de domicilio oficiales', () => {
    expect(ZONES.COTA.deliveryCost).toBe(0)
    expect(ZONES.CHIA.deliveryCost).toBe(6000)
    expect(ZONES.CAJICA.deliveryCost).toBe(7000)
    expect(ZONES.CALLE_80.deliveryCost).toBe(7000)
    expect(ZONES.SUBA.deliveryCost).toBe(6000)
    expect(ZONES.SUR.deliveryCost).toBe(9000)
  })

  it('domicilio gratis para fundadores y Cota; tarifa normal para resto', () => {
    // Fundador: domicilio gratis en cualquier zona
    expect(getDeliveryCost('CHIA', true)).toBe(0)
    expect(getDeliveryCost('SUR', true)).toBe(0)
    expect(getDeliveryCost('CALLE_80', true)).toBe(0)
    // Cota: domicilio gratis para todos
    expect(getDeliveryCost('COTA', false)).toBe(0)
    expect(getDeliveryCost('COTA', true)).toBe(0)
    // Resto: tarifa oficial
    expect(getDeliveryCost('CHIA', false)).toBe(6000)
    expect(getDeliveryCost('CAJICA', false)).toBe(7000)
    expect(getDeliveryCost('CALLE_80', false)).toBe(7000)
    expect(getDeliveryCost('SUBA', false)).toBe(6000)
    expect(getDeliveryCost('SUR', false)).toBe(9000)
  })

  it('Sur exige mínimo de 2 litros; resto de zonas sin mínimo', () => {
    expect(ZONES.SUR.minLiters).toBe(2)
    expect(validateZoneMinLiters('SUR', 1).valid).toBe(false)
    expect(validateZoneMinLiters('SUR', 2).valid).toBe(true)
    expect(validateZoneMinLiters('SUR', 3).valid).toBe(true)
    expect(validateZoneMinLiters('CHIA', 1).valid).toBe(true)
    expect(validateZoneMinLiters('COTA', 1).valid).toBe(true)
  })
})

describe('Catálogo oficial — 5 productos', () => {
  it('existen exactamente 5 productos', () => {
    expect(Object.keys(PRODUCTS)).toHaveLength(5)
  })

  it('los precios oficiales son correctos', () => {
    expect(PRODUCTS.GRIEGO.price).toBe(25000)
    expect(PRODUCTS.MORA.price).toBe(19000)
    expect(PRODUCTS.FRESA.price).toBe(19000)
    expect(PRODUCTS.FEIJOA.price).toBe(19000)
    expect(PRODUCTS.MANGO.price).toBe(19000)
  })
})
