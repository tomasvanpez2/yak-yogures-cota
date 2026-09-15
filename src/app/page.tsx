'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS } from '@/lib/config'
import { useReveal, useParallax, useStaggerReveal } from '@/lib/use-gsap'

const STEPS = [
  { num: '01', title: 'Elige', text: 'Sabores y cantidades' },
  { num: '02', title: 'Recibe', text: 'En tu día de ruta' },
  { num: '03', title: 'Paga', text: 'Transferencia simple' },
]

export default function Home() {
  const heroParallax = useParallax(0.25)
  const brandReveal = useReveal({ y: 40, duration: 1 })
  const flavorsReveal = useReveal({ y: 40 })
  const flavorsGrid = useStaggerReveal({ stagger: 0.08, y: 30 })
  const stepsReveal = useReveal({ y: 30 })
  const stepsGrid = useStaggerReveal({ stagger: 0.15, y: 20 })
  const ctaReveal = useReveal({ y: 30 })

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ─── HERO — full-bleed cinematic ─── */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background image with parallax */}
        <div ref={heroParallax} className="absolute inset-0 w-full h-[120%] -top-[10%]">
          <Image
            src="/assets/hero-strawberry.jpg"
            alt="Yogur artesanal con fresas frescas"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Gradient overlay — dark from left, transparent to right */}
          <div className="absolute inset-0 bg-gradient-to-r from-yak-navy/80 via-yak-navy/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Hero content — left-aligned for cinematic feel */}
        <div className="relative z-10 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full">
          <div className="max-w-lg">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-white/50 mb-4">
              Yogur artesanal
            </p>
            <h1 className="font-display font-extrabold text-white mb-4 leading-[1.05]"
                style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
              yak
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-display mb-3">
              fresco · natural · artesanal
            </p>
            <p className="text-sm text-white/50 mb-8 max-w-sm">
              Hecho a mano en Cota. Ingredientes reales, botellas de vidrio reutilizables.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-yak-navy font-bold text-sm hover:bg-white/90 transition-colors"
              >
                Ver sabores
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <span className="text-xs text-white/40 self-center">Desde $19.000</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BRAND TEASER ─── */}
      <section className="py-24 md:py-32 px-6">
        <div ref={brandReveal} className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-extrabold text-display-lg text-yak-navy mb-6 leading-tight">
            Ingredientes reales.<br />
            <span className="text-yak-muted">Nada que esconder.</span>
          </h2>
          <p className="text-lg text-yak-muted max-w-xl mx-auto mb-8">
            Cada botella contiene lo que debería: leche, fruta y cultivos. Sin atajos.
            Lotes pequeños, producción cuidadosa en Cota.
          </p>
          <Link
            href="/filosofia"
            className="inline-flex items-center gap-2 text-sm font-medium text-yak-navy hover:text-yak-mango transition-colors"
          >
            Conoce nuestra historia
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── FLAVOR PREVIEW ─── */}
      <section className="py-16 px-6 bg-yak-griego/30">
        <div className="max-w-6xl mx-auto">
          <div ref={flavorsReveal} className="text-center mb-10">
            <h2 className="font-display font-extrabold text-display-md text-yak-navy mb-2">
              Nuestros sabores
            </h2>
            <p className="text-yak-muted">5 sabores, todos de 1 litro</p>
          </div>
          <div ref={flavorsGrid} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Object.values(PRODUCTS).map((product) => (
              <Link
                key={product.id}
                href="/productos"
                className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-yak-griego/50 hover:border-yak-navy/20 transition-all"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-display font-bold">
                    {product.name.replace('Yogur de ', '').replace('Yogur ', '')}
                  </p>
                  <p className="text-white/70 text-xs">
                    ${product.price.toLocaleString('es-CO')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-yak-navy text-yak-navy font-medium text-sm hover:bg-yak-navy hover:text-white transition-all"
            >
              Ver todos los sabores
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS MINI ─── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div ref={stepsReveal}>
            <h2 className="font-display font-extrabold text-display-md text-yak-navy mb-10">
              Así de simple
            </h2>
          </div>
          <div ref={stepsGrid} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num}>
                <span className="text-xs font-bold text-yak-mango/60 tracking-wider">
                  {step.num}
                </span>
                <h3 className="font-display font-bold text-xl text-yak-ink mt-2 mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-yak-muted">{step.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-2 text-sm font-medium text-yak-navy hover:text-yak-mango transition-colors"
            >
              Más detalles
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 px-6 bg-yak-navy text-white text-center">
        <div ref={ctaReveal} className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-display-md mb-4">
            Arma tu pedido
          </h2>
          <p className="text-white/60 mb-8">
            Elige tus sabores, recibe en tu zona, paga por transferencia.
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-yak-mango text-white font-bold text-sm hover:brightness-110 transition-all"
          >
            Ver productos
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
