'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { useCart, lineKey } from '@/lib/cart-context'
import { PRODUCTS, ZONES, sugarLabel, getDeliveryCost } from '@/lib/config'
import { calculateDeliveryDate, formatDeliveryDate } from '@/lib/delivery-engine'
import { validatePhone } from '@/lib/order'
import {
  BOTTLE_DISCOUNT,
  BOTTLES_FOR_FREE,
  normalizePhone,
  type CustomerPublicData,
} from '@/lib/client-types'

type DrawerView = 'cart' | 'checkout' | 'payment' | 'confirmation'
type AuthMode = 'existing' | 'new'

const LOCAL_STORAGE_CUSTOMER_KEY = 'yak_saved_customer'

export default function CartDrawer() {
  const [view, setView] = useState<DrawerView>('cart')
  const [authMode, setAuthMode] = useState<AuthMode>('existing')
  const [lookupPhone, setLookupPhone] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [customerData, setCustomerData] = useState<CustomerPublicData | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    zone: '',
    address: '',
    apartment: '',
    instructions: '',
  })
  const [bottlesToReturn, setBottlesToReturn] = useState<number>(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    id: string
    total: number
    subtotal: number
    bottleDiscount?: number
    loyaltyDiscount?: number
    deliveryCost: number
    deliveryDate: string
    deliveryDay: string
  } | null>(null)
  const [paymentReporting, setPaymentReporting] = useState(false)
  const [paymentReported, setPaymentReported] = useState(false)

  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalUnits,
    subtotal,
    isEmpty,
    isCartOpen,
    closeCart,
  } = useCart()

  // Cargar cliente guardado de compras anteriores en localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOMER_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.phone) {
          setCustomerData(parsed)
          setFormData({
            name: parsed.name || '',
            phone: parsed.phone || '',
            zone: parsed.zone || '',
            address: parsed.address || '',
            apartment: parsed.apartment || '',
            instructions: parsed.instructions || '',
          })
          setLookupPhone(parsed.phone)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  // Reset view when drawer closes
  useEffect(() => {
    if (!isCartOpen) {
      const timer = setTimeout(() => setView('cart'), 300)
      return () => clearTimeout(timer)
    }
  }, [isCartOpen])

  // Ajustar botellas a devolver cuando cambian las unidades
  const maxReturnable = useMemo(() => {
    if (!customerData || (customerData.bottlesInPossession || 0) <= 0) return 0
    return Math.min(customerData.bottlesInPossession, totalUnits)
  }, [customerData, totalUnits])

  useEffect(() => {
    if (bottlesToReturn > maxReturnable) {
      setBottlesToReturn(maxReturnable)
    }
  }, [maxReturnable, bottlesToReturn])

  // Cálculo de descuentos en vivo
  const bottleDiscount = bottlesToReturn * BOTTLE_DISCOUNT
  const hasLoyaltyFreeBottle = useMemo(() => {
    if (!customerData) return false
    return (customerData.bottlesHistory || 0) >= BOTTLES_FOR_FREE && totalUnits > 0
  }, [customerData, totalUnits])

  const loyaltyDiscount = useMemo(() => {
    if (!hasLoyaltyFreeBottle) return 0
    // Descuento del producto más económico en el carrito
    const itemPrices = items
      .map((i) => PRODUCTS[i.productId]?.price || 0)
      .filter((p) => p > 0)
    return itemPrices.length > 0 ? Math.min(...itemPrices) : 0
  }, [hasLoyaltyFreeBottle, items])

  const isFounder = Boolean(customerData?.isFounder)
  const deliveryCost = formData.zone ? getDeliveryCost(formData.zone, isFounder) : 0
  const isFreeDelivery = isFounder || formData.zone === 'COTA'
  const total = Math.max(0, subtotal - bottleDiscount - loyaltyDiscount + deliveryCost)

  const deliveryInfo = formData.zone
    ? calculateDeliveryDate(new Date(), formData.zone)
    : null

  // Búsqueda de cliente por teléfono (1 clic)
  const handleLookupCustomer = async (phoneToSearch?: string) => {
    const raw = phoneToSearch || lookupPhone
    const clean = normalizePhone(raw)
    if (!/^\d{10}$/.test(clean)) {
      setLookupError('Ingresa un número de 10 dígitos (ej: 3001234567)')
      return
    }
    setLookupLoading(true)
    setLookupError('')
    try {
      const res = await fetch(`/api/customers/lookup?phone=${clean}`)
      const data = await res.json()
      if (data.found && data.customer) {
        setCustomerData(data.customer)
        setFormData({
          name: data.customer.name || '',
          phone: data.customer.phone,
          zone: data.customer.zone || '',
          address: data.customer.address || '',
          apartment: data.customer.apartment || '',
          instructions: data.customer.instructions || '',
        })
        try {
          localStorage.setItem(LOCAL_STORAGE_CUSTOMER_KEY, JSON.stringify(data.customer))
        } catch {
          // ignore
        }
      } else {
        setLookupError('No encontramos una cuenta con ese número. Completa tus datos para crearla.')
        setAuthMode('new')
        setFormData((prev) => ({ ...prev, phone: clean }))
      }
    } catch {
      setLookupError('Error de conexión al buscar tu cuenta')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleLogoutCustomer = () => {
    setCustomerData(null)
    setFormData({
      name: '',
      phone: '',
      zone: '',
      address: '',
      apartment: '',
      instructions: '',
    })
    setLookupPhone('')
    setBottlesToReturn(0)
    try {
      localStorage.removeItem(LOCAL_STORAGE_CUSTOMER_KEY)
    } catch {
      // ignore
    }
  }

  const validateCheckout = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Ingresa tu nombre'
    if (!formData.phone.trim()) newErrors.phone = 'Ingresa tu número de WhatsApp'
    else if (!validatePhone(formData.phone)) newErrors.phone = 'Número inválido (10 dígitos)'
    if (!formData.zone) newErrors.zone = 'Selecciona una zona'
    if (!formData.address.trim()) newErrors.address = 'Ingresa tu dirección'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinueToPayment = () => {
    if (!validateCheckout()) return
    setView('payment')
  }

  const handleCreateOrder = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            ...(i.sugar ? { sugar: i.sugar } : {}),
          })),
          customer: {
            name: formData.name.trim(),
            phone: normalizePhone(formData.phone),
            zone: formData.zone,
            address: formData.address.trim(),
            apartment: formData.apartment?.trim() || undefined,
            instructions: formData.instructions?.trim() || undefined,
          },
          bottlesToReturn,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOrderResult(data.order)
        setPaymentReported(false)
        // Guardar cliente en local
        const updatedCust: CustomerPublicData = {
          name: formData.name.trim(),
          phone: normalizePhone(formData.phone),
          zone: formData.zone,
          address: formData.address.trim(),
          apartment: formData.apartment?.trim() || undefined,
          instructions: formData.instructions?.trim() || undefined,
          isFounder,
          bottlesInPossession: Math.max(0, (customerData?.bottlesInPossession || 0) - bottlesToReturn) + totalUnits,
          bottlesHistory: (customerData?.bottlesHistory || 0) + totalUnits,
        }
        setCustomerData(updatedCust)
        try {
          localStorage.setItem(LOCAL_STORAGE_CUSTOMER_KEY, JSON.stringify(updatedCust))
        } catch {
          // ignore
        }
        setView('confirmation')
      } else {
        setErrors({ submit: data.error || 'Error al crear el pedido' })
      }
    } catch {
      setErrors({ submit: 'Error de conexión' })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentReported = async () => {
    if (!orderResult) return
    setPaymentReporting(true)
    try {
      await fetch('/api/orders/report-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderResult.id }),
      })
      setPaymentReported(true)
      clearCart()
    } catch {
      // Still show success
    } finally {
      setPaymentReporting(false)
    }
  }

  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '3006539429'
  const PAYMENT_ACCOUNT = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT || '3006539429 (Nequi / Daviplata)'

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-yak-cream shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yak-griego/80 bg-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yak-mango" />
            <h2 className="font-display font-bold text-lg text-yak-navy">
              {view === 'cart' && 'Tu Canasta YAK'}
              {view === 'checkout' && 'Datos de Entrega'}
              {view === 'payment' && 'Confirmación y Pago'}
              {view === 'confirmation' && '¡Pedido Recibido!'}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-yak-muted hover:text-yak-ink hover:bg-yak-griego/50 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ─── CART VIEW ─── */}
          {view === 'cart' && (
            <>
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-yak-griego flex items-center justify-center mb-4 text-3xl shadow-inner">
                    🥛
                  </div>
                  <p className="font-display font-bold text-lg text-yak-ink mb-1">
                    Tu canasta está vacía
                  </p>
                  <p className="text-sm text-yak-muted mb-6 max-w-xs leading-relaxed">
                    Nuestros yogures artesanales de 1 litro se entregan frescos en botella de vidrio.
                  </p>
                  <a
                    href="/productos"
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yak-navy text-white text-sm font-semibold hover:bg-yak-navy/90 transition-colors shadow-md"
                  >
                    Ver sabores disponibles
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const product = PRODUCTS[item.productId]
                    if (!product) return null
                    return (
                      <div
                        key={lineKey(item.productId, item.sugar)}
                        className="flex gap-3 p-3.5 rounded-2xl bg-white border border-yak-griego/60 shadow-sm"
                      >
                        {/* Product image */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-yak-griego relative">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-sm text-yak-ink truncate">
                            {product.name}
                          </p>
                          <p className="text-xs font-semibold text-yak-mango">
                            ${product.price.toLocaleString('es-CO')}
                          </p>
                          {item.sugar && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-yak-cream text-[11px] font-medium text-yak-muted border border-yak-griego">
                              {sugarLabel(item.sugar)}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.sugar)}
                              className="w-6 h-6 rounded-full border border-yak-griego flex items-center justify-center text-yak-muted hover:text-yak-ink hover:border-yak-navy transition-colors text-xs font-bold bg-yak-cream/50"
                            >
                              −
                            </button>
                            <span className="text-xs font-bold w-5 text-center text-yak-ink">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.sugar)}
                              className="w-6 h-6 rounded-full border border-yak-griego flex items-center justify-center text-yak-muted hover:text-yak-ink hover:border-yak-navy transition-colors text-xs font-bold bg-yak-cream/50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeFromCart(item.productId, item.sugar)}
                            className="text-yak-muted/40 hover:text-yak-fresa p-1 transition-colors"
                            aria-label="Eliminar"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                          <span className="text-xs font-bold text-yak-navy">
                            ${(product.price * item.quantity).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Info sobre retorno de vidrio */}
                  <div className="p-3.5 rounded-xl bg-yak-feijoa/10 border border-yak-feijoa/25 text-xs text-yak-navy space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span>♻️</span> Economía Circular YAK
                    </p>
                    <p className="text-yak-muted leading-relaxed">
                      Si ya tienes botellas de vidrio en casa, en el siguiente paso podrás devolverlas y descontar <strong>$2.000</strong> por cada una.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── CHECKOUT VIEW ─── */}
          {view === 'checkout' && (
            <div className="space-y-5">
              {/* Bloque de Identificación en 1 Clic */}
              {customerData ? (
                <div className="p-4 rounded-2xl bg-white border border-yak-navy/15 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👋</span>
                      <p className="font-display font-bold text-sm text-yak-navy">
                        Hola, {customerData.name}
                      </p>
                    </div>
                    <button
                      onClick={handleLogoutCustomer}
                      className="text-[11px] text-yak-muted hover:text-yak-fresa underline transition-colors"
                    >
                      Usar otro número
                    </button>
                  </div>
                  <p className="text-xs text-yak-muted font-mono">{customerData.phone}</p>
                  {customerData.isFounder && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yak-mango/15 border border-yak-mango/30 text-[11px] font-bold text-yak-mango">
                      ⭐ Cliente Fundador (Domicilio $0)
                    </div>
                  )}

                  {/* Estado de fidelidad */}
                  <div className="pt-2 border-t border-yak-griego text-xs">
                    {hasLoyaltyFreeBottle ? (
                      <p className="text-yak-feijoa font-bold flex items-center gap-1">
                        🎁 ¡Tienes 1 yogur gratis por fidelidad 10+1 en este pedido!
                      </p>
                    ) : (
                      <p className="text-yak-muted">
                        🥛 Fidelidad 10+1: Llevas{' '}
                        <strong>{(customerData.bottlesHistory || 0) % BOTTLES_FOR_FREE} / {BOTTLES_FOR_FREE}</strong> botellas acumuladas.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border border-yak-griego shadow-sm space-y-3">
                  <div className="flex rounded-xl bg-yak-cream p-1 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAuthMode('existing')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        authMode === 'existing'
                          ? 'bg-yak-navy text-white shadow-sm'
                          : 'text-yak-muted hover:text-yak-ink'
                      }`}
                    >
                      Ya soy cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('new')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${
                        authMode === 'new'
                          ? 'bg-yak-navy text-white shadow-sm'
                          : 'text-yak-muted hover:text-yak-ink'
                      }`}
                    >
                      ¿Primera vez?
                    </button>
                  </div>

                  {authMode === 'existing' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-yak-muted">
                        Ingresa tu WhatsApp para autocompletar:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="tel"
                          value={lookupPhone}
                          onChange={(e) => setLookupPhone(e.target.value)}
                          placeholder="300 123 4567"
                          className="flex-1 px-3 py-2 text-sm rounded-xl border border-yak-griego bg-white focus:outline-none focus:ring-2 focus:ring-yak-navy/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleLookupCustomer()}
                          disabled={lookupLoading}
                          className="px-4 py-2 rounded-xl bg-yak-navy text-white text-xs font-bold hover:bg-yak-navy/90 transition-colors disabled:opacity-50"
                        >
                          {lookupLoading ? '...' : 'Cargar'}
                        </button>
                      </div>
                      {lookupError && (
                        <p className="text-[11px] text-yak-fresa">{lookupError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selector interactivo de devolución de botellas (solo si tiene botellas en casa) */}
              {customerData && (customerData.bottlesInPossession || 0) > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-900">
                        🔄 Devolución de Botellas de Vidrio
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Tienes {customerData.bottlesInPossession} botella(s) en casa
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      -$2.000 c/u
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-emerald-900 font-medium">
                      ¿Cuántas vas a devolver hoy?
                    </span>
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-emerald-300">
                      <button
                        type="button"
                        onClick={() => setBottlesToReturn((b) => Math.max(0, b - 1))}
                        className="w-6 h-6 rounded-full border border-emerald-300 text-emerald-900 font-bold flex items-center justify-center hover:bg-emerald-50 text-xs"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-emerald-950 w-5 text-center">
                        {bottlesToReturn}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBottlesToReturn((b) => Math.min(maxReturnable, b + 1))}
                        disabled={bottlesToReturn >= maxReturnable}
                        className="w-6 h-6 rounded-full border border-emerald-300 text-emerald-900 font-bold flex items-center justify-center hover:bg-emerald-50 text-xs disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {bottlesToReturn > 0 && (
                    <p className="text-[11px] text-emerald-800 font-semibold text-right">
                      Ahorras ${(bottlesToReturn * BOTTLE_DISCOUNT).toLocaleString('es-CO')} en este pedido
                    </p>
                  )}
                </div>
              )}

              {/* Formulario de entrega */}
              <div className="space-y-3.5">
                {/* Zona de entrega */}
                <div>
                  <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1">
                    Zona de entrega
                  </label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData((p) => ({ ...p, zone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20"
                  >
                    <option value="">Selecciona tu municipio / sector</option>
                    {Object.values(ZONES).map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} —{' '}
                        {isFounder || z.deliveryCost === 0
                          ? 'Gratis'
                          : `$${z.deliveryCost.toLocaleString('es-CO')}`}
                      </option>
                    ))}
                  </select>
                  {errors.zone && <p className="text-xs text-yak-fresa mt-1">{errors.zone}</p>}
                </div>

                {/* Delivery info */}
                {deliveryInfo && (
                  <div
                    className={`p-3 rounded-xl text-xs ${
                      deliveryInfo.isWithinCutoff
                        ? 'bg-yak-feijoa/15 text-yak-feijoa'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <p className="font-bold">
                      Entrega: {deliveryInfo.dayName} {formatDeliveryDate(deliveryInfo.deliveryDate)}
                    </p>
                    <p className="mt-0.5 opacity-80">
                      Corte de pedidos: {deliveryInfo.cutoffDay} a las {deliveryInfo.cutoffTime}
                    </p>
                  </div>
                )}

                {/* Nombre */}
                <div>
                  <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1">
                    Tu Nombre
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20"
                    placeholder="Ej: Laura Gómez"
                  />
                  {errors.name && <p className="text-xs text-yak-fresa mt-1">{errors.name}</p>}
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1">
                    Número de WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20"
                    placeholder="300 123 4567"
                  />
                  {errors.phone && <p className="text-xs text-yak-fresa mt-1">{errors.phone}</p>}
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1">
                    Dirección exacta
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20"
                    placeholder="Ej: Carrera 5 # 10-25"
                  />
                  {errors.address && <p className="text-xs text-yak-fresa mt-1">{errors.address}</p>}
                </div>

                {/* Apartamento / Conjunto */}
                <div>
                  <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1">
                    Conjunto / Torre / Apto <span className="text-yak-muted/60">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.apartment}
                    onChange={(e) => setFormData((p) => ({ ...p, apartment: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20"
                    placeholder="Ej: Bosques de Cota, Torre 2 Apto 401"
                  />
                </div>

                {/* Instrucciones */}
                <div>
                  <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1">
                    Notas para el domiciliario <span className="text-yak-muted/60">(opcional)</span>
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20 resize-none"
                    rows={2}
                    placeholder="Ej: Dejar en recepción o timbrar dos veces"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── PAYMENT VIEW ─── */}
          {view === 'payment' && (
            <div className="space-y-5">
              {/* Resumen del pedido */}
              <div className="p-4 rounded-2xl bg-white border border-yak-griego/80 shadow-sm space-y-3">
                <p className="text-xs font-bold text-yak-muted uppercase tracking-wider">
                  Resumen de compra
                </p>
                {items.map((item) => {
                  const product = PRODUCTS[item.productId]
                  if (!product) return null
                  return (
                    <div key={lineKey(item.productId, item.sugar)} className="flex justify-between text-xs">
                      <span className="text-yak-ink font-medium">
                        {item.quantity}× {product.name}
                        {item.sugar ? ` (${sugarLabel(item.sugar)})` : ''}
                      </span>
                      <span className="font-semibold text-yak-navy">
                        ${(product.price * item.quantity).toLocaleString('es-CO')}
                      </span>
                    </div>
                  )
                })}

                <div className="border-t border-yak-griego pt-2.5 space-y-1.5 text-xs">
                  <div className="flex justify-between text-yak-muted">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString('es-CO')}</span>
                  </div>

                  {bottleDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Retorno de {bottlesToReturn} botella(s)</span>
                      <span>-${bottleDiscount.toLocaleString('es-CO')}</span>
                    </div>
                  )}

                  {loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-yak-feijoa font-bold">
                      <span>Yogur gratis Fidelidad (10+1)</span>
                      <span>-${loyaltyDiscount.toLocaleString('es-CO')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-yak-muted">
                    <span>Domicilio ({formData.zone})</span>
                    <span>
                      {isFreeDelivery ? (
                        <span className="text-emerald-700 font-semibold">Gratis</span>
                      ) : (
                        `$${deliveryCost.toLocaleString('es-CO')}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-yak-navy pt-2 border-t border-yak-griego">
                    <span>Total a pagar</span>
                    <span className="text-base font-display">${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>

              {/* Instrucciones de Pago */}
              <div className="p-4 rounded-2xl bg-yak-navy/5 border border-yak-navy/15 space-y-2.5">
                <p className="text-xs font-bold text-yak-navy uppercase tracking-wider">
                  Transferencia Directa
                </p>
                <p className="text-xs text-yak-ink leading-relaxed">
                  Realiza la transferencia de <strong>${total.toLocaleString('es-CO')}</strong> a la cuenta autorizada:
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-yak-griego">
                  <code className="flex-1 text-xs font-mono font-bold text-yak-navy">
                    {PAYMENT_ACCOUNT}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(PAYMENT_ACCOUNT)}
                    className="text-xs text-yak-navy font-semibold px-2.5 py-1 rounded-lg bg-yak-cream hover:bg-yak-griego border border-yak-griego transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {errors.submit && (
                <p className="text-xs text-yak-fresa text-center bg-yak-fresa/10 p-2.5 rounded-xl">
                  {errors.submit}
                </p>
              )}
            </div>
          )}

          {/* ─── CONFIRMATION VIEW ─── */}
          {view === 'confirmation' && (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3 shadow-inner">
                <span className="text-2xl">🎉</span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-yak-navy mb-1">
                ¡Pedido registrado!
              </h3>
              <p className="text-xs text-yak-muted mb-1 font-mono">
                ID: <span className="font-bold text-yak-navy">{orderResult?.id}</span>
              </p>
              <p className="text-xs text-yak-muted mb-5">
                Entrega programada para: <strong>{orderResult?.deliveryDay}</strong>
              </p>

              {!paymentReported ? (
                <div className="w-full space-y-3">
                  <div className="p-3.5 rounded-2xl bg-yak-cream border border-yak-griego text-left">
                    <p className="text-xs text-yak-ink leading-relaxed">
                      💡 Realiza tu pago por transferencia y presiona el botón para notificar al equipo de producción YAK.
                    </p>
                  </div>
                  <button
                    onClick={handlePaymentReported}
                    disabled={paymentReporting}
                    className="w-full py-3.5 rounded-full bg-yak-navy text-white font-bold text-sm hover:bg-yak-navy/90 transition-colors shadow-md disabled:opacity-50"
                  >
                    {paymentReporting ? 'Notificando pago...' : 'Ya realicé la transferencia'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 w-full">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                    ✓ Pago reportado exitosamente. Te avisaremos por WhatsApp cuando sea confirmado.
                  </div>
                  <a
                    href={`https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Hola YAK, acabo de pagar mi pedido ${orderResult?.id} a nombre de ${formData.name}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3.5 rounded-full bg-emerald-600 text-white font-bold text-sm text-center hover:bg-emerald-700 transition-colors shadow-md"
                  >
                    Enviar soporte por WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {view === 'cart' && !isEmpty && (
          <div className="px-6 py-4 border-t border-yak-griego/80 bg-white">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-yak-muted font-medium">Subtotal ({totalUnits} L)</span>
              <span className="font-bold text-yak-navy font-display">${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <button
              onClick={() => setView('checkout')}
              className="w-full py-3.5 rounded-full bg-yak-navy text-white font-bold text-sm hover:bg-yak-navy/90 transition-all shadow-md"
            >
              Continuar a entrega
            </button>
          </div>
        )}

        {view === 'checkout' && (
          <div className="px-6 py-4 border-t border-yak-griego/80 bg-white">
            <div className="flex justify-between text-xs mb-3">
              <span className="text-yak-muted">Total estimado</span>
              <span className="font-bold text-yak-navy text-sm font-display">
                ${total.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('cart')}
                className="px-4 py-3 rounded-full border border-yak-griego text-xs font-bold text-yak-muted hover:text-yak-ink hover:border-yak-navy transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleContinueToPayment}
                className="flex-1 py-3 rounded-full bg-yak-navy text-white font-bold text-sm hover:bg-yak-navy/90 transition-colors shadow-md"
              >
                Ir al pago
              </button>
            </div>
          </div>
        )}

        {view === 'payment' && (
          <div className="px-6 py-4 border-t border-yak-griego/80 bg-white">
            <div className="flex gap-2">
              <button
                onClick={() => setView('checkout')}
                className="px-4 py-3 rounded-full border border-yak-griego text-xs font-bold text-yak-muted hover:text-yak-ink hover:border-yak-navy transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={submitting}
                className="flex-1 py-3 rounded-full bg-yak-mango text-white font-bold text-sm hover:brightness-105 transition-all shadow-md disabled:opacity-50"
              >
                {submitting ? 'Registrando...' : 'Confirmar mi pedido'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}