'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS } from '@/lib/config'
import { useReveal, useSequentialReveal, useStaggerReveal } from '@/lib/use-gsap'

export default function FilosofiaPage() {
  const heroReveal = useReveal({ y: 30, duration: 1.2 })
  const processReveal = useSequentialReveal({ y: 60, stagger: 0.15 })
  const ingredientReveal = useReveal({ y: 40 })
  const flavorGrid = useStaggerReveal({ stagger: 0.08, y: 20 })
  const sustainReveal = useReveal({ y: 40 })
  const ctaReveal = useReveal({ y: 30 })

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ─── HERO — produccion.jpeg con overlay ─── */}
      <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/assets/produccion.jpeg"
            alt="Producción artesanal de yogur YAK en Cota"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-yak-navy/50" />
        </div>
        <div ref={heroReveal} className="relative z-10 text-center px-6 text-white">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase text-white/60 mb-4">
            Nuestra historia
          </p>
          <h1 className="font-display font-extrabold text-display-xl mb-4 leading-[1.05]">
            Producido en Cota.<br />
            Entregado fresco.
          </h1>
          <p className="text-lg text-white/70 max-w-lg mx-auto">
            Yogur artesanal hecho a mano, lote por lote.
          </p>
        </div>
      </section>

      {/* ─── STORY BLOCKS — sequential scroll reveal ─── */}
      <section className="py-24 md:py-32 px-6">
        <div ref={processReveal} className="max-w-3xl mx-auto text-center space-y-32">
          {/* Block 1 — Lotes pequeños */}
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-yak-muted mb-6">
              <span className="w-6 h-px bg-yak-mango" />
              El proceso
              <span className="w-6 h-px bg-yak-mango" />
            </span>
            <h2 className="font-display font-extrabold text-display-lg text-yak-navy mb-6 leading-tight">
              Lotes pequeños,<br />
              producción cuidadosa.
            </h2>
            <p className="text-lg text-yak-muted leading-relaxed max-w-xl mx-auto">
              No producimos en masa. Cada lote se hace con atención —
              controlamos la temperatura, el tiempo de fermentación y la proporción
              de fruta. Así cada botella sabe como debe saber.
            </p>
          </div>

          {/* Block 2 — De dónde viene la leche */}
          <div>
            <h2 className="font-display font-extrabold text-display-lg text-yak-navy mb-6 leading-tight">
              De dónde viene<br />
              la leche.
            </h2>
            <p className="text-lg text-yak-muted leading-relaxed max-w-xl mx-auto">
              Leche fresca de la sabana de Bogotá. Sin conservantes, sin colorantes,
              sin saborizantes artificiales. Lo que ves en la etiqueta es lo que hay
              dentro: leche, fruta y cultivos.
            </p>
          </div>

          {/* Block 3 — Sin atajos */}
          <div>
            <h2 className="font-display font-extrabold text-display-lg text-yak-navy mb-6 leading-tight">
              Sin atajos.
            </h2>
            <p className="text-xl text-yak-muted leading-relaxed max-w-xl mx-auto italic">
              &ldquo;Cada botella contiene lo que debería: leche, fruta y cultivos.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ─── INGREDIENTES REALES ─── */}
      <section className="py-16 px-6 bg-yak-griego/30">
        <div className="max-w-5xl mx-auto">
          <div ref={ingredientReveal} className="text-center mb-10">
            <h2 className="font-display font-extrabold text-display-md text-yak-navy mb-2">
              Ingredientes reales. Nada que esconder.
            </h2>
          </div>
          <div ref={flavorGrid} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.values(PRODUCTS).map((product) => (
              <div
                key={product.id}
                className="relative aspect-square rounded-2xl overflow-hidden bg-white"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOSTENIBILIDAD ─── */}
      <section className="py-20 px-6">
        <div ref={sustainReveal} className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-extrabold text-display-md text-yak-navy mb-6">
            Botellas de vidrio.
          </h2>
          <p className="text-lg text-yak-muted leading-relaxed max-w-xl mx-auto">
            Cada yogur viene en una botella de vidrio que puedes reutilizar docenas de veces.
            No es un eslogan — es así como lo hacemos porque tiene sentido.
          </p>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 px-6 text-center bg-yak-navy text-white">
        <div ref={ctaReveal} className="max-w-2xl mx-auto">
          <h2 className="font-display font-bold text-display-md mb-4">
            Conoce nuestros sabores
          </h2>
          <p className="text-white/60 mb-8">
            5 sabores, todos de 1 litro, hechos con ingredientes reales.
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
