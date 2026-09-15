'use client'

import { useState } from 'react'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS, type SugarOption } from '@/lib/config'
import { useCart } from '@/lib/cart-context'
import { useReveal, useStaggerReveal } from '@/lib/use-gsap'

const FLAVOR_TAGLINES: Record<string, string> = {
  GRIEGO: 'Puro y clásico',
  FRESA: 'Dulce y fresca',
  MORA: 'Intenso y afrutado',
  MANGO: 'Tropical y cremoso',
  FEIJOA: 'Exótico y único',
}

const FLAVOR_ACCENT: Record<string, string> = {
  GRIEGO: 'bg-yak-griego',
  FRESA: 'bg-yak-fresa/15',
  MORA: 'bg-yak-mora/15',
  MANGO: 'bg-yak-mango/15',
  FEIJOA: 'bg-yak-feijoa/15',
}

// Max render widths per image (from native resolution analysis)
const IMAGE_WIDTHS: Record<string, number> = {
  GRIEGO: 680,
  FRESA: 680,
  MANGO: 680,
  MORA: 580,
  FEIJOA: 640,
}

export default function ProductosPage() {
  const headerReveal = useReveal({ y: 30 })
  const gridReveal = useStaggerReveal({ stagger: 0.1, y: 30 })

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section ref={headerReveal} className="pt-24 pb-8 md:pt-28 md:pb-12 px-6 max-w-7xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-yak-muted mb-3">
          <span className="w-6 h-px bg-yak-mango" />
          Nuestros sabores
          <span className="w-6 h-px bg-yak-mango" />
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-yak-navy mb-3">
          Elige tus yogures
        </h1>
        <p className="text-yak-muted max-w-lg mx-auto">
          Cada botella es de 1 litro, hecha con ingredientes naturales en Cota.
          Elige tus sabores y arma tu pedido.
        </p>
      </section>

      {/* Product grid */}
      <section className="pb-12 px-6 max-w-7xl mx-auto">
        <div ref={gridReveal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(PRODUCTS).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {/* Free delivery promo card */}
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-yak-navy text-white text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4l3 3v5a1 1 0 01-1 1h-1" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <h3 className="font-display font-bold text-lg mb-2">
              Domicilio gratis
            </h3>
            <p className="text-sm text-white/70 mb-1">
              Con 3 o más unidades
            </p>
            <p className="text-xs text-white/50">
              Aplica para todas las zonas
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function ProductCard({ product }: { product: typeof PRODUCTS[string] }) {
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)
  // Con/sin azúcar: solo aplica a sabores de fruta (el Griego es natural).
  const showSugarToggle = product.id !== 'GRIEGO'
  const [sugar, setSugar] = useState<SugarOption>('CON')

  const handleAdd = () => {
    addToCart(product.id, quantity, showSugarToggle ? sugar : undefined)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    setQuantity(1)
  }

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-yak-griego/50 hover:border-yak-griego transition-colors">
      {/* Image */}
      <div className={`relative aspect-[4/3] overflow-hidden ${FLAVOR_ACCENT[product.id] || 'bg-yak-griego'}`}>
        <Image
          src={product.image}
          alt={product.name}
          width={IMAGE_WIDTHS[product.id] || 680}
          height={Math.round((IMAGE_WIDTHS[product.id] || 680) * 0.6)}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Price tag */}
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-yak-navy/80 backdrop-blur-sm text-white text-xs font-bold">
          ${product.price.toLocaleString('es-CO')}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg text-yak-ink">
            {product.name}
          </h3>
          <p className="text-sm text-yak-muted mt-0.5">
            {FLAVOR_TAGLINES[product.id] || product.description}
          </p>
          <p className="text-xs text-yak-muted/60 mt-1">1 litro</p>

          {showSugarToggle && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                Azúcar
              </p>
              <div className="inline-flex rounded-full border border-yak-griego overflow-hidden">
                {(['CON', 'SIN'] as SugarOption[]).map((opt) => {
                  const active = sugar === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => setSugar(opt)}
                      className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-yak-navy text-white'
                          : 'bg-white text-yak-muted hover:text-yak-ink'
                      }`}
                    >
                      {opt === 'CON' ? 'Con azúcar' : 'Sin azúcar'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quantity + Add */}
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center border border-yak-griego rounded-full">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center text-yak-muted hover:text-yak-ink transition-colors"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-8 h-8 flex items-center justify-center text-yak-muted hover:text-yak-ink transition-colors"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${
              added
                ? 'bg-yak-feijoa text-white'
                : 'bg-yak-navy text-white hover:bg-yak-navy/90'
            }`}
          >
            {added ? '✓ Agregado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
