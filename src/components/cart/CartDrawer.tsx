'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, useSpring, useTransform, useReducedMotion, AnimatePresence, animate } from 'framer-motion'
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
import {
  X,
  Minus,
  Plus,
  Trash,
  ArrowLeft,
  CheckCircle,
} from '@phosphor-icons/react'

// ────────────────────────────────────────────────────────────────────────────
// HELPERS (definidos al inicio del archivo, sin archivos externos)
// ────────────────────────────────────────────────────────────────────────────

const SLIDE_OPEN = { duration: 0.3, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
const SLIDE_CLOSE = { duration: 0.25, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
const SCRIM_TRANSITION = { duration: 0.2, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }
const REDUCED_TRANSITION = { duration: 0.12, ease: 'linear' as const }

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// ── Animated Number Hook (Emil style: useSpring + useTransform) ─────────────
function useAnimatedNumber(value: number, opts?: { flash?: boolean }) {
  const reduced = useReducedMotion()
  const spring = useSpring(value, reduced
    ? { duration: 0.12 }
    : { stiffness: 300, damping: 30, mass: 1 }
  )
  const prevRef = useRef(value)
  const flashRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const controls = animate(spring.get(), value, {
      ...(reduced ? { duration: 0.12 } : { stiffness: 300, damping: 30, mass: 1 }),
      onUpdate: (v) => spring.set(v),
    })
    if (opts?.flash && value !== prevRef.current && flashRef.current) {
      const el = flashRef.current
      el.classList.remove('flash-highlight')
      void el.offsetWidth
      el.classList.add('flash-highlight')
    }
    prevRef.current = value
    return controls.stop
  }, [value, spring, reduced, opts?.flash])

  const display = useTransform(spring, (v) =>
    new Intl.NumberFormat('es-CO').format(Math.round(v))
  )

  return { display, flashRef }
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS (to satisfy rules-of-hooks)
// ────────────────────────────────────────────────────────────────────────────

import type { SugarOption } from '@/lib/config'

interface CartItemProps {
  item: { productId: string; quantity: number; sugar?: SugarOption }
  product: { id: string; name: string; price: number; image: string }
  reducedMotion: boolean
  updateQuantity: (productId: string, quantity: number, sugar?: SugarOption) => void
  removeFromCart: (productId: string, sugar?: SugarOption) => void
  lineKey: string
}

function CartItem({ item, product, reducedMotion, updateQuantity, removeFromCart, lineKey }: CartItemProps) {
  const qtyAnim = useAnimatedNumber(item.quantity)
  const lineTotalAnim = useAnimatedNumber(product.price * item.quantity)

  return (
    <motion.div
      key={lineKey}
      layout
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={reducedMotion ? REDUCED_TRANSITION : { type: 'spring', stiffness: 380, damping: 26, mass: 0.9 }}
      className="flex gap-3 p-3.5 rounded-2xl bg-white border border-yak-griego/60 shadow-sm"
    >
      {/* Product image */}
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-yak-griego relative">
        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-yak-ink truncate">{product.name}</p>
        <p className="text-xs font-semibold text-yak-mango">${product.price.toLocaleString('es-CO')}</p>
        {item.sugar && (
          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-yak-cream text-[11px] font-medium text-yak-muted border border-yak-griego">
            {sugarLabel(item.sugar)}
          </span>
        )}
        <div className="quantity-stepper mt-2" role="group" aria-label={`Cantidad de ${product.name}`}>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.sugar)}
            className="quantity-btn"
            aria-label={`Disminuir ${product.name}`}
            disabled={item.quantity <= 1}
          >
            <Minus width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
          </button>
          <span className="quantity-value" aria-live="polite" aria-atomic="true">
            <motion.span>{qtyAnim.display}</motion.span>
          </span>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.sugar)}
            className="quantity-btn"
            aria-label={`Aumentar ${product.name}`}
          >
            <Plus width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => removeFromCart(item.productId, item.sugar)}
          className="text-yak-muted/40 hover:text-yak-fresa p-1 transition-colors btn-icon !min-w-[32px] !min-h-[32px] !p-1"
          aria-label={`Eliminar ${product.name}`}
        >
          <Trash width={14} height={14} weight="regular" color="currentColor" aria-hidden="true" />
        </button>
        <span className="text-xs font-bold text-yak-navy price-display">
          $<motion.span>{lineTotalAnim.display}</motion.span>
        </span>
      </div>
    </motion.div>
  )
}

interface PaymentSummaryItemProps {
  item: { productId: string; quantity: number; sugar?: SugarOption }
  product: { id: string; name: string; price: number }
  lineKey: string
}

function PaymentSummaryItem({ item, product, lineKey }: PaymentSummaryItemProps) {
  const lineAnim = useAnimatedNumber(product.price * item.quantity)

  return (
    <div key={lineKey} className="flex justify-between text-xs">
      <span className="text-yak-ink font-medium">
        {item.quantity}× {product.name}
        {item.sugar ? ` (${sugarLabel(item.sugar)})` : ''}
      </span>
      <span className="font-semibold text-yak-navy">
        $<motion.span>{lineAnim.display}</motion.span>
      </span>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

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

  const router = useRouter()
  const reducedMotion = useReducedMotion() ?? false

  // ── Drawer ref ──────────────────────────────────────────────────────────────
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const focusablesRef = useRef<HTMLElement[]>([])
  const prevScrollbarWRef = useRef<string>('')
  const bodyOverflowRef = useRef<string>('')

  // ── Cargar cliente guardado de compras anteriores en localStorage ────────
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

  // ── Scroll lock + paddingRight (sin reflow) + focus trap ─────────────────
  useEffect(() => {
    if (!isCartOpen) return

    triggerRef.current = document.activeElement as HTMLElement | null

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth
    prevScrollbarWRef.current = document.documentElement.style.getPropertyValue('--scrollbar-w')
    bodyOverflowRef.current = document.body.style.overflow
    document.documentElement.style.setProperty('--scrollbar-w', `${scrollbarW}px`)
    document.body.setAttribute('data-scroll-lock', 'true')
    document.body.setAttribute('data-focus-trap-active', 'true')

    const updateFocusables = () => {
      if (!drawerRef.current) return
      const nodes = drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      focusablesRef.current = Array.from(nodes).filter((el) => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && el.getAttribute('aria-hidden') !== 'true'
      })
    }
    updateFocusables()

    // Primer foco: primer focusable o close btn
    requestAnimationFrame(() => {
      updateFocusables()
      const first = focusablesRef.current.find((el) => el.getAttribute('data-autofocus') === 'true')
        || focusablesRef.current[0]
      first?.focus({ preventScroll: true })
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeCart()
        return
      }
      if (e.key === 'Tab' && drawerRef.current) {
        updateFocusables()
        const els = focusablesRef.current
        if (els.length === 0) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus({ preventScroll: true })
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus({ preventScroll: true })
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.documentElement.style.setProperty('--scrollbar-w', prevScrollbarWRef.current)
      document.body.removeAttribute('data-scroll-lock')
      document.body.removeAttribute('data-focus-trap-active')
      document.body.style.overflow = bodyOverflowRef.current
      triggerRef.current?.focus({ preventScroll: true })
    }
  }, [isCartOpen, closeCart])

  // Actualizar focusables cuando cambia la view
  useEffect(() => {
    if (!isCartOpen) return
    requestAnimationFrame(() => {
      if (!drawerRef.current) return
      const nodes = drawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      focusablesRef.current = Array.from(nodes).filter((el) => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && el.getAttribute('aria-hidden') !== 'true'
      })
    })
  }, [view, isCartOpen, items.length, customerData])

  // Reset view when drawer closes
  useEffect(() => {
    if (!isCartOpen) {
      const timer = setTimeout(() => setView('cart'), 300)
      return () => clearTimeout(timer)
    }
  }, [isCartOpen])

  // ── Ajustar botellas a devolver cuando cambian las unidades ──────────────
  const maxReturnable = useMemo(() => {
    if (!customerData || (customerData.bottlesInPossession || 0) <= 0) return 0
    return Math.min(customerData.bottlesInPossession, totalUnits)
  }, [customerData, totalUnits])

  useEffect(() => {
    if (bottlesToReturn > maxReturnable) {
      setBottlesToReturn(maxReturnable)
    }
  }, [maxReturnable, bottlesToReturn])

  // ── Cálculo de descuentos en vivo ────────────────────────────────────────
  const bottleDiscount = bottlesToReturn * BOTTLE_DISCOUNT
  const hasLoyaltyFreeBottle = useMemo(() => {
    if (!customerData) return false
    return (customerData.bottlesHistory || 0) >= BOTTLES_FOR_FREE && totalUnits > 0
  }, [customerData, totalUnits])

  const loyaltyDiscount = useMemo(() => {
    if (!hasLoyaltyFreeBottle) return 0
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

  // ── Búsqueda de cliente por teléfono (1 clic) ────────────────────────────
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
      // Cerrar el drawer después de limpiar el carrito
      closeCart()
    } catch {
      // Still show success
      closeCart()
    } finally {
      setPaymentReporting(false)
    }
  }

  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '3006539429'
  const PAYMENT_ACCOUNT = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT || 'pasa a esta llave Bre-B'

  // ── Animated numbers instances ───────────────────────────────────────────
  const subtotalAnim = useAnimatedNumber(subtotal)
  const deliveryAnim = useAnimatedNumber(deliveryCost)
  const bottleDiscountAnim = useAnimatedNumber(bottleDiscount, { flash: true })
  const loyaltyAnim = useAnimatedNumber(loyaltyDiscount)
  const totalAnim = useAnimatedNumber(total)
  const bottlesAnim = useAnimatedNumber(bottlesToReturn)
  const totalUnitsAnim = useAnimatedNumber(totalUnits)

  // ── Helpers render ───────────────────────────────────────────────────────
  const LoadingSpinner = () => <span className="spinner-brand" aria-hidden="true" />

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence mode="wait">
      {isCartOpen && (
        <div className="fixed inset-0 z-[100]" data-focus-trap-layer="true">
          {/* Overlay / Scrim */}
          <motion.div
            className="scrim absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? REDUCED_TRANSITION : SCRIM_TRANSITION}
            onClick={closeCart}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            className="absolute right-0 top-0 h-full w-full max-w-md material-drawer flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              ...(reducedMotion ? REDUCED_TRANSITION : SLIDE_OPEN),
              exit: reducedMotion ? REDUCED_TRANSITION : SLIDE_CLOSE,
            }}
          >

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-yak-griego/80 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-yak-mango" />
                <h2 id="cart-drawer-title" className="font-display font-bold text-lg text-yak-navy">
                  {view === 'cart' && 'Tu Canasta YAK'}
                  {view === 'checkout' && 'Datos de Entrega'}
                  {view === 'payment' && 'Confirmación y Pago'}
                  {view === 'confirmation' && '¡Pedido Recibido!'}
                </h2>
              </div>
              <button
                onClick={closeCart}
                className="btn-icon p-1.5 text-yak-muted hover:text-yak-ink hover:bg-yak-griego rounded-full"
                aria-label="Cerrar canasta"
                data-autofocus="true"
              >
                <X width={18} height={18} weight="regular" color="currentColor" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-y-auto px-6 py-5 safer-inset-bottom"
              aria-live="polite"
              aria-relevant="additions removals"
            >
              {/* ─── CART VIEW ─── */}
              {view === 'cart' && (
                <>
                  {isEmpty ? (
                    <div className="empty-state h-full mt-4">
                      <div className="empty-state-icon-wrap">
                        <span className="font-display font-extrabold text-3xl tracking-tight text-yak-mango select-none">yak</span>
                      </div>
                      <h3 className="empty-state-title">Tu canasta está vacía</h3>
                      <p className="empty-state-body">
                        Agrega sabores reales y te los llevamos en vidrio retornable a tu puerta. Cero mentiras en la etiqueta.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          closeCart()
                          router.push('/productos')
                        }}
                        className="btn-primary"
                      >
                        Ver sabores disponibles
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4" aria-label="Productos en la canasta">
                      {items.map((item) => {
                        const product = PRODUCTS[item.productId]
                        if (!product) return null
                        return (
                          <CartItem
                            key={lineKey(item.productId, item.sugar)}
                            item={item}
                            product={product}
                            reducedMotion={reducedMotion}
                            updateQuantity={updateQuantity}
                            removeFromCart={removeFromCart}
                            lineKey={lineKey(item.productId, item.sugar)}
                          />
                        )
                      })}

                      {/* Info sobre retorno de vidrio */}
                      <div className="p-3.5 rounded-xl bg-yak-feijoa/10 border border-yak-feijoa/25 text-xs text-yak-navy space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                          <span aria-hidden="true">♻️</span> Economía Circular YAK
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
                          <span className="text-base" aria-hidden="true">👋</span>
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
                        <div className="badge-primary inline-flex items-center gap-1">
                          <span aria-hidden="true">⭐</span> Cliente Fundador (Domicilio $0)
                        </div>
                      )}

                      {/* Estado de fidelidad */}
                      <div className="pt-2 border-t border-yak-griego text-xs">
                        {hasLoyaltyFreeBottle ? (
                          <p className="text-yak-feijoa font-bold flex items-center gap-1">
                            <span aria-hidden="true">🎁</span> ¡Tienes 1 yogur gratis por fidelidad 10+1 en este pedido!
                          </p>
                        ) : (
                          <p className="text-yak-muted">
                            <span aria-hidden="true">🥛</span> Fidelidad 10+1: Llevas{' '}
                            <strong>{(customerData.bottlesHistory || 0) % BOTTLES_FOR_FREE} / {BOTTLES_FOR_FREE}</strong> botellas acumuladas.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white border border-yak-griego shadow-sm space-y-3">
                      <div className="flex rounded-xl bg-yak-cream p-1 text-xs font-semibold" role="tablist" aria-label="Tipo de cliente">
                        <button
                          type="button"
                          role="tab"
                          aria-selected={authMode === 'existing'}
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
                          role="tab"
                          aria-selected={authMode === 'new'}
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
                          <label htmlFor="lookup-phone" className="block text-xs font-semibold text-yak-muted">
                            Ingresa tu WhatsApp para autocompletar:
                          </label>
                          <div className="flex gap-2">
                            <input
                              id="lookup-phone"
                              type="tel"
                              value={lookupPhone}
                              onChange={(e) => setLookupPhone(e.target.value)}
                              placeholder="300 123 4567"
                              className="input-field flex-1 !py-2 text-sm"
                              autoComplete="tel"
                            />
                            <button
                              type="button"
                              onClick={() => handleLookupCustomer()}
                              disabled={lookupLoading}
                              aria-busy={lookupLoading}
                              data-ui-state={lookupLoading ? 'loading' : undefined}
                              className="px-4 py-2 rounded-xl bg-yak-navy text-white text-xs font-bold hover:bg-yak-navy/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[44px]"
                            >
                              {lookupLoading ? (
                                <>
                                  <LoadingSpinner />
                                  <span>Cargando</span>
                                </>
                              ) : (
                                'Cargar'
                              )}
                            </button>
                          </div>
                          {lookupError && (
                            <div className="inline-error" role="alert">
                              <svg className="inline-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <p>{lookupError}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selector interactivo de devolución de botellas */}
                  {customerData && (customerData.bottlesInPossession || 0) > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-emerald-900">
                            <span aria-hidden="true">🔄</span> Devolución de Botellas de Vidrio
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
                        <div className="quantity-stepper bg-white px-2 py-1 rounded-xl border border-emerald-300" role="group" aria-label="Botellas a devolver">
                          <button
                            type="button"
                            onClick={() => setBottlesToReturn((b) => Math.max(0, b - 1))}
                            className="w-6 h-6 rounded-full border border-emerald-300 text-emerald-900 font-bold flex items-center justify-center hover:bg-emerald-50 text-xs !min-w-[32px] !min-h-[32px]"
                            aria-label="Disminuir botellas a devolver"
                            disabled={bottlesToReturn <= 0}
                          >
                            <Minus width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
                          </button>
                          <span className="text-sm font-bold text-emerald-950 w-8 text-center" aria-live="polite" aria-atomic="true">
                            <motion.span>{bottlesAnim.display}</motion.span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setBottlesToReturn((b) => Math.min(maxReturnable, b + 1))}
                            disabled={bottlesToReturn >= maxReturnable}
                            className="w-6 h-6 rounded-full border border-emerald-300 text-emerald-900 font-bold flex items-center justify-center hover:bg-emerald-50 text-xs disabled:opacity-30 !min-w-[32px] !min-h-[32px]"
                            aria-label="Aumentar botellas a devolver"
                          >
                            <Plus width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {bottlesToReturn > 0 && (
                        <p className="text-[11px] text-emerald-800 font-semibold text-right">
                          Ahorras $<motion.span ref={bottleDiscountAnim.flashRef} className="flash-highlight rounded px-1 -mx-1">{bottleDiscountAnim.display}</motion.span> en este pedido
                        </p>
                      )}
                    </div>
                  )}

                  {/* Formulario de entrega */}
                  <div className="space-y-3.5">
                    {/* Zona de entrega */}
                    <div>
                      <label htmlFor="zone" className="input-label">
                        Zona de entrega
                      </label>
                      <select
                        id="zone"
                        value={formData.zone}
                        onChange={(e) => setFormData((p) => ({ ...p, zone: e.target.value }))}
                        className="select-field"
                        aria-invalid={Boolean(errors.zone)}
                        aria-describedby={errors.zone ? 'zone-error' : undefined}
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
                      {errors.zone && <p id="zone-error" className="input-error" role="alert">{errors.zone}</p>}
                    </div>

                    {/* Delivery info */}
                    {deliveryInfo && (
                      <div
                        className={`p-3 rounded-xl text-xs ${
                          deliveryInfo.isWithinCutoff
                            ? 'bg-yak-feijoa/15 text-yak-feijoa'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                        role="status"
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
                      <label htmlFor="name" className="input-label">
                        Tu Nombre
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                        className="input-field"
                        placeholder="Ej: Laura Gómez"
                        autoComplete="name"
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                      />
                      {errors.name && <p id="name-error" className="input-error" role="alert">{errors.name}</p>}
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label htmlFor="phone" className="input-label">
                        Número de WhatsApp
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                        className="input-field"
                        placeholder="300 123 4567"
                        autoComplete="tel"
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                      {errors.phone && <p id="phone-error" className="input-error" role="alert">{errors.phone}</p>}
                    </div>

                    {/* Dirección */}
                    <div>
                      <label htmlFor="address" className="input-label">
                        Dirección exacta
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                        className="input-field"
                        placeholder="Ej: Carrera 5 # 10-25"
                        autoComplete="street-address"
                        aria-invalid={Boolean(errors.address)}
                        aria-describedby={errors.address ? 'address-error' : undefined}
                      />
                      {errors.address && <p id="address-error" className="input-error" role="alert">{errors.address}</p>}
                    </div>

                    {/* Apartamento / Conjunto */}
                    <div>
                      <label htmlFor="apartment" className="input-label">
                        Conjunto / Torre / Apto <span className="text-yak-muted/60">(opcional)</span>
                      </label>
                      <input
                        id="apartment"
                        type="text"
                        value={formData.apartment}
                        onChange={(e) => setFormData((p) => ({ ...p, apartment: e.target.value }))}
                        className="input-field"
                        placeholder="Ej: Bosques de Cota, Torre 2 Apto 401"
                        autoComplete="address-line2"
                      />
                    </div>

                    {/* Instrucciones */}
                    <div>
                      <label htmlFor="instructions" className="input-label">
                        Notas para el domiciliario <span className="text-yak-muted/60">(opcional)</span>
                      </label>
                      <textarea
                        id="instructions"
                        value={formData.instructions}
                        onChange={(e) => setFormData((p) => ({ ...p, instructions: e.target.value }))}
                        className="textarea-field"
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
                  <div className="p-4 rounded-2xl bg-white border border-yak-griego/80 shadow-sm space-y-3" aria-label="Resumen del pedido">
                    <p className="text-xs font-bold text-yak-muted uppercase tracking-wider">
                      Resumen de compra
                    </p>
                    {items.map((item) => {
                      const product = PRODUCTS[item.productId]
                      if (!product) return null
                      return (
                        <PaymentSummaryItem
                          key={lineKey(item.productId, item.sugar)}
                          item={item}
                          product={product}
                          lineKey={lineKey(item.productId, item.sugar)}
                        />
                      )
                    })}

                    <div className="border-t border-yak-griego pt-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between text-yak-muted">
                        <span>Subtotal</span>
                        <span>$<motion.span>{subtotalAnim.display}</motion.span></span>
                      </div>

                      {bottleDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Retorno de {bottlesToReturn} botella(s)</span>
                          <span>-$<motion.span ref={bottleDiscountAnim.flashRef} className="flash-highlight rounded px-1 -mx-1">{bottleDiscountAnim.display}</motion.span></span>
                        </div>
                      )}

                      {loyaltyDiscount > 0 && (
                        <div className="flex justify-between text-yak-feijoa font-bold">
                          <span>Yogur gratis Fidelidad (10+1)</span>
                          <span>-$<motion.span>{loyaltyAnim.display}</motion.span></span>
                        </div>
                      )}

                      <div className="flex justify-between text-yak-muted">
                        <span>Domicilio ({formData.zone})</span>
                        <span>
                          {isFreeDelivery ? (
                            <span className="text-emerald-700 font-semibold">Gratis</span>
                          ) : (
                            <>$<motion.span>{deliveryAnim.display}</motion.span></>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm font-bold text-yak-navy pt-2 border-t border-yak-griego">
                        <span>Total a pagar</span>
                        <span className="text-base font-display price-display">
                          $<motion.span>{totalAnim.display}</motion.span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="inline-error" role="alert">
                      <svg className="inline-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p>{errors.submit}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── CONFIRMATION VIEW ─── */}
              {view === 'confirmation' && (
                <div className="flex flex-col items-center text-center py-6">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={reducedMotion ? REDUCED_TRANSITION : { type: 'spring', stiffness: 350, damping: 18 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3 shadow-inner"
                  >
                    <CheckCircle width={32} height={32} weight="fill" color="#6B8E5E" aria-hidden="true" />
                  </motion.div>
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
                      {/* Instrucciones de Pago */}
                      <div className="p-4 rounded-2xl bg-yak-navy/5 border border-yak-navy/15 space-y-2.5 text-left">
                        <p className="text-xs font-bold text-yak-navy uppercase tracking-wider">
                          Transferencia Directa
                        </p>
                        <p className="text-xs text-yak-ink leading-relaxed">
                          Realiza la transferencia de <strong className="price-display">${total.toLocaleString('es-CO')}</strong> a la cuenta autorizada:
                        </p>
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-yak-griego">
                          <code className="flex-1 text-xs font-mono font-bold text-yak-navy break-all">
                            {PAYMENT_ACCOUNT}
                          </code>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(PAYMENT_ACCOUNT)}
                            className="text-xs text-yak-navy font-semibold px-2.5 py-1 rounded-lg bg-yak-cream hover:bg-yak-griego border border-yak-griego transition-colors"
                            aria-label={`Copiar cuenta de pago: ${PAYMENT_ACCOUNT}`}
                          >
                            Copiar
                          </button>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-yak-cream border border-yak-griego text-left">
                        <p className="text-xs text-yak-ink leading-relaxed">
                          <span aria-hidden="true">💡</span> Realiza tu pago por transferencia y presiona el botón para notificar al equipo de producción YAK.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handlePaymentReported}
                        disabled={paymentReporting}
                        aria-busy={paymentReporting}
                        data-ui-state={paymentReporting ? 'loading' : undefined}
                        className="w-full py-3.5 rounded-full bg-yak-navy text-white font-bold text-sm hover:bg-yak-navy/90 transition-colors shadow-md disabled:opacity-50 min-h-[44px] inline-flex items-center justify-center gap-2"
                      >
                        {paymentReporting ? (
                          <>
                            <LoadingSpinner />
                            <span>Notificando pago...</span>
                          </>
                        ) : (
                          'Ya realicé la transferencia'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <div className="inline-success" role="status">
                        <CheckCircle width={20} height={20} weight="regular" color="currentColor" aria-hidden="true" className="inline-success-icon" />
                        <p className="text-xs font-semibold">Pago reportado exitosamente. Te avisaremos por WhatsApp cuando sea confirmado.</p>
                      </div>
                      <a
                        href={`https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hola YAK, acabo de pagar mi pedido ${orderResult?.id} a nombre de ${formData.name}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3.5 rounded-full bg-emerald-600 text-white font-bold text-sm text-center hover:bg-emerald-700 transition-colors shadow-md min-h-[44px]"
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
              <div className="px-6 py-4 border-t border-yak-griego/80 bg-white/80 backdrop-blur-sm safer-inset-bottom">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-yak-muted font-medium">Subtotal (<motion.span className="inline">{totalUnitsAnim.display}</motion.span> L)</span>
                  <span className="font-bold text-yak-navy font-display price-display">
                    $<motion.span>{subtotalAnim.display}</motion.span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setView('checkout')}
                  className="btn-primary w-full !py-3.5 !text-sm"
                >
                  Continuar a entrega
                </button>
              </div>
            )}

            {view === 'checkout' && (
              <div className="px-6 py-4 border-t border-yak-griego/80 bg-white/80 backdrop-blur-sm safer-inset-bottom">
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-yak-muted">Total estimado</span>
                  <span className="font-bold text-yak-navy text-sm font-display price-display">
                    $<motion.span>{totalAnim.display}</motion.span>
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setView('cart')}
                    aria-label="Volver a la canasta"
                    className="px-4 py-3 rounded-full border border-yak-griego text-xs font-bold text-yak-muted hover:text-yak-ink hover:border-yak-navy transition-colors !min-h-[44px]"
                  >
                    <ArrowLeft width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    className="btn-primary flex-1 !py-3.5 !text-sm"
                  >
                    Ir al pago
                  </button>
                </div>
              </div>
            )}

            {view === 'payment' && (
              <div className="px-6 py-4 border-t border-yak-griego/80 bg-white/80 backdrop-blur-sm safer-inset-bottom">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setView('checkout')}
                    aria-label="Volver a datos de entrega"
                    className="px-4 py-3 rounded-full border border-yak-griego text-xs font-bold text-yak-muted hover:text-yak-ink hover:border-yak-navy transition-colors !min-h-[44px]"
                  >
                    <ArrowLeft width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateOrder}
                    disabled={submitting}
                    aria-busy={submitting}
                    data-ui-state={submitting ? 'loading' : undefined}
                    className="btn-primary flex-1 !py-3.5 !text-sm !bg-yak-mango hover:!brightness-105"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner />
                        <span>Registrando...</span>
                      </>
                    ) : (
                      'Confirmar mi pedido'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}