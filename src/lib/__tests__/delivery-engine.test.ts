import { describe, it, expect } from 'vitest'
import { calculateDeliveryDate, isDeliveryDay } from '../delivery-engine'
import { PRODUCTS, ZONES, DELIVERY_ROUTES, getDeliveryCost } from '../config'

/*
 * Referencias de fechas (hora local):
 * 2024-09-16 LUN · 2024-09-17 MAR · 2024-09-18 MIÉ · 2024-09-19 JUE
 * 2024-09-20 VIE · 2024-09-21 SÁB · 2024-09-22 DOM · 2024-09-23 LUN
 * 2024-09-24 MAR · 2024-09-26 JUE · 2024-09-28 SÁB · 2024-10-01 MAR
 * 2024-10-02 MIÉ · 2024-12-31 MAR · 2025-01-07 MAR
 *
 * Rutas (corte = 2 días antes de la entrega):
 * CHIA  entrega LUNES   corte SÁBADO
 * CAJICA entrega MARTES corte DOMINGO
 * CALLE_80 entrega MIÉRCOLES corte LUNES
 * SUBA  entrega JUEVES  corte MARTES
 * SUR   entrega VIERNES corte MIÉRCOLES
 * COTA  entrega SÁBADO  corte JUEVES
 */

describe('Delivery Engine — Reglas comerciales por ruta', () => {
  describe('Lunes (Chía) — corte sábado 14:00', () => {
    const zone = 'CHIA'

    it('pedido antes del corte (sáb 13:59) entrega el lunes cercano', () => {
      const orderDate = new Date('2024-09-21T13:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('LUNES')
      expect(result.deliveryDate.getDate()).toBe(23)
      expect(result.isWithinCutoff).toBe(true)
      expect(result.cutoffDay).toBe('SÁBADO')
    })

    it('pedido exactamente en el corte (sáb 14:00) va a la siguiente semana', () => {
      const orderDate = new Date('2024-09-21T14:00:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('LUNES')
      expect(result.deliveryDate.getDate()).toBe(30)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido después del corte (sáb 14:01) va a la siguiente semana', () => {
      const orderDate = new Date('2024-09-21T14:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('LUNES')
      expect(result.deliveryDate.getDate()).toBe(30)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido temprano en la semana (lun 10:00) entrega el lunes cercano', () => {
      const orderDate = new Date('2024-09-16T10:00:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('LUNES')
      expect(result.isWithinCutoff).toBe(true)
    })

    it('pedido antes del corte + pago a tiempo conserva la ruta', () => {
      const orderDate = new Date('2024-09-21T13:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-21T22:00:00'))
      expect(result.dayName).toBe('LUNES')
      expect(result.isWithinCutoff).toBe(true)
    })

    it('pedido antes del corte + pago tardío (domingo) pasa la ruta', () => {
      const orderDate = new Date('2024-09-21T13:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-22T09:00:00'))
      expect(result.dayName).toBe('LUNES')
      expect(result.deliveryDate.getDate()).toBe(30)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido después del corte pasa la ruta aunque pague a tiempo', () => {
      const orderDate = new Date('2024-09-21T15:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-21T22:00:00'))
      expect(result.dayName).toBe('LUNES')
      expect(result.isWithinCutoff).toBe(false)
    })
  })

  describe('Martes (Cajicá) — corte domingo 14:00', () => {
    const zone = 'CAJICA'

    it('pedido antes del corte (dom 13:59) entrega el martes', () => {
      const orderDate = new Date('2024-09-22T13:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MARTES')
      expect(result.deliveryDate.getDate()).toBe(24)
      expect(result.isWithinCutoff).toBe(true)
    })

    it('pedido después del corte (dom 14:01) va al siguiente martes', () => {
      const orderDate = new Date('2024-09-22T14:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MARTES')
      expect(result.deliveryDate.getDate()).toBe(1) // 1 de octubre
      expect(result.deliveryDate.getMonth()).toBe(9)
      expect(result.isWithinCutoff).toBe(false)
    })
  })

  describe('Miércoles (Calle 80) — corte lunes 14:00', () => {
    const zone = 'CALLE_80'

    it('pedido antes del corte en lunes (13:59) entrega el miércoles', () => {
      const orderDate = new Date('2024-09-23T13:59:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.isWithinCutoff).toBe(true)
      expect(result.cutoffDay).toBe('LUNES')
    })

    it('pedido después del corte en lunes (14:01) va al siguiente miércoles', () => {
      const orderDate = new Date('2024-09-23T14:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.deliveryDate.getDate()).toBe(2)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('pedido antes del corte + pago tardío (martes) pasa la ruta', () => {
      const orderDate = new Date('2024-09-23T13:00:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-24T08:00:00'))
      expect(result.dayName).toBe('MIÉRCOLES')
      expect(result.isWithinCutoff).toBe(false)
    })
  })

  describe('Jueves (Suba) — corte martes 14:00', () => {
    const zone = 'SUBA'

    it('caso 1: pedido lun 13:59 + pago lun 23:59 → jueves de esa semana', () => {
      const orderDate = new Date('2024-09-16T13:59:00')
      const result = calculateDeliveryDate(orderDate, zone, new Date('2024-09-16T23:59:00'))
      expect(result.dayName).toBe('JUEVES')
      expect(result.deliveryDate.getDate()).toBe(19)
      expect(result.isWithinCutoff).toBe(true)
    })

    it('caso 2: pedido después del corte (mar 14:01) → siguiente jueves', () => {
      const orderDate = new Date('2024-09-17T14:01:00')
      const result = calculateDeliveryDate(orderDate, zone)
      expect(result.dayName).toBe('JUEVES')
      expect(result.deliveryDate.getDate()).toBe(26)
      expect(result.isWithinCutoff).toBe(false)
    })

    it('caso 3: pedido antes del corte + pago miércoles → siguiente jueves', () => {
      const orderDate = new Date('2024-09-17T13:00:00')
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

  describe('Viernes (Sur) — corte miércoles 14:00', () => {
    it('pedido antes del corte (mié 13:59) entrega el viernes', () => {
      const orderDate = new Date('2024-09-18T13:59:00')
      const result = calculateDeliveryDate(orderDate, 'SUR')
      expect(result.dayName).toBe('VIERNES')
      expect(result.deliveryDate.getDate()).toBe(20)
      expect(result.isWithinCutoff).toBe(true)
    })
  })

  describe('Sábado (Cota) — corte jueves 14:00', () => {
    it('pedido antes del corte (jue 13:59) entrega el sábado', () => {
      const orderDate = new Date('2024-09-19T13:59:00')
      const result = calculateDeliveryDate(orderDate, 'COTA')
      expect(result.dayName).toBe('SÁBADO')
      expect(result.isWithinCutoff).toBe(true)
    })

    it('pedido después del corte (jue 14:01) va al siguiente sábado', () => {
      const orderDate = new Date('2024-09-19T14:01:00')
      const result = calculateDeliveryDate(orderDate, 'COTA')
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
  it('cambio de mes: pedido dentro del corte (sáb 28 sep 13:59) cruza a octubre', () => {
    const orderDate = new Date('2024-09-28T13:59:00') // sábado
    const result = calculateDeliveryDate(orderDate, 'CAJICA')
    expect(result.dayName).toBe('MARTES')
    expect(result.deliveryDate.getDate()).toBe(1)
    expect(result.deliveryDate.getMonth()).toBe(9) // octubre (0-indexado)
    expect(result.isWithinCutoff).toBe(true)
  })

  it('cambio de año: pedido antes del corte entrega en enero del siguiente año', () => {
    const orderDate = new Date('2024-12-31T13:59:00') // martes
    const result = calculateDeliveryDate(orderDate, 'CAJICA')
    expect(result.dayName).toBe('MARTES')
    expect(result.deliveryDate.getFullYear()).toBe(2025)
    expect(result.deliveryDate.getDate()).toBe(7)
    expect(result.isWithinCutoff).toBe(true)
  })

  it('cambio de año: pedido con corte pasado entrega en enero del siguiente año', () => {
    const orderDate = new Date('2024-12-30T10:00:00') // lunes
    const result = calculateDeliveryDate(orderDate, 'CAJICA')
    expect(result.dayName).toBe('MARTES')
    expect(result.deliveryDate.getFullYear()).toBe(2025)
    expect(result.isWithinCutoff).toBe(false)
  })
})

describe('Delivery Engine — casos inválidos y configuración', () => {
  it('lanza error con zona inválida', () => {
    expect(() => calculateDeliveryDate(new Date(), 'INVALID')).toThrow('Zona inválida')
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
    expect(ZONES.CHIA.deliveryCost).toBe(5000)
    expect(ZONES.CAJICA.deliveryCost).toBe(6000)
    expect(ZONES.CALLE_80.deliveryCost).toBe(8000)
    expect(ZONES.SUBA.deliveryCost).toBe(8000)
    expect(ZONES.SUR.deliveryCost).toBe(12000)
  })

  it('domicilio gratis con 3 o más unidades', () => {
    expect(getDeliveryCost('CHIA', 3)).toBe(0)
    expect(getDeliveryCost('CHIA', 5)).toBe(0)
    expect(getDeliveryCost('CHIA', 1)).toBe(5000)
    expect(getDeliveryCost('SUR', 2)).toBe(12000)
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