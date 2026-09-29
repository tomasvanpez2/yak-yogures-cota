'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS, type SugarOption } from '@/lib/config'
import { useCart, lineKey } from '@/lib/cart-context'
import { useReveal, useStaggerReveal, usePressScale } from '@/lib/use-gsap'
import { Minus, Plus, ShoppingCartSimple, Check } from '@phosphor-icons/react'

const FLAVOR_TAGLINES: Record<string, string> = {
  GRIEGO: 'Denso y cremoso, sin espesantes.',
  MORA: 'Mora madura, con su punto ácido.',
  MANGO: 'Mango en su punto de madurez.',
  FRESA: 'Con trozos de fresa.',
  FEIJOA: 'El aroma inconfundible de la feijoa.',
}

const FLAVOR_ACCENT: Record<string, string> = {
  GRIEGO: 'bg-yak-griego',
  FRESA: 'bg-yak-fresa/10',
  MORA: 'bg-yak-mora/10',
  MANGO: 'bg-yak-mango/10',
  FEIJOA: 'bg-yak-feijoa/10',
  FIDELIDAD: 'bg-yak-navy',
}

const IMAGE_WIDTHS: Record<string, number> = {
  GRIEGO: 680,
  FRESA: 680,
  MANGO: 680,
  MORA: 580,
  FEIJOA: 640,
}

type ButtonUiState = 'idle' | 'confirming' | 'loading' | 'error' | 'duplicate'

export default function ProductosPage() {
  const headerReveal = useReveal({ y: 30, duration: 0.8 })
  const gridReveal = useStaggerReveal({ stagger: 0.08, y: 20 })
  const hasProducts = Object.keys(PRODUCTS).length > 0

  return (
    <main className="min-h-screen bg-yak-cream">
      <Navbar />

      <section ref={headerReveal} className="pt-10 md:pt-12 lg:pt-16 pb-10 px-6 max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-label text-yak-muted mb-4">
            <span className="w-6 h-px bg-yak-mango" aria-hidden="true" />
            Lotes pequeños de Cota, Cundinamarca
          </span>
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-yak-navy mb-4 leading-[1.02] text-balance">
            Nuestros Yogures Artesanales
          </h1>
          <p className="text-body-lg text-yak-muted max-w-lg leading-relaxed">
            Cada botella contiene probióticos naturales activos que cuidan suavemente la digestión de toda la familia.
          </p>
        </div>
      </section>

      <section className="pb-20 px-6 max-w-7xl mx-auto">
        {hasProducts ? (
          <div ref={gridReveal} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(PRODUCTS).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}

            <LoyaltyCard />

            <article className="col-span-1 md:col-span-2 lg:col-span-3 material-surface rounded-3xl overflow-hidden">
              <div className="relative p-8 md:p-12 lg:p-14 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-xl text-center md:text-left">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yak-feijoa/10 mb-5 text-yak-feijoa">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M7 19H5" />
                      <path d="M17 19h-2" />
                      <path d="M21 12a9 9 0 0 0-9-9" />
                      <path d="M3 5v14a9 9 0 0 0 4.5 8" />
                      <path d="M12 2v4" />
                      <path d="M12 16v4" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge-success">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Retorno
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-display-sm mb-3 text-yak-navy">
                    Retorno de Botellas
                  </h3>
                  <p className="text-body text-yak-muted/90 mb-5 max-w-md mx-auto md:mx-0">
                    Devuelve tus botellas y descuenta <strong className="text-yak-navy">$2.000</strong> por cada una.
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-pill bg-yak-feijoa/10 text-caption font-medium text-yak-feijoa border border-yak-feijoa/20">
                    Botella de vidrio retornable
                  </span>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                    <Image
                      src="/assets/all-flavors.jpeg"
                      alt="Los 5 sabores YAK en botellas de vidrio"
                      fill
                      className="object-cover rounded-2xl"
                      sizes="160px"
                    />
                  </div>
                  <button className="btn-primary px-6 py-3 text-sm">
                    Conocer más
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <h3 className="empty-state-title">Sin productos por ahora</h3>
            <p className="empty-state-body">Estamos preparando nuevos lotes artesanales. Vuelve pronto para descubrir nuestros sabores.</p>
            <button className="btn-primary">
              Volver al inicio
            </button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}

function LoyaltyCard() {
  return (
    <article className="group flex flex-col rounded-3xl overflow-hidden bg-yak-navy border border-yak-navy transition-all duration-180 ease-out-expo hover:shadow-[0_8px_24px_-4px_rgb(27_42_58_/_0.3)] hover:pointer-fine:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-yak-navy">
        <div className="absolute inset-0 bg-gradient-to-br from-yak-navy to-[#0F1A26] opacity-90" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="72"
            height="72"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="text-white/90"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20" />
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-8 text-center">
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/15 text-white/90 text-caption font-semibold mb-4 border border-white/20">
            Programa de Fidelidad
          </span>
          <h3 className="font-display font-bold text-display-md mb-3 text-white leading-tight">
            Tu 10+1 en YAK
          </h3>
          <p className="text-body text-white/70 mb-6 max-w-sm mx-auto leading-relaxed">
            Cada <strong className="text-white">10 yogures</strong>, el <strong className="text-white">11 va por la casa</strong>.
            Sin cuotas y sin vencimiento.
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-center gap-1.5 text-white/80 text-caption font-medium mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Se acumula automáticamente en cada pedido
          </div>
          <button className="btn-secondary w-full py-3 text-sm">
            Ver mi progreso
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}

function ProductCard({ product }: { product: typeof PRODUCTS[string] }) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart, items } = useCart()
  const [added, setAdded] = useState(false)
  const [uiState, setUiState] = useState<ButtonUiState>('idle')
  const showSugarToggle = product.id !== 'GRIEGO'
  const [sugar, setSugar] = useState<SugarOption>('CON')
  const cardRef = usePressScale(0.99)
  const qtyLockRef = useRef(false)
  const reduceMotion = useReducedMotion()
  const [liquidFill, setLiquidFill] = useState(0)

  const springButton = reduceMotion
    ? { duration: 0.12, ease: 'linear' as const }
    : { type: 'spring' as const, bounce: 0, duration: 0.4 }

  const springTab = reduceMotion
    ? { duration: 0.12, ease: 'linear' as const }
    : { type: 'spring' as const, bounce: 0, duration: 0.35 }

  const handleAdd = () => {
    const exists = items.find(
      (i) => lineKey(i.productId, i.sugar) === lineKey(product.id, showSugarToggle ? sugar : undefined)
    )

    if (exists) {
      setUiState('duplicate')
      setTimeout(() => setUiState('idle'), 450)
      return
    }

    // Animación líquida: llenar de abajo hacia arriba con el color del producto
    setLiquidFill(100)
    setTimeout(() => setLiquidFill(0), 600)

    addToCart(product.id, quantity, showSugarToggle ? sugar : undefined)
    setAdded(true)
    setUiState('confirming')
    setTimeout(() => {
      setAdded(false)
      setUiState('idle')
    }, 900)
    setTimeout(() => setAdded(false), 1200)
    setQuantity(1)
  }

  const handleMinus = () => {
    if (qtyLockRef.current) return
    if (quantity <= 1) return
    qtyLockRef.current = true
    setQuantity((q) => Math.max(1, q - 1))
    setTimeout(() => {
      qtyLockRef.current = false
    }, 300)
  }

  const handlePlus = () => {
    if (qtyLockRef.current) return
    qtyLockRef.current = true
    setQuantity((q) => Math.min(20, q + 1))
    setTimeout(() => {
      qtyLockRef.current = false
    }, 300)
  }

  return (
    <article
      ref={cardRef}
      className="group flex flex-col rounded-3xl overflow-hidden bg-white border border-yak-line transition-all duration-180 ease-out-expo hover:shadow-card hover:pointer-fine:-translate-y-1"
    >
      <div className={`relative aspect-[4/3] overflow-hidden ${FLAVOR_ACCENT[product.id] || 'bg-yak-griego'}`}>
        <Image
          src={product.image}
          alt={product.name}
          width={IMAGE_WIDTHS[product.id] || 680}
          height={Math.round((IMAGE_WIDTHS[product.id] || 680) * 0.75)}
          className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-[700ms] ease-out-expo"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 33vw"
        />
        <span className="absolute top-3 right-3 px-3 py-1.5 rounded-pill bg-yak-navy/95 backdrop-blur-sm text-white text-caption font-bold shadow-soft">
          ${product.price.toLocaleString('es-CO')}
        </span>
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: product.color }} />
      </div>

      <div className="flex-1 flex flex-col p-6">
        <div className="flex-1">
          <h3 className="font-display font-bold text-heading-md text-yak-navy">
            {product.name}
          </h3>
          <p className="text-body-sm text-yak-muted mt-1.5">
            {FLAVOR_TAGLINES[product.id] || product.description}
          </p>
          <p className="text-caption font-medium text-yak-navy/60 mt-2">1 Litro · Botella de Vidrio</p>

          {showSugarToggle && (
            <div className="mt-5">
              <p className="input-label text-xs mb-3">Preferencia de azúcar</p>
              <div className="relative inline-flex" role="tablist" aria-label="Preferencia de azúcar">
                <div className="flex items-center gap-1 bg-yak-griego/50 rounded-pill border border-yak-line p-1">
                  {(['CON', 'SIN'] as SugarOption[]).map((opt) => {
                    const active = sugar === opt
                    return (
                      <button
                        key={opt}
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSugar(opt)}
                        className="relative z-10 px-5 py-2 text-caption font-semibold transition-colors duration-120 ease-out-expo min-h-[40px] min-w-[44px] flex items-center justify-center rounded-pill focus:outline-none"
                        style={{ color: active ? '#1B2A3A' : '#7A756E' }}
                      >
                        {opt === 'CON' ? 'Con azúcar' : 'Sin azúcar'}
                      </button>
                    )
                  })}
                </div>
                <motion.div
                  className="absolute top-1 bottom-1 bg-white rounded-pill shadow-sm"
                  initial={false}
                  animate={{
                    x: sugar === 'CON' ? 4 : 'calc(100% + 4px)',
                    width: sugar === 'CON' ? 'calc(50% - 6px)' : 'calc(50% - 6px)',
                  }}
                  transition={springTab}
                  aria-hidden="true"
                  style={{
                    left: 0,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-yak-line">
          <div className="quantity-stepper">
            <button
              onClick={handleMinus}
              className="quantity-btn"
              aria-label="Disminuir cantidad"
              disabled={quantity <= 1}
            >
              <Minus width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
            </button>
            <span className="quantity-value" aria-live="polite">{quantity}</span>
            <button
              onClick={handlePlus}
              className="quantity-btn"
              aria-label="Aumentar cantidad"
            >
              <Plus width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
            </button>
          </div>
          <button
            onClick={handleAdd}
            className="btn-primary flex-1 py-3.5 text-sm relative overflow-hidden"
            data-ui-state={uiState}
            aria-live="polite"
          >
            {/* Liquid fill animation - bottom to top with product color */}
            <motion.div
              className="absolute inset-0"
              style={{ backgroundColor: product.color }}
              initial={{ height: 0 }}
              animate={{ height: `${liquidFill}%` }}
              transition={reduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
              aria-hidden="true"
            />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? 'added' : 'idle'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={springButton}
                className="inline-flex items-center justify-center gap-1.5 w-full relative z-10"
              >
                {added ? (
                  <>
                    <Check width={16} height={16} weight="regular" color="currentColor" aria-hidden="true" />
                    Agregado
                  </>
                ) : (
                  <>
                    <ShoppingCartSimple width={15} height={15} weight="regular" color="currentColor" aria-hidden="true" />
                    Agregar al carrito
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>
    </article>
  )
}