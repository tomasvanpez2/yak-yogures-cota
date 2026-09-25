'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Customer } from '@/lib/client-types'
import { BOTTLES_FOR_FREE } from '@/lib/client-types'
import { ZONES } from '@/lib/config'

// ─── Tipos locales ──────────────────────────────────────────────
interface Metrics {
  kpis: {
    totalCustomers: number
    totalFounders: number
    revenue: number
    totalOrders: number
    paidOrders: number
    totalUnits: number
    bottlesRecovered: number
    totalBottleDiscount: number
    totalLoyaltyDiscount: number
    pendingPayment: number
  }
  revenueByZone: Record<string, number>
  ordersByZone: Record<string, number>
  ordersByWeek: { week: string; count: number; revenue: number }[]
  revenueByWeek: { week: string; revenue: number }[]
  unitsByFlavor: { flavor: string; units: number }[]
  customersByWeek: { week: string; newCustomers: number; totalCustomers: number }[]
  bottlesReturnedByWeek: { week: string; bottles: number }[]
  ordersByStatus: Record<string, number>
  topLoyaltyCustomers: {
    name: string
    phone: string
    zone: string
    bottlesHistory: number
    bottlesInPossession: number
    progressPercent: number
    isFounder: boolean
  }[]
  recentOrders: {
    id: string
    customerName: string
    phone: string
    zone: string
    status: string
    total: number
    totalUnits: number
    bottlesReturned: number
    deliveryDay: string
    createdAt: string
  }[]
}

type Screen = 'loading' | 'login' | 'panel'

const emptyForm = {
  name: '',
  phone: '',
  zone: 'COTA',
  address: '',
  apartment: '',
  instructions: '',
}

export default function AdminPrivatePanelPage() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [verifying, setVerifying] = useState(false)

  const [customers, setCustomers] = useState<Customer[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formMsg, setFormMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingForm, setSavingForm] = useState(false)
  const [search, setSearch] = useState('')

  // ─── Verificar sesión al cargar ───
  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d) => setScreen(d.authenticated ? 'panel' : 'login'))
      .catch(() => setScreen('login'))
  }, [])

  // ─── Cargar datos del panel ───
  const loadPanelData = useCallback(async () => {
    try {
      const [cRes, mRes] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/metrics'),
      ])
      if (cRes.status === 401 || mRes.status === 401) {
        setScreen('login')
        return
      }
      const cData = await cRes.json()
      const mData = await mRes.json()
      setCustomers(cData.customers || [])
      setMetrics(mData)
    } catch {
      // silencioso
    }
  }, [])

  useEffect(() => {
    if (screen === 'panel') loadPanelData()
  }, [screen, loadPanelData])

  // ─── Login 2FA ───
  const handleVerify = async () => {
    setVerifying(true)
    setCodeError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (data.success) {
        setScreen('panel')
        setCode('')
      } else {
        setCodeError(data.error || 'Código incorrecto')
      }
    } catch {
      setCodeError('Error de conexión')
    } finally {
      setVerifying(false)
    }
  }

  // ─── Registro / edición de clientes ───
  const handleSaveCustomer = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setFormMsg({ ok: false, text: 'Nombre, teléfono y dirección son obligatorios.' })
      return
    }
    setSavingForm(true)
    setFormMsg(null)
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, isFounder: true }),
      })
      const data = await res.json()
      if (data.success) {
        setFormMsg({
          ok: true,
          text: `⭐ ${data.customer.name} registrado como Cliente Fundador (domicilio $0).`,
        })
        setForm(emptyForm)
        loadPanelData()
      } else {
        setFormMsg({ ok: false, text: data.error || 'Error al guardar' })
      }
    } catch {
      setFormMsg({ ok: false, text: 'Error de conexión' })
    } finally {
      setSavingForm(false)
    }
  }

  const handleToggleFounder = async (c: Customer) => {
    await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: c.phone, isFounder: !c.isFounder }),
    })
    loadPanelData()
  }

  const handleAdjustBottles = async (c: Customer, field: 'bottlesInPossession' | 'bottlesHistory', delta: number) => {
    const current = c[field] || 0
    const next = Math.max(0, current + delta)
    await fetch('/api/admin/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: c.phone, [field]: next }),
    })
    loadPanelData()
  }

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.name.toLowerCase().includes(q) || c.phone.includes(q)
  })

  // ─── Pantalla de login 2FA ───
  if (screen === 'loading') {
    return (
      <main className="min-h-screen bg-yak-navy flex items-center justify-center">
        <p className="text-white/50 text-sm font-display animate-pulse">Verificando acceso…</p>
      </main>
    )
  }

  if (screen === 'login') {
    return (
      <main className="min-h-screen bg-yak-navy flex items-center justify-center px-6">
        <div className="w-full max-w-sm bg-yak-cream rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yak-navy text-white text-2xl mb-4">
              🔐
            </span>
            <h1 className="font-display font-extrabold text-2xl text-yak-navy">Acceso privado</h1>
            <p className="text-xs text-yak-muted mt-1">
              Panel de Clientes Fundadores · YAK
            </p>
          </div>
          <label className="block text-xs font-bold text-yak-muted uppercase tracking-wider mb-2">
            Código de autenticación (2FA)
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleVerify()}
            placeholder="••••••"
            className="w-full text-center text-2xl font-mono tracking-[0.5em] py-3 rounded-2xl border-2 border-yak-griego bg-white text-yak-navy focus:outline-none focus:border-yak-navy"
          />
          {codeError && <p className="text-xs text-yak-fresa mt-2 text-center font-medium">{codeError}</p>}
          <button
            onClick={handleVerify}
            disabled={verifying || code.length !== 6}
            className="w-full mt-4 py-3 rounded-full bg-yak-navy text-white font-bold text-sm hover:bg-yak-navy/90 transition-colors disabled:opacity-40"
          >
            {verifying ? 'Verificando…' : 'Ingresar'}
          </button>
          <p className="text-[11px] text-yak-muted/70 text-center mt-4 leading-relaxed">
            Compatible con Google Authenticator y Llavero de iCloud.
          </p>
        </div>
      </main>
    )
  }

  // ─── Panel principal ───
  return (
    <main className="min-h-screen bg-yak-cream pb-20">
      {/* Header */}
      <header className="bg-yak-navy text-white px-6 py-5 sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-semibold">
              YAK · Panel privado
            </p>
            <h1 className="font-display font-extrabold text-xl">Clientes Fundadores</h1>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/admin/auth', { method: 'DELETE' })
              setScreen('login')
            }}
            className="text-xs font-semibold px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 space-y-10 pt-8">
        {/* ─── KPIs ─── */}
        {metrics && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Clientes', value: metrics.kpis.totalCustomers, icon: '👥' },
              { label: 'Fundadores ⭐', value: metrics.kpis.totalFounders, icon: '🏆' },
              { label: 'Ventas (pagados)', value: `$${metrics.kpis.revenue.toLocaleString('es-CO')}`, icon: '💰' },
              { label: 'Botellas recuperadas', value: metrics.kpis.bottlesRecovered, icon: '♻️' },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-2xl p-4 border border-yak-griego shadow-sm">
                <p className="text-lg">{k.icon}</p>
                <p className="font-display font-extrabold text-xl text-yak-navy mt-1">{k.value}</p>
                <p className="text-[11px] text-yak-muted font-semibold uppercase tracking-wide">{k.label}</p>
              </div>
            ))}
          </section>
        )}

        {/* ─── Registro de Fundadores ─── */}
        <section className="bg-white rounded-3xl border border-yak-griego shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-yak-griego bg-yak-griego/30">
            <h2 className="font-display font-bold text-lg text-yak-navy">
              ⭐ Registrar Cliente Fundador
            </h2>
            <p className="text-xs text-yak-muted mt-0.5">
              Los fundadores nunca pagan domicilio, sin importar la zona.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-yak-muted uppercase tracking-wide mb-1">Nombre</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-yak-griego text-sm focus:outline-none focus:border-yak-navy"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-yak-muted uppercase tracking-wide mb-1">WhatsApp (10 dígitos)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-yak-griego text-sm focus:outline-none focus:border-yak-navy"
                placeholder="3001234567"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-yak-muted uppercase tracking-wide mb-1">Zona</label>
              <select
                value={form.zone}
                onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-yak-griego text-sm bg-white focus:outline-none focus:border-yak-navy"
              >
                {Object.values(ZONES).map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-yak-muted uppercase tracking-wide mb-1">Dirección</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-yak-griego text-sm focus:outline-none focus:border-yak-navy"
                placeholder="Calle / Carrera #"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-yak-muted uppercase tracking-wide mb-1">Apto / Conjunto (opcional)</label>
              <input
                value={form.apartment}
                onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-yak-griego text-sm focus:outline-none focus:border-yak-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-yak-muted uppercase tracking-wide mb-1">Instrucciones (opcional)</label>
              <input
                value={form.instructions}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-yak-griego text-sm focus:outline-none focus:border-yak-navy"
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={handleSaveCustomer}
                disabled={savingForm}
                className="w-full py-3 rounded-full bg-yak-navy text-white font-bold text-sm hover:bg-yak-navy/90 transition-colors disabled:opacity-50"
              >
                {savingForm ? 'Guardando…' : 'Registrar como Fundador ⭐'}
              </button>
              {formMsg && (
                <p className={`text-xs mt-2 text-center font-semibold ${formMsg.ok ? 'text-emerald-700' : 'text-yak-fresa'}`}>
                  {formMsg.text}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ─── Gráficas ─── */}
        {metrics && (
          <section className="space-y-6">
            {/* Fila 1: Pedidos por semana + Ingresos por semana */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pedidos por semana (barras) */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">📦 Pedidos por semana</h3>
                <div className="flex items-end gap-2 h-40">
                  {metrics.ordersByWeek.map((w) => {
                    const max = Math.max(1, ...metrics.ordersByWeek.map((x) => x.count))
                    return (
                      <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-yak-navy">{w.count || ''}</span>
                        <div
                          className="w-full rounded-t-lg bg-yak-mango/80 transition-all"
                          style={{ height: `${(w.count / max) * 100}%`, minHeight: w.count > 0 ? 6 : 2 }}
                        />
                        <span className="text-[9px] text-yak-muted">{w.week}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Ingresos por semana (línea) */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">💰 Ingresos por semana</h3>
                <RevenueLineChart data={metrics.revenueByWeek} />
              </div>
            </div>

            {/* Fila 2: Unidades por sabor + Ventas por zona */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Unidades por sabor */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">🍓 Unidades por sabor</h3>
                <FlavorBarChart data={metrics.unitsByFlavor} />
              </div>

              {/* Ventas por zona */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">📍 Ventas por zona</h3>
                <div className="space-y-2.5">
                  {Object.entries(metrics.revenueByZone).length === 0 && (
                    <p className="text-xs text-yak-muted">Sin ventas registradas aún.</p>
                  )}
                  {Object.entries(metrics.revenueByZone)
                    .sort((a, b) => b[1] - a[1])
                    .map(([zone, revenue]) => {
                      const max = Math.max(...Object.values(metrics.revenueByZone))
                      return (
                        <div key={zone}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-yak-ink">{ZONES[zone]?.name || zone}</span>
                            <span className="font-bold text-yak-navy">${revenue.toLocaleString('es-CO')}</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-yak-griego overflow-hidden">
                            <div
                              className="h-full rounded-full bg-yak-navy transition-all"
                              style={{ width: `${(revenue / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>

            {/* Fila 3: Clientes nuevos vs acumulados + Botellas devueltas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clientes por semana */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">👥 Clientes: nuevos vs acumulados</h3>
                <CustomersLineChart data={metrics.customersByWeek} />
              </div>

              {/* Botellas devueltas por semana */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">♻️ Botellas devueltas por semana</h3>
                <BottlesBarChart data={metrics.bottlesReturnedByWeek} />
              </div>
            </div>

            {/* Fila 4: Estados de pedidos (donut) + Top clientes fidelidad */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estados de pedidos */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">📊 Estados de pedidos</h3>
                <StatusDonutChart data={metrics.ordersByStatus} />
              </div>

              {/* Top clientes fidelidad (tabla visual) */}
              <div className="bg-white rounded-3xl border border-yak-griego shadow-sm p-6">
                <h3 className="font-display font-bold text-yak-navy mb-4">🏆 Top Fidelidad 10+1</h3>
                <TopLoyaltyTable data={metrics.topLoyaltyCustomers} />
              </div>
            </div>
          </section>
        )}

        {/* ─── Tabla de clientes ─── */}
        <section className="bg-white rounded-3xl border border-yak-griego shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-yak-griego flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-display font-bold text-lg text-yak-navy">👥 Todos los clientes</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="px-3 py-2 rounded-xl border border-yak-griego text-xs w-56 focus:outline-none focus:border-yak-navy"
            />
          </div>
          <div className="divide-y divide-yak-griego/60">
            {filtered.length === 0 && (
              <p className="px-6 py-8 text-sm text-yak-muted text-center">No hay clientes todavía.</p>
            )}
            {filtered.map((c) => (
              <div key={c.phone} className="px-6 py-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-48">
                  <p className="font-display font-bold text-sm text-yak-ink">
                    {c.name} {c.isFounder && <span className="text-yak-mango">⭐</span>}
                  </p>
                  <p className="text-xs text-yak-muted font-mono">
                    {c.phone} · {ZONES[c.zone]?.name || c.zone}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-yak-griego overflow-hidden">
                      <div
                        className="h-full bg-yak-feijoa rounded-full"
                        style={{ width: `${((c.bottlesHistory || 0) % BOTTLES_FOR_FREE) * 10}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-yak-muted">
                      {(c.bottlesHistory || 0) % BOTTLES_FOR_FREE}/{BOTTLES_FOR_FREE} → gratis
                    </span>
                  </div>
                </div>

                {/* Botellas en posesión */}
                <div className="flex items-center gap-1.5 bg-yak-cream rounded-xl px-2 py-1.5 border border-yak-griego">
                  <span className="text-[10px] text-yak-muted font-bold uppercase">En casa</span>
                  <button onClick={() => handleAdjustBottles(c, 'bottlesInPossession', -1)} className="w-6 h-6 rounded-full bg-white border border-yak-griego text-xs font-bold hover:border-yak-navy">−</button>
                  <span className="w-5 text-center text-sm font-bold text-yak-navy">{c.bottlesInPossession || 0}</span>
                  <button onClick={() => handleAdjustBottles(c, 'bottlesInPossession', 1)} className="w-6 h-6 rounded-full bg-white border border-yak-griego text-xs font-bold hover:border-yak-navy">+</button>
                </div>

                {/* Historial */}
                <div className="flex items-center gap-1.5 bg-yak-cream rounded-xl px-2 py-1.5 border border-yak-griego">
                  <span className="text-[10px] text-yak-muted font-bold uppercase">Histórico</span>
                  <button onClick={() => handleAdjustBottles(c, 'bottlesHistory', -1)} className="w-6 h-6 rounded-full bg-white border border-yak-griego text-xs font-bold hover:border-yak-navy">−</button>
                  <span className="w-5 text-center text-sm font-bold text-yak-navy">{c.bottlesHistory || 0}</span>
                  <button onClick={() => handleAdjustBottles(c, 'bottlesHistory', 1)} className="w-6 h-6 rounded-full bg-white border border-yak-griego text-xs font-bold hover:border-yak-navy">+</button>
                </div>

                <button
                  onClick={() => handleToggleFounder(c)}
                  className={`text-xs font-bold px-3 py-2 rounded-full transition-colors ${
                    c.isFounder
                      ? 'bg-yak-mango/15 text-yak-mango border border-yak-mango/30 hover:bg-yak-mango/25'
                      : 'bg-yak-griego text-yak-muted hover:text-yak-ink border border-yak-griego'
                  }`}
                >
                  {c.isFounder ? '⭐ Fundador' : 'Marcar fundador'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Últimos pedidos ─── */}
        {metrics && metrics.recentOrders.length > 0 && (
          <section className="bg-white rounded-3xl border border-yak-griego shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-yak-griego">
              <h2 className="font-display font-bold text-lg text-yak-navy">🧾 Últimos pedidos</h2>
            </div>
            <div className="divide-y divide-yak-griego/60">
              {metrics.recentOrders.map((o) => (
                <div key={o.id} className="px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-bold text-yak-ink font-mono">{o.id}</p>
                    <p className="text-xs text-yak-muted">
                      {o.customerName} · {ZONES[o.zone]?.name || o.zone} · {o.totalUnits} L
                      {o.bottlesReturned > 0 && ` · ♻️ ${o.bottlesReturned} devueltas`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yak-navy font-display">${o.total.toLocaleString('es-CO')}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                      o.status === 'PENDING_PAYMENT' ? 'text-amber-600' :
                      o.status === 'PAYMENT_REPORTED' ? 'text-blue-600' :
                      o.status === 'PAID' || o.status === 'DELIVERED' ? 'text-emerald-600' : 'text-yak-muted'
                    }`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

/* ─── Componentes de Gráficas ─── */

function RevenueLineChart({ data }: { data: { week: string; revenue: number }[] }) {
  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue))
  const points = data.map((d, i) => ({
    x: (i / Math.max(1, data.length - 1)) * 100,
    y: 100 - (d.revenue / maxRevenue) * 90,
  }))

  return (
    <div className="relative h-48">
      {/* Grid lines */}
      <div className="absolute inset-0">
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} className="absolute left-0 right-0 border-t border-yak-griego/30" style={{ top: `${p}%` }} />
        ))}
      </div>
      {/* Line */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          stroke="#E8A838"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#E8A838" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-yak-muted pt-2">
        {data.map((d) => <span key={d.week}>{d.week}</span>)}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-16 flex flex-col justify-between text-[9px] text-yak-muted pr-1">
        {['', '$' + (maxRevenue / 2).toLocaleString('es-CO'), '$' + maxRevenue.toLocaleString('es-CO')].map((l, i) => (
          <span key={i} className="text-right">{l}</span>
        ))}
      </div>
    </div>
  )
}

function FlavorBarChart({ data }: { data: { flavor: string; units: number }[] }) {
  const maxUnits = Math.max(1, ...data.map((d) => d.units))
  const colors = ['#B8739E', '#E89BB5', '#D4A574', '#B8D4A0', '#F5F5F5']

  return (
    <div className="space-y-2.5 h-48 overflow-y-auto pr-1">
      {data.length === 0 ? (
        <p className="text-xs text-yak-muted text-center py-8">Sin datos de sabores aún.</p>
      ) : (
        data.map((d, i) => (
          <div key={d.flavor} className="flex items-center gap-2">
            <span className="w-20 text-xs font-medium text-yak-ink truncate">{d.flavor}</span>
            <div className="flex-1 h-5 rounded-full bg-yak-griego overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(d.units / maxUnits) * 100}%`, backgroundColor: colors[i % colors.length] }}
              />
            </div>
            <span className="w-16 text-right text-xs font-bold text-yak-navy">{d.units}</span>
          </div>
        ))
      )}
    </div>
  )
}

function CustomersLineChart({ data }: { data: { week: string; newCustomers: number; totalCustomers: number }[] }) {
  const maxTotal = Math.max(1, ...data.map((d) => d.totalCustomers))
  const pointsNew = data.map((d, i) => ({
    x: (i / Math.max(1, data.length - 1)) * 100,
    y: 100 - (d.newCustomers / Math.max(1, ...data.map((x) => x.newCustomers))) * 90,
  }))
  const pointsTotal = data.map((d, i) => ({
    x: (i / Math.max(1, data.length - 1)) * 100,
    y: 100 - (d.totalCustomers / maxTotal) * 90,
  }))

  return (
    <div className="relative h-48">
      {/* Grid lines */}
      <div className="absolute inset-0">
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} className="absolute left-0 right-0 border-t border-yak-griego/30" style={{ top: `${p}%` }} />
        ))}
      </div>
      {/* Total line */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={pointsTotal.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          stroke="#1C1C1E"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
        {pointsTotal.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#1C1C1E" stroke="white" strokeWidth="1.5" opacity="0.6" />
        ))}
      </svg>
      {/* New line */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d={pointsNew.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
          stroke="#E8A838"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pointsNew.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#E8A838" stroke="white" strokeWidth="1.5" />
        ))}
      </svg>
      {/* Legend */}
      <div className="absolute top-2 right-2 flex gap-3 text-[9px]">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-yak-navy opacity-60" /> Acumulados</span>
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-yak-mango" /> Nuevos</span>
      </div>
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[9px] text-yak-muted pt-2">
        {data.map((d) => <span key={d.week}>{d.week}</span>)}
      </div>
    </div>
  )
}

function BottlesBarChart({ data }: { data: { week: string; bottles: number }[] }) {
  const maxBottles = Math.max(1, ...data.map((d) => d.bottles))

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => (
        <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-yak-feijoa">{d.bottles || ''}</span>
          <div
            className="w-full rounded-t-lg bg-yak-feijoa/80 transition-all"
            style={{ height: `${(d.bottles / maxBottles) * 100}%`, minHeight: d.bottles > 0 ? 6 : 2 }}
          />
          <span className="text-[9px] text-yak-muted">{d.week}</span>
        </div>
      ))}
    </div>
  )
}

function StatusDonutChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: '#F59E0B',
    PAYMENT_REPORTED: '#3B82F6',
    PAID: '#10B981',
    IN_PRODUCTION: '#6366F1',
    OUT_FOR_DELIVERY: '#8B5CF6',
    DELIVERED: '#059669',
    PAYMENT_REJECTED: '#EF4444',
    CANCELLED: '#9CA3AF',
    EXPIRED: '#6B7280',
  }
  const statusLabels: Record<string, string> = {
    PENDING_PAYMENT: 'Pendiente pago',
    PAYMENT_REPORTED: 'Pago reportado',
    PAID: 'Pagado',
    IN_PRODUCTION: 'En producción',
    OUT_FOR_DELIVERY: 'En reparto',
    DELIVERED: 'Entregado',
    PAYMENT_REJECTED: 'Rechazado',
    CANCELLED: 'Cancelado',
    EXPIRED: 'Expirado',
  }

  const segments = Object.entries(data)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ status, count, color: statusColors[status] || '#9CA3AF', label: statusLabels[status] || status }))

  let cumulative = 0
  const paths = segments.map((s) => {
    const startAngle = (cumulative / total) * 360 - 90
    const endAngle = ((cumulative + s.count) / total) * 360 - 90
    cumulative += s.count
    const largeArc = (s.count / total) > 0.5 ? 1 : 0
    const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180)
    const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180)
    const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180)
    const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180)
    return (
      <path
        key={s.status}
        d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={s.color}
      />
    )
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="35" fill="none" stroke="#E8E8E8" strokeWidth="8" />
          {paths}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-display font-extrabold text-lg text-yak-navy">{total}</p>
            <p className="text-[10px] text-yak-muted">pedidos</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[10px] w-full max-w-xs">
        {segments.map((s) => (
          <div key={s.status} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-yak-ink truncate">{s.label} ({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopLoyaltyTable({ data }: { data: Metrics['topLoyaltyCustomers'] }) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {data.length === 0 ? (
        <p className="text-xs text-yak-muted text-center py-8">Sin datos de fidelidad aún.</p>
      ) : (
        data.map((c) => (
          <div key={c.phone} className="flex items-center gap-2 p-2 rounded-xl bg-yak-cream/50 border border-yak-griego/50">
            <div className="w-6 h-6 rounded-full bg-yak-navy/10 flex items-center justify-center text-[10px] font-bold text-yak-navy">
              {c.isFounder ? '⭐' : String(c.progressPercent / 10 || 0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-yak-ink truncate">{c.name} {c.isFounder && <span className="text-yak-mango">⭐</span>}</p>
              <p className="text-[10px] text-yak-muted font-mono">{c.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-yak-feijoa">{c.bottlesHistory} botellas</p>
              <div className="w-20 h-1.5 rounded-full bg-yak-griego overflow-hidden">
                <div className="h-full bg-yak-feijoa" style={{ width: `${c.progressPercent}%` }} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}