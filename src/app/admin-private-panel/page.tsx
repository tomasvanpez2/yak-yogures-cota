'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { Customer } from '@/lib/client-types'
import { BOTTLES_FOR_FREE } from '@/lib/client-types'
import { ZONES } from '@/lib/config'

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

  const reduceMotion = useReducedMotion()
  const springShort = reduceMotion
    ? { duration: 0.12, ease: 'linear' as const }
    : { type: 'spring' as const, bounce: 0, duration: 0.35 }

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((r) => r.json())
      .then((d) => setScreen(d.authenticated ? 'panel' : 'login'))
      .catch(() => setScreen('login'))
  }, [])

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
    }
  }, [])

  useEffect(() => {
    if (screen === 'panel') loadPanelData()
  }, [screen, loadPanelData])

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

  if (screen === 'loading') {
    return (
      <main className="min-h-screen bg-yak-cream">
        <header className="bg-yak-navy text-white px-6 py-5 shadow-lg">
          <div className="max-w-6xl mx-auto">
            <div className="skeleton h-3 w-32 rounded-full mb-3" />
            <div className="skeleton h-7 w-56 rounded-lg" />
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-6 pt-8 space-y-10">
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="surface-card p-5">
                <div className="skeleton-circle w-9 h-9 mb-3" />
                <div className="skeleton h-8 w-24 rounded-lg mb-2" />
                <div className="skeleton-text w-32" />
              </div>
            ))}
          </section>
          <section className="surface-card p-6">
            <div className="skeleton h-6 w-64 rounded-lg mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i}>
                  <div className="skeleton-text w-24 mb-2" />
                  <div className="skeleton h-12 w-full rounded-2xl" />
                </div>
              ))}
              <div className="md:col-span-2">
                <div className="skeleton h-12 w-full rounded-full" />
              </div>
            </div>
          </section>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="surface-card p-6">
                <div className="skeleton h-5 w-48 rounded-lg mb-5" />
                <div className="skeleton h-44 w-full rounded-2xl" />
              </div>
            ))}
          </section>
        </div>
      </main>
    )
  }

  if (screen === 'login') {
    return (
      <main className="min-h-screen bg-yak-navy flex items-center justify-center px-6">
        <div className="w-full max-w-sm surface-elevated p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yak-mango/15 text-yak-mango mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="heading-section text-display-sm text-yak-navy mb-2">Acceso privado</h1>
            <p className="text-body-sm text-yak-muted max-w-xs mx-auto">
              Panel de Clientes Fundadores YAK
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="input-label text-xs">
                Código de autenticación 2FA
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && code.length === 6 && handleVerify()}
                placeholder="••••••"
                className="input-field text-center font-display text-display-sm tracking-[0.4em] py-4"
                style={{ letterSpacing: '0.4em' }}
              />
              <p className="input-hint mt-2 text-center">
                6 dígitos de Google Authenticator o Llavero iCloud
              </p>
            </div>

            {codeError && (
              <div className="inline-error" role="alert">
                <svg className="inline-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="font-semibold text-yak-fresa">{codeError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="btn-primary w-full"
              data-ui-state={verifying ? 'loading' : 'idle'}
            >
              {verifying ? (
                <>
                  <span className="spinner-brand" aria-hidden="true" />
                  Verificando
                </>
              ) : (
                'Ingresar al panel'
              )}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-yak-cream pb-20">
      <header className="bg-yak-navy text-white px-6 py-5 sticky top-0 z-20 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 font-semibold mb-1">
              YAK · Panel privado
            </p>
            <h1 className="heading-section text-white text-lg md:text-xl">Clientes Fundadores</h1>
          </div>
          <button
            onClick={async () => {
              await fetch('/api/admin/auth', { method: 'DELETE' })
              setScreen('login')
            }}
            className="btn-ghost text-white/80 hover:text-white hover:bg-white/10 min-h-[44px] px-4"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Salir
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 space-y-10 pt-8">
        {metrics && (
          <section aria-label="Métricas clave" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Clientes', value: metrics.kpis.totalCustomers, icon: '👥', color: 'text-yak-mango' },
              { label: 'Fundadores ⭐', value: metrics.kpis.totalFounders, icon: '🏆', color: 'text-yak-mango' },
              { label: 'Ventas pagadas', value: `$${metrics.kpis.revenue.toLocaleString('es-CO')}`, icon: '💰', color: 'text-yak-feijoa' },
              { label: 'Botellas recuperadas', value: metrics.kpis.bottlesRecovered, icon: '♻️', color: 'text-yak-feijoa' },
            ].map((k) => (
              <div
                key={k.label}
                className="surface-card p-5 transition-transform duration-180 ease-out-expo hover:pointer-fine:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl" aria-hidden="true">{k.icon}</span>
                </div>
                <p className="font-display font-bold text-price text-yak-navy mb-1 leading-tight">
                  {k.value}
                </p>
                <p className="text-caption text-yak-muted font-semibold uppercase tracking-wide">
                  {k.label}
                </p>
              </div>
            ))}
          </section>
        )}

        <section aria-label="Registrar cliente fundador" className="surface-card overflow-hidden">
          <div className="px-6 py-5 border-b border-yak-line bg-yak-griego/30 flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-yak-mango/15 text-yak-mango flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="heading-section text-lg text-yak-navy">
                Registrar Cliente Fundador
              </h2>
              <p className="text-body-sm text-yak-muted mt-0.5">
                Los fundadores nunca pagan domicilio, sin importar la zona.
              </p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="input-label">Nombre completo</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input-field"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="input-label">WhatsApp (10 dígitos)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="input-field"
                placeholder="3001234567"
              />
            </div>
            <div>
              <label className="input-label">Zona de entrega</label>
              <select
                value={form.zone}
                onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))}
                className="select-field"
              >
                {Object.values(ZONES).map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Dirección</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="input-field"
                placeholder="Calle / Carrera #"
              />
            </div>
            <div>
              <label className="input-label">Apto / Conjunto (opcional)</label>
              <input
                value={form.apartment}
                onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Instrucciones (opcional)</label>
              <input
                value={form.instructions}
                onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                className="input-field"
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <button
                onClick={handleSaveCustomer}
                disabled={savingForm}
                className="btn-primary w-full"
                data-ui-state={savingForm ? 'loading' : 'idle'}
              >
                {savingForm ? (
                  <>
                    <span className="spinner-brand" aria-hidden="true" />
                    Guardando registro
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Registrar como Fundador
                  </>
                )}
              </button>
              {formMsg && (
                formMsg.ok ? (
                  <div className="inline-success" role="status">
                    <svg className="inline-success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p className="font-medium">{formMsg.text}</p>
                  </div>
                ) : (
                  <div className="inline-error" role="alert">
                    <svg className="inline-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="font-medium">{formMsg.text}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {metrics && (
          <section aria-label="Visualizaciones de datos" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">📦 Pedidos por semana</h3>
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

              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">💰 Ingresos por semana</h3>
                <RevenueLineChart data={metrics.revenueByWeek} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">🍓 Unidades por sabor</h3>
                <FlavorBarChart data={metrics.unitsByFlavor} />
              </div>

              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">📍 Ventas por zona</h3>
                <div className="space-y-3">
                  {Object.entries(metrics.revenueByZone).length === 0 && (
                    <p className="text-body-sm text-yak-muted">Sin ventas registradas aún.</p>
                  )}
                  {Object.entries(metrics.revenueByZone)
                    .sort((a, b) => b[1] - a[1])
                    .map(([zone, revenue]) => {
                      const max = Math.max(...Object.values(metrics.revenueByZone))
                      return (
                        <div key={zone}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold text-yak-ink">{ZONES[zone]?.name || zone}</span>
                            <span className="font-display font-bold text-yak-navy">${revenue.toLocaleString('es-CO')}</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">👥 Clientes: nuevos vs acumulados</h3>
                <CustomersLineChart data={metrics.customersByWeek} />
              </div>

              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">♻️ Botellas devueltas por semana</h3>
                <BottlesBarChart data={metrics.bottlesReturnedByWeek} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">📊 Estados de pedidos</h3>
                <StatusDonutChart data={metrics.ordersByStatus} />
              </div>

              <div className="surface-card p-6">
                <h3 className="heading-section text-base text-yak-navy mb-5">🏆 Top Fidelidad 10+1</h3>
                <TopLoyaltyTable data={metrics.topLoyaltyCustomers} />
              </div>
            </div>
          </section>
        )}

        <section aria-label="Tabla de clientes" className="surface-card overflow-hidden">
          <div className="px-6 py-5 border-b border-yak-line flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-yak-griego/60 flex items-center justify-center text-yak-navy shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h2 className="heading-section text-lg text-yak-navy">Todos los clientes</h2>
            </div>
            <div className="relative flex-1 max-w-xs">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yak-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o teléfono"
                className="input-field pl-11"
                aria-label="Buscar clientes"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" role="grid" aria-label="Listado de clientes">
              <thead className="sr-only">
                <tr>
                  <th>Cliente</th>
                  <th>Botellas en casa</th>
                  <th>Botellas histórico</th>
                  <th>Estado fundador</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12">
                      <p className="text-body-sm text-yak-muted text-center">No hay clientes todavía.</p>
                    </td>
                  </tr>
                )}
                {filtered.map((c, idx) => (
                  <tr key={c.phone} className="block border-0">
                    <td colSpan={4} className="block px-0 py-0 border-0">
                      {idx > 0 && <hr className="divider mx-6" />}
                      <div className="px-6 py-5 flex flex-wrap items-center gap-5">
                        <div className="flex-1 min-w-56">
                          <p className="font-display font-bold text-body text-yak-ink">
                            {c.name} {c.isFounder && <span className="text-yak-mango ml-0.5">⭐</span>}
                          </p>
                          <p className="text-caption text-yak-muted font-mono mt-0.5">
                            {c.phone} · {ZONES[c.zone]?.name || c.zone}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-28 h-1.5 rounded-full bg-yak-griego overflow-hidden">
                              <div
                                className="h-full bg-yak-feijoa rounded-full"
                                style={{ width: `${((c.bottlesHistory || 0) % BOTTLES_FOR_FREE) * 10}%` }}
                              />
                            </div>
                            <span className="text-caption text-yak-muted">
                              {(c.bottlesHistory || 0) % BOTTLES_FOR_FREE}/{BOTTLES_FOR_FREE} para gratis
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-caption text-yak-muted font-bold uppercase tracking-wide pl-1">En casa</span>
                          <div className="quantity-stepper">
                            <button
                              onClick={() => handleAdjustBottles(c, 'bottlesInPossession', -1)}
                              className="quantity-btn"
                              aria-label="Disminuir botellas en casa"
                              disabled={(c.bottlesInPossession || 0) <= 0}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                            <span className="quantity-value" aria-live="polite">{c.bottlesInPossession || 0}</span>
                            <button
                              onClick={() => handleAdjustBottles(c, 'bottlesInPossession', 1)}
                              className="quantity-btn"
                              aria-label="Aumentar botellas en casa"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-1.5">
                          <span className="text-caption text-yak-muted font-bold uppercase tracking-wide pl-1">Histórico</span>
                          <div className="quantity-stepper">
                            <button
                              onClick={() => handleAdjustBottles(c, 'bottlesHistory', -1)}
                              className="quantity-btn"
                              aria-label="Disminuir botellas histórico"
                              disabled={(c.bottlesHistory || 0) <= 0}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                            <span className="quantity-value" aria-live="polite">{c.bottlesHistory || 0}</span>
                            <button
                              onClick={() => handleAdjustBottles(c, 'bottlesHistory', 1)}
                              className="quantity-btn"
                              aria-label="Aumentar botellas histórico"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <FounderToggleSwitch
                          isFounder={!!c.isFounder}
                          onToggle={() => handleToggleFounder(c)}
                          spring={springShort}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {metrics && metrics.recentOrders.length > 0 && (
          <section aria-label="Últimos pedidos">
            <div className="flex items-center gap-3 mb-5 px-1">
              <div className="w-10 h-10 rounded-2xl bg-yak-griego/60 flex items-center justify-center text-yak-navy shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h2 className="heading-section text-lg text-yak-navy">Últimos pedidos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.recentOrders.map((o) => (
                <article key={o.id} className="surface-elevated p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-display font-bold text-body-sm text-yak-navy font-mono">{o.id}</p>
                      <p className="text-caption text-yak-muted mt-0.5">
                        {o.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-price text-yak-navy leading-none">
                        ${o.total.toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-yak-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {ZONES[o.zone]?.name || o.zone}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 2v7.31" />
                        <path d="M14 9.3V1.99" />
                        <path d="M8.5 2h7" />
                        <path d="M19 9v3.5a4 4 0 0 1-2.1 3.56l-1.9 1.1A2 2 0 0 0 14 18.34V21" />
                        <path d="M10 21v-2.66c0-.53-.21-1.04-.58-1.41L7 15.5A5.5 5.5 0 0 1 5 11.5V9" />
                      </svg>
                      {o.totalUnits} L
                    </span>
                    {o.bottlesReturned > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-yak-feijoa font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                        {o.bottlesReturned} devueltas
                      </span>
                    )}
                    <span
                      className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[10px] font-bold uppercase tracking-wide ${
                        o.status === 'PENDING_PAYMENT' ? 'bg-amber-500/10 text-amber-700' :
                        o.status === 'PAYMENT_REPORTED' ? 'bg-blue-500/10 text-blue-700' :
                        o.status === 'PAID' || o.status === 'DELIVERED' ? 'bg-yak-feijoa/12 text-yak-feijoa' : 'bg-yak-griego text-yak-muted'
                      }`}
                    >
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function FounderToggleSwitch({
  isFounder,
  onToggle,
  spring,
}: {
  isFounder: boolean
  onToggle: () => void
  spring: { type?: 'spring'; bounce?: number; duration: number } | { duration: number; ease: 'linear' }
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="text-caption text-yak-muted font-bold uppercase tracking-wide pl-1">Fundador</span>
      <button
        onClick={onToggle}
        role="switch"
        aria-checked={isFounder}
        aria-label={isFounder ? 'Quitar estado de fundador' : 'Marcar como fundador'}
        className="relative inline-flex items-center shrink-0 w-14 h-8 rounded-full border border-yak-line transition-colors duration-150 ease-out-expo focus:outline-none focus:ring-2 focus:ring-yak-mango/40 focus:ring-offset-2 focus:ring-offset-yak-cream"
        style={{ backgroundColor: isFounder ? '#E8A838' : '#E5E0DA' }}
      >
        <motion.span
          initial={false}
          animate={{ x: isFounder ? 26 : 3 }}
          transition={spring}
          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-[10px]"
          aria-hidden="true"
        >
          {isFounder ? '⭐' : ''}
        </motion.span>
      </button>
    </div>
  )
}

function RevenueLineChart({ data }: { data: { week: string; revenue: number }[] }) {
  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue))
  const points = data.map((d, i) => ({
    x: (i / Math.max(1, data.length - 1)) * 100,
    y: 100 - (d.revenue / maxRevenue) * 90,
  }))

  return (
    <div className="relative h-48" role="img" aria-label="Gráfico de línea de ingresos por semana">
      <div className="absolute inset-0">
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} className="absolute left-0 right-0 border-t border-yak-line/40" style={{ top: `${p}%` }} />
        ))}
      </div>
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
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
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-caption text-yak-muted pt-2">
        {data.map((d) => <span key={d.week}>{d.week}</span>)}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-20 flex flex-col justify-between text-caption text-yak-muted pr-1">
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
    <div className="space-y-3 h-48 overflow-y-auto pr-1">
      {data.length === 0 ? (
        <p className="text-body-sm text-yak-muted text-center py-8">Sin datos de sabores aún.</p>
      ) : (
        data.map((d, i) => (
          <div key={d.flavor} className="flex items-center gap-3">
            <span className="w-24 text-body-sm font-medium text-yak-ink truncate">{d.flavor}</span>
            <div className="flex-1 h-6 rounded-full bg-yak-griego/60 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(d.units / maxUnits) * 100}%`, backgroundColor: colors[i % colors.length] }}
              />
            </div>
            <span className="w-14 text-right text-body-sm font-display font-bold text-yak-navy">{d.units}</span>
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
    <div className="relative h-48" role="img" aria-label="Gráfico de clientes nuevos vs acumulados">
      <div className="absolute inset-0">
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} className="absolute left-0 right-0 border-t border-yak-line/40" style={{ top: `${p}%` }} />
        ))}
      </div>
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
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
      <svg className="absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
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
      <div className="absolute top-2 right-2 flex gap-4 text-caption">
        <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-yak-navy opacity-60 rounded-full" /> Acumulados</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-0.5 bg-yak-mango rounded-full" /> Nuevos</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-caption text-yak-muted pt-2">
        {data.map((d) => <span key={d.week}>{d.week}</span>)}
      </div>
    </div>
  )
}

function BottlesBarChart({ data }: { data: { week: string; bottles: number }[] }) {
  const maxBottles = Math.max(1, ...data.map((d) => d.bottles))

  return (
    <div className="flex items-end gap-2 h-40" role="img" aria-label="Gráfico de barras de botellas devueltas por semana">
      {data.map((d) => (
        <div key={d.week} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-caption font-bold text-yak-feijoa">{d.bottles || ''}</span>
          <div
            className="w-full rounded-t-lg bg-yak-feijoa/80 transition-all"
            style={{ height: `${(d.bottles / maxBottles) * 100}%`, minHeight: d.bottles > 0 ? 6 : 2 }}
          />
          <span className="text-caption text-yak-muted">{d.week}</span>
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
    <div className="flex flex-col items-center gap-5" role="img" aria-label="Gráfico de dona de estados de pedidos">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="35" fill="none" stroke="#E8E8E8" strokeWidth="8" />
          {paths}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-display font-extrabold text-display-sm text-yak-navy">{total}</p>
            <p className="text-caption text-yak-muted">pedidos</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-caption w-full max-w-xs">
        {segments.map((s) => (
          <div key={s.status} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-yak-ink truncate">{s.label} ({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopLoyaltyTable({ data }: { data: Metrics['topLoyaltyCustomers'] }) {
  return (
    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
      {data.length === 0 ? (
        <p className="text-body-sm text-yak-muted text-center py-8">Sin datos de fidelidad aún.</p>
      ) : (
        data.map((c) => (
          <div key={c.phone} className="flex items-center gap-3 p-3 rounded-2xl bg-yak-griego/40 border border-yak-line/50">
            <div className="w-8 h-8 rounded-full bg-yak-navy/10 flex items-center justify-center text-[11px] font-bold text-yak-navy shrink-0">
              {c.isFounder ? '⭐' : String(c.progressPercent / 10 || 0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-bold text-yak-ink truncate">{c.name} {c.isFounder && <span className="text-yak-mango ml-0.5">⭐</span>}</p>
              <p className="text-caption text-yak-muted font-mono">{c.phone}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-body-sm font-bold text-yak-feijoa">{c.bottlesHistory} bot.</p>
              <div className="w-24 h-1.5 rounded-full bg-yak-griego overflow-hidden mt-1 ml-auto">
                <div className="h-full bg-yak-feijoa" style={{ width: `${c.progressPercent}%` }} />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
