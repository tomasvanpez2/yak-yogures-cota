'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS } from '@/lib/config'
import { useReveal, useParallax, useStaggerReveal } from '@/lib/use-gsap'

const PILLARS = [
  {
    icon: '🥛',
    title: 'Leche de la sabana',
    text: 'Leche fresca de la Sabana de Bogotá. Sin leche en polvo, sin grasas vegetales, sin cosas que no se pronuncian.',
  },
  {
    icon: '🍓',
    title: 'Fruta de verdad',
    text: 'Mora, mango, fresa y feijoa colombianas, cortadas a mano. Nada de saborizantes ni colorantes.',
  },
  {
    icon: '♻️',
    title: 'Vidrio que vuelve',
    text: 'Botellas de vidrio retornables: devuélvelas en tu próximo pedido y te descontamos $2.000 por cada una.',
  },
]

const STEPS = [
  { num: '01', title: 'Elige', text: 'Sabores y cantidades' },
  { num: '02', title: 'Recibe', text: 'En tu día de ruta' },
  { num: '03', title: 'Paga', text: 'Transferencia simple' },
]

export default function Home() {
  const heroParallax = useParallax(0.25)
  const storyReveal = useReveal({ y: 40, duration: 1 })
  const pillarsGrid = useStaggerReveal({ stagger: 0.12, y: 30 })
  const pillarsReveal = useReveal({ y: 40 })
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
        <div ref={heroParallax} className="absolute inset-0 w-full h-[120%] -top-[10%]">
          <Image
            src="/assets/hero-strawberry.jpg"
            alt="Yogur artesanal YAK con fresas frescas"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-yak-navy/85 via-yak-navy/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full">
          <div className="max-w-xl">
            <p className="text-sm font-semibold tracking-[0.25em] uppercase text-white/60 mb-4">
              Cota · Colombia
            </p>
            <h1 className="font-display font-extrabold text-white mb-5 leading-[1.02]"
                style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
              Natural.<br />
              Artesanal.<br />
              <span className="text-yak-mango">De tu familia, para la tuya.</span>
            </h1>
            <p className="text-base md:text-lg text-white/75 mb-8 max-w-md leading-relaxed">
              Yogur artesanal hecho a mano en Cota, con leche fresca y fruta real.
              El que le darías a tu familia, porque es el que le damos a la nuestra.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-yak-navy font-bold text-sm hover:bg-white/90 transition-colors shadow-lg"
              >
                Conocer sabores
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <span className="text-xs text-white/50 self-center">Desde $19.000 · Botella de 1 litro</span>
            </div>

            {/* Badges orgánicos */}
            <div className="flex flex-wrap gap-2 mt-8">
              {['Lotes pequeños', 'Fruta real', 'Vidrio retornable'].map((badge) => (
                <span
                  key={badge}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/85 text-xs font-medium backdrop-blur-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── NUESTRA HISTORIA — inmediatamente después del hero ─── */}
      <section className="py-24 md:py-32 px-6">
        <div ref={storyReveal} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-yak-muted mb-6">
              <span className="w-8 h-px bg-yak-mango" />
              Nuestra historia
            </span>
            <h2 className="font-display font-extrabold text-display-lg text-yak-navy mb-6 leading-tight">
              Buscábamos un yogur de verdad.<br />
              <span className="text-yak-muted">No lo encontramos.</span><br />
              Entonces lo hicimos.
            </h2>
            <div className="space-y-4 text-base text-yak-muted leading-relaxed">
              <p>
                YAK nació en una cocina de Cota, como una búsqueda familiar: encontrar un yogur
                sin las cosas que le sobran a los yogures industriales — azúcar de más,
                saborizantes, colorantes, nombres raros en la etiqueta.
              </p>
              <p>
                No había una alternativa real. Así que empezamos a hacer el nuestro: leche fresca
                de la sabana, fruta seleccionada a mano, fermentación lenta y lotes pequeños que
                cuidamos uno por uno, como se cuida algo que va a tu mesa.
              </p>
            </div>
            <Link
              href="/filosofia"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-yak-navy hover:text-yak-mango transition-colors"
            >
              Leer nuestra filosofía
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Imagen de producción */}
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="/assets/produccion.jpeg"
              alt="Producción artesanal de yogur YAK en Cota"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yak-navy/85 to-transparent p-5 pt-16">
              <p className="text-white/90 text-sm font-display font-bold">
                Cota, Cundinamarca
              </p>
              <p className="text-white/60 text-xs">
                Donde cada lote se hace a mano, uno por uno.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PILARES DE PUREZA ─── */}
      <section className="py-20 px-6 bg-yak-griego/40">
        <div className="max-w-6xl mx-auto">
          <div ref={pillarsReveal} className="text-center mb-12">
            <h2 className="font-display font-extrabold text-display-md text-yak-navy mb-3">
              Lo que sí hay dentro
            </h2>
            <p className="text-yak-muted max-w-lg mx-auto">
              Tres cosas que no negociamos. Lo que ves en la etiqueta es lo que hay en la botella.
            </p>
          </div>
          <div ref={pillarsGrid} className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="group bg-white rounded-3xl p-7 border border-yak-griego/70 hover:border-yak-navy/25 hover:shadow-lg transition-all"
              >
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yak-cream text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {pillar.icon}
                </span>
                <h3 className="font-display font-bold text-lg text-yak-navy mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-yak-muted leading-relaxed">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FLAVOR PREVIEW ─── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div ref={flavorsReveal} className="text-center mb-10">
            <h2 className="font-display font-extrabold text-display-md text-yak-navy mb-2">
              Nuestros sabores
            </h2>
            <p className="text-yak-muted">5 sabores, todos de 1 litro, en botella de vidrio</p>
          </div>
          <div ref={flavorsGrid} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Object.values(PRODUCTS).map((product) => (
              <Link
                key={product.id}
                href="/productos"
                className="group relative aspect-square rounded-2xl overflow-hidden bg-white border border-yak-griego/50 hover:border-yak-navy/25 hover:shadow-lg transition-all"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-display font-bold">
                    {product.name.replace('Yogur de ', '').replace('Yogur ', '')}
                  </p>
                  <p className="text-white/75 text-xs font-medium">
                    ${product.price.toLocaleString('es-CO')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-yak-navy text-yak-navy font-semibold text-sm hover:bg-yak-navy hover:text-white transition-all"
            >
              Ver todos los sabores
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS MINI ─── */}
      <section className="py-20 px-6 bg-yak-griego/40">
        <div className="max-w-4xl mx-auto text-center">
          <div ref={stepsReveal}>
            <h2 className="font-display font-extrabold text-display-md text-yak-navy mb-10">
              Así de simple
            </h2>
          </div>
          <div ref={stepsGrid} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num}>
                <span className="text-xs font-bold text-yak-mango/70 tracking-wider">
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
              className="inline-flex items-center gap-2 text-sm font-semibold text-yak-navy hover:text-yak-mango transition-colors"
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
      <section className="py-24 px-6 bg-yak-navy text-white text-center">
        <div ref={ctaReveal} className="max-w-2xl mx-auto">
          <h2 className="font-display font-extrabold text-display-md mb-4">
            Pruébalo esta semana
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Elige tus sabores, recíbelos en tu puerta en botellas de vidrio y devuélvelas
            la próxima vez para ahorrar $2.000 por botella.
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-yak-mango text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg"
          >
            Hacer mi pedido
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