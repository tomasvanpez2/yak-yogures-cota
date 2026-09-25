'use client'

import { useState } from 'react'
import Image from 'next/image'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS, type SugarOption } from '@/lib/config'
import { useCart } from '@/lib/cart-context'
import { useReveal, useStaggerReveal } from '@/lib/use-gsap'

const FLAVOR_TAGLINES: Record<string, string> = {
  GRIEGO: 'Puro, natural y cremoso',
  FRESA: 'Dulce y fresca con trozos reales',
  MORA: 'Intenso sabor natural',
  MANGO: 'Tropical, natural y suave',
  FEIJOA: 'Exótico sabor colombiano',
}

const FLAVOR_ACCENT: Record<string, string> = {
  GRIEGO: 'bg-yak-griego',
  FRESA: 'bg-yak-fresa/15',
  MORA: 'bg-yak-mora/15',
  MANGO: 'bg-yak-mango/15',
  FEIJOA: 'bg-yak-feijoa/15',
}

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
    <main className="min-h-screen bg-yak-cream">
      <Navbar />

      {/* Hero */}
      <section ref={headerReveal} className="pt-24 pb-8 md:pt-28 md:pb-12 px-6 max-w-7xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-yak-muted mb-3">
          <span className="w-6 h-px bg-yak-mango" />
          Lotes pequeños en Cota
          <span className="w-6 h-px bg-yak-mango" />
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-yak-navy mb-3">
          Nuestros Yogures Artesanales
        </h1>
        <p className="text-yak-muted max-w-lg mx-auto">
          Cada botella de vidrio es de 1 Litro, producida con leche fresca de Cota e ingredientes 100% reales.
        </p>
      </section>

      {/* Product grid */}
      <section className="pb-16 px-6 max-w-7xl mx-auto">
        <div ref={gridReveal} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(PRODUCTS).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}

          {/* Eco promo card */}
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-yak-navy text-white text-center shadow-md">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 text-yak-mango text-xl font-bold">
              ♻️
            </div>
            <h3 className="font-display font-bold text-lg mb-2">
              Retorno de Botellas
            </h3>
            <p className="text-sm text-white/80 mb-2">
              Descuento de <strong>$2.000</strong> por cada botella de vidrio devuelta en tu siguiente pedido.
            </p>
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white/90">
              Sostenible + Fidelidad 10+1
            </span>
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
  const showSugarToggle = product.id !== 'GRIEGO'
  const [sugar, setSugar] = useState<SugarOption>('CON')

  const handleAdd = () => {
    addToCart(product.id, quantity, showSugarToggle ? sugar : undefined)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    setQuantity(1)
  }

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-yak-griego/60 hover:border-yak-navy/20 transition-all duration-300 shadow-sm hover:shadow-md">
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
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-yak-navy/90 backdrop-blur-sm text-white text-xs font-bold shadow">
          ${product.price.toLocaleString('es-CO')}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5">
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg text-yak-ink">
            {product.name}
          </h3>
          <p className="text-sm text-yak-muted mt-0.5">
            {FLAVOR_TAGLINES[product.id] || product.description}
          </p>
          <p className="text-xs font-medium text-yak-navy/70 mt-1">1 Litro • Botella de Vidrio</p>

          {showSugarToggle && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-yak-muted uppercase tracking-wider mb-1.5">
                Preferencia
              </p>
              <div className="inline-flex rounded-full border border-yak-griego overflow-hidden bg-yak-cream/50">
                {(['CON', 'SIN'] as SugarOption[]).map((opt) => {
                  const active = sugar === opt
                  return (
                    <button
                      key={opt}
                      onClick={() => setSugar(opt)}
                      className={`px-3.5 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-yak-navy text-white shadow-sm'
                          : 'bg-transparent text-yak-muted hover:text-yak-ink'
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
        <div className="flex items-center gap-2 mt-5">
          <div className="flex items-center border border-yak-griego rounded-full bg-yak-cream/30">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center text-yak-muted hover:text-yak-ink transition-colors font-medium"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="w-8 h-8 flex items-center justify-center text-yak-muted hover:text-yak-ink transition-colors font-medium"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAdd}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${
              added
                ? 'bg-yak-feijoa text-white'
                : 'bg-yak-navy text-white hover:bg-yak-navy/90 active:scale-[0.98]'
            }`}
          >
            {added ? '✓ Agregado al Carrito' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  )
}
