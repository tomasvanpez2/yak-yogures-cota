import { NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { listCustomers, listOrders } from '@/lib/store'
import { BOTTLES_FOR_FREE } from '@/lib/client-types'
import { PRODUCTS } from '@/lib/config'

// GET: Métricas y datos para gráficas del panel de administración
export async function GET() {
  if (!verifyAdminSession()) {
    return NextResponse.json(
      { error: 'No autorizado. Se requiere autenticación 2FA.' },
      { status: 401 }
    )
  }

  try {
    const [customers, orders] = await Promise.all([listCustomers(500), listOrders(500)])

    // ─── KPIs principales ───
    const paidOrders = orders.filter(
      (o) => ['PAID', 'IN_PRODUCTION', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
    )
    const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
    const totalUnits = paidOrders.reduce((sum, o) => sum + o.totalUnits, 0)
    const bottlesRecovered = paidOrders.reduce((sum, o) => sum + (o.bottlesReturned || 0), 0)
    const totalBottleDiscount = paidOrders.reduce((sum, o) => sum + (o.bottleDiscount || 0), 0)
    const totalLoyaltyDiscount = paidOrders.reduce((sum, o) => sum + (o.loyaltyDiscount || 0), 0)

    // ─── Ventas por día de ruta (zona) ───
    const revenueByZone: Record<string, number> = {}
    const ordersByZone: Record<string, number> = {}
    for (const o of paidOrders) {
      const zone = o.customer?.zone || 'OTRO'
      revenueByZone[zone] = (revenueByZone[zone] || 0) + o.total
      ordersByZone[zone] = (ordersByZone[zone] || 0) + 1
    }

    // ─── Pedidos por semana (últimas 8 semanas ISO) ───
    const ordersByWeek: { week: string; count: number; revenue: number }[] = []
    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7 - 6)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekOrders = paidOrders.filter((o) => {
        const d = new Date(o.createdAt)
        return d >= weekStart && d <= weekEnd
      })
      ordersByWeek.push({
        week: `S${i === 0 ? 'actual' : `-${i}`}`,
        count: weekOrders.length,
        revenue: weekOrders.reduce((s, o) => s + o.total, 0),
      })
    }

    // ─── Ingresos por semana (para gráfica de línea) ───
    const revenueByWeek = ordersByWeek.map((w) => ({
      week: w.week,
      revenue: w.revenue,
    }))

    // ─── Unidades por sabor ───
    const unitsByFlavor: Record<string, number> = {}
    for (const o of paidOrders) {
      for (const item of o.items) {
        unitsByFlavor[item.productId] = (unitsByFlavor[item.productId] || 0) + item.quantity
      }
    }
    const flavorData = Object.entries(unitsByFlavor)
      .map(([productId, units]) => ({
        flavor: PRODUCTS[productId]?.name?.replace('Yogur de ', '').replace('Yogur ', '') || productId,
        units,
      }))
      .sort((a, b) => b.units - a.units)

    // ─── Clientes por semana (crecimiento) ───
    const customersByWeek: { week: string; newCustomers: number; totalCustomers: number }[] = []
    let cumulativeCustomers = 0
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7 - 6)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const newCustomers = customers.filter((c) => {
        const d = new Date(c.createdAt)
        return d >= weekStart && d <= weekEnd
      }).length
      cumulativeCustomers += newCustomers
      customersByWeek.push({
        week: `S${i === 0 ? 'actual' : `-${i}`}`,
        newCustomers,
        totalCustomers: cumulativeCustomers,
      })
    }

    // ─── Devoluciones de botellas por semana ───
    const bottlesReturnedByWeek: { week: string; bottles: number }[] = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7 - 6)
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekOrders = paidOrders.filter((o) => {
        const d = new Date(o.createdAt)
        return d >= weekStart && d <= weekEnd
      })
      const bottles = weekOrders.reduce((sum, o) => sum + (o.bottlesReturned || 0), 0)
      bottlesReturnedByWeek.push({
        week: `S${i === 0 ? 'actual' : `-${i}`}`,
        bottles,
      })
    }

    // ─── Distribución de estados ───
    const ordersByStatus: Record<string, number> = {}
    for (const o of orders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1
    }

    // ─── Clientes ───
    const founders = customers.filter((c) => c.isFounder)
    const topLoyaltyCustomers = [...customers]
      .sort((a, b) => (b.bottlesHistory || 0) - (a.bottlesHistory || 0))
      .slice(0, 10)
      .map((c) => ({
        name: c.name,
        phone: c.phone,
        zone: c.zone,
        bottlesHistory: c.bottlesHistory || 0,
        bottlesInPossession: c.bottlesInPossession || 0,
        progressPercent: Math.round(((c.bottlesHistory || 0) % BOTTLES_FOR_FREE) * 10),
        isFounder: c.isFounder,
      }))

    // ─── Últimos pedidos ───
    const recentOrders = orders.slice(0, 20).map((o) => ({
      id: o.id,
      customerName: o.customer.name,
      phone: o.customer.phone,
      zone: o.customer.zone,
      status: o.status,
      total: o.total,
      totalUnits: o.totalUnits,
      bottlesReturned: o.bottlesReturned || 0,
      deliveryDay: o.deliveryDay,
      createdAt: o.createdAt,
    }))

    // ─── Pendientes de pago ───
    const pendingPayment = orders.filter(
      (o) => o.status === 'PENDING_PAYMENT' || o.status === 'PAYMENT_REPORTED'
    ).length

    return NextResponse.json({
      success: true,
      kpis: {
        totalCustomers: customers.length,
        totalFounders: founders.length,
        revenue,
        totalOrders: orders.length,
        paidOrders: paidOrders.length,
        totalUnits,
        bottlesRecovered,
        totalBottleDiscount,
        totalLoyaltyDiscount,
        pendingPayment,
      },
      revenueByZone,
      ordersByZone,
      ordersByWeek,
      revenueByWeek,
      unitsByFlavor: flavorData,
      customersByWeek,
      bottlesReturnedByWeek,
      ordersByStatus,
      topLoyaltyCustomers,
      recentOrders,
    })
  } catch (error) {
    console.error('[admin/metrics] Error calculando métricas:', error)
    return NextResponse.json({ error: 'Error al calcular métricas' }, { status: 500 })
  }
}