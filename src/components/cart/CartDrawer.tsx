'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useCart, lineKey } from '@/lib/cart-context'
import { PRODUCTS, ZONES, sugarLabel } from '@/lib/config'
import { calculateDeliveryDate, formatDeliveryDate } from '@/lib/delivery-engine'
import { validatePhone } from '@/lib/order'

type DrawerView = 'cart' | 'checkout' | 'payment' | 'confirmation'

export default function CartDrawer() {
  const [view, setView] = useState<DrawerView>('cart')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    zone: '',
    address: '',
    apartment: '',
    instructions: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [orderResult, setOrderResult] = useState<{
    id: string
    total: number
    subtotal: number
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
    deliveryCostFor,
    isEmpty,
    isCartOpen,
    closeCart,
  } = useCart()

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

  const deliveryCost = selectedZone ? deliveryCostFor(selectedZone) : 0
  const isFreeDelivery = totalUnits >= 3
  const displayDeliveryCost = isFreeDelivery ? 0 : deliveryCost
  const total = subtotal + displayDeliveryCost

  const deliveryInfo = selectedZone
    ? calculateDeliveryDate(new Date(), selectedZone)
    : null

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId)
    setFormData((prev) => ({ ...prev, zone: zoneId }))
  }

  const validateCheckout = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Ingresa tu nombre'
    if (!formData.phone.trim()) newErrors.phone = 'Ingresa tu teléfono'
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
            name: formData.name,
            phone: formData.phone,
            zone: formData.zone,
            address: formData.address,
            apartment: formData.apartment || undefined,
            instructions: formData.instructions || undefined,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setOrderResult(data.order)
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
      // Still show success — the order is created
    } finally {
      setPaymentReporting(false)
    }
  }

  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '3006539429'
  const PAYMENT_ACCOUNT = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT || ''

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-yak-cream shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yak-griego">
          <h2 className="font-display font-bold text-lg text-yak-navy">
            {view === 'cart' && 'Tu pedido'}
            {view === 'checkout' && 'Entrega'}
            {view === 'payment' && 'Pago'}
            {view === 'confirmation' && '¡Listo!'}
          </h2>
          <button
            onClick={closeCart}
            className="p-1 text-yak-muted hover:text-yak-ink transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ─── CART VIEW ─── */}
          {view === 'cart' && (
            <>
              {isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-yak-griego flex items-center justify-center mb-4">
                    <span className="text-2xl">🥛</span>
                  </div>
                  <p className="font-display font-semibold text-yak-ink mb-1">
                    Tu carrito está vacío
                  </p>
                  <p className="text-sm text-yak-muted mb-6">
                    Agrega sabores para comenzar tu pedido
                  </p>
                  <a
                    href="/productos"
                    onClick={closeCart}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yak-navy text-white text-sm font-medium hover:bg-yak-navy/90 transition-colors"
                  >
                    Ver sabores
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const product = PRODUCTS[item.productId]
                    if (!product) return null
                    return (
                      <div key={lineKey(item.productId, item.sugar)} className="flex gap-3 p-3 rounded-xl bg-white border border-yak-griego/50">
                        {/* Product image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-yak-griego">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-semibold text-sm text-yak-ink truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-yak-muted">
                            ${product.price.toLocaleString('es-CO')}
                          </p>
                          {item.sugar && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-yak-griego text-[11px] text-yak-muted">
                              {sugarLabel(item.sugar)}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.sugar)}
                              className="w-7 h-7 rounded-full border border-yak-griego flex items-center justify-center text-yak-muted hover:text-yak-ink hover:border-yak-ink transition-colors text-sm"
                            >
                              −
                            </button>
                            <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.sugar)}
                              className="w-7 h-7 rounded-full border border-yak-griego flex items-center justify-center text-yak-muted hover:text-yak-ink hover:border-yak-ink transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeFromCart(item.productId, item.sugar)}
                            className="text-yak-muted/50 hover:text-yak-fresa transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                          <span className="text-xs font-medium text-yak-ink">
                            ${(product.price * item.quantity).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Free delivery indicator */}
                  <div className={`text-center text-xs py-2 rounded-lg ${isFreeDelivery ? 'bg-yak-feijoa/20 text-yak-feijoa' : 'bg-yak-griego/50 text-yak-muted'}`}>
                    {isFreeDelivery
                      ? '✓ Domicilio gratis (3+ unidades)'
                      : `Faltan ${3 - totalUnits} unidad(es) para domicilio gratis`
                    }
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── CHECKOUT VIEW ─── */}
          {view === 'checkout' && (
            <div className="space-y-4">
              {/* Zone selector */}
              <div>
                <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                  Zona de entrega
                </label>
                <select
                  value={formData.zone}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20 focus:border-yak-navy"
                >
                  <option value="">Selecciona tu zona</option>
                  {Object.values(ZONES).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {z.deliveryCost === 0 ? 'Gratis' : `$${z.deliveryCost.toLocaleString('es-CO')}`}
                    </option>
                  ))}
                </select>
                {errors.zone && <p className="text-xs text-yak-fresa mt-1">{errors.zone}</p>}
              </div>

              {/* Delivery info */}
              {deliveryInfo && (
                <div className={`p-3 rounded-lg text-sm ${deliveryInfo.isWithinCutoff ? 'bg-yak-feijoa/15 text-yak-feijoa' : 'bg-amber-50 text-amber-700'}`}>
                  <p className="font-medium">
                    Entrega: {deliveryInfo.dayName} {formatDeliveryDate(deliveryInfo.deliveryDate)}
                  </p>
                  <p className="text-xs mt-0.5 opacity-80">
                    Corte: {deliveryInfo.cutoffDay} a las {deliveryInfo.cutoffTime}
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20 focus:border-yak-navy"
                  placeholder="Tu nombre"
                />
                {errors.name && <p className="text-xs text-yak-fresa mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                  WhatsApp
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20 focus:border-yak-navy"
                  placeholder="300 123 4567"
                />
                {errors.phone && <p className="text-xs text-yak-fresa mt-1">{errors.phone}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                  Dirección
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20 focus:border-yak-navy"
                  placeholder="Calle 123 #45-67"
                />
                {errors.address && <p className="text-xs text-yak-fresa mt-1">{errors.address}</p>}
              </div>

              {/* Apartment (optional) */}
              <div>
                <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                  Apartamento / Torre <span className="text-yak-muted/50">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.apartment}
                  onChange={(e) => setFormData((p) => ({ ...p, apartment: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20 focus:border-yak-navy"
                  placeholder="Apto 301, Torre B"
                />
              </div>

              {/* Instructions (optional) */}
              <div>
                <label className="block text-xs font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                  Instrucciones <span className="text-yak-muted/50">(opcional)</span>
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-yak-griego bg-white text-sm text-yak-ink focus:outline-none focus:ring-2 focus:ring-yak-navy/20 focus:border-yak-navy resize-none"
                  rows={2}
                  placeholder="Ej: dejar con el porteró"
                />
              </div>
            </div>
          )}

          {/* ─── PAYMENT VIEW ─── */}
          {view === 'payment' && (
            <div className="space-y-5">
              {/* Order summary */}
              <div className="space-y-2">
                {items.map((item) => {
                  const product = PRODUCTS[item.productId]
                  if (!product) return null
                  return (
                    <div key={lineKey(item.productId, item.sugar)} className="flex justify-between text-sm">
                      <span className="text-yak-muted">
                        {item.quantity}× {product.name}
                        {item.sugar ? ` (${sugarLabel(item.sugar)})` : ''}
                      </span>
                      <span className="font-medium">${(product.price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  )
                })}
                <div className="border-t border-yak-griego pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-yak-muted">Subtotal</span>
                    <span>${subtotal.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yak-muted">Domicilio</span>
                    <span>{isFreeDelivery ? 'Gratis' : `$${deliveryCost.toLocaleString('es-CO')}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-yak-navy mt-1">
                    <span>Total</span>
                    <span>${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>

              {/* Payment instructions */}
              <div className="p-4 rounded-xl bg-yak-navy/5 border border-yak-navy/10">
                <p className="text-xs font-semibold text-yak-navy uppercase tracking-wider mb-2">
                  Paga por transferencia
                </p>
                <p className="text-sm text-yak-ink mb-1">Envía <strong>${total.toLocaleString('es-CO')}</strong> a esta llave:</p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-yak-griego">
                  <code className="flex-1 text-sm font-mono text-yak-navy">{PAYMENT_ACCOUNT}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(PAYMENT_ACCOUNT)}
                    className="text-xs text-yak-muted hover:text-yak-navy transition-colors px-2 py-1 rounded border border-yak-griego hover:border-yak-navy"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {errors.submit && (
                <p className="text-sm text-yak-fresa text-center">{errors.submit}</p>
              )}
            </div>
          )}

          {/* ─── CONFIRMATION VIEW ─── */}
          {view === 'confirmation' && (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 rounded-full bg-yak-feijoa/20 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7B9E6E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-xl text-yak-ink mb-2">
                Pedido creado
              </h3>
              <p className="text-sm text-yak-muted mb-1">
                ID: <span className="font-mono text-yak-navy">{orderResult?.id}</span>
              </p>
              <p className="text-sm text-yak-muted mb-6">
                Entrega: {orderResult?.deliveryDay}
              </p>

              {!paymentReported ? (
                <button
                  onClick={handlePaymentReported}
                  disabled={paymentReporting}
                  className="w-full py-3 rounded-full bg-yak-navy text-white font-medium text-sm hover:bg-yak-navy/90 transition-colors disabled:opacity-50"
                >
                  {paymentReporting ? 'Reportando...' : 'Ya realicé el pago'}
                </button>
              ) : (
                <div className="space-y-3 w-full">
                  <p className="text-sm text-yak-feijoa font-medium">
                    ✓ Pago reportado. Espera confirmación.
                  </p>
                  <a
                    href={`https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hola, quiero confirmar mi pedido ${orderResult?.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 rounded-full bg-green-600 text-white font-medium text-sm text-center hover:bg-green-700 transition-colors"
                  >
                    Seguir por WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {view === 'cart' && !isEmpty && (
          <div className="px-6 py-4 border-t border-yak-griego">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-yak-muted">Subtotal ({totalUnits} unidades)</span>
              <span className="font-semibold">${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <button
              onClick={() => setView('checkout')}
              className="w-full py-3 rounded-full bg-yak-navy text-white font-medium text-sm hover:bg-yak-navy/90 transition-colors"
            >
              Continuar a entrega
            </button>
          </div>
        )}

        {view === 'checkout' && (
          <div className="px-6 py-4 border-t border-yak-griego">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-yak-muted">Total</span>
              <span className="font-semibold text-yak-navy">${total.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('cart')}
                className="flex-shrink-0 px-4 py-3 rounded-full border border-yak-griego text-sm font-medium text-yak-muted hover:text-yak-ink hover:border-yak-ink transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleContinueToPayment}
                className="flex-1 py-3 rounded-full bg-yak-navy text-white font-medium text-sm hover:bg-yak-navy/90 transition-colors"
              >
                Continuar al pago
              </button>
            </div>
          </div>
        )}

        {view === 'payment' && (
          <div className="px-6 py-4 border-t border-yak-griego">
            <div className="flex gap-2">
              <button
                onClick={() => setView('checkout')}
                className="flex-shrink-0 px-4 py-3 rounded-full border border-yak-griego text-sm font-medium text-yak-muted hover:text-yak-ink hover:border-yak-ink transition-colors"
              >
                ←
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={submitting}
                className="flex-1 py-3 rounded-full bg-yak-mango text-white font-medium text-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {submitting ? 'Creando pedido...' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  )
}
