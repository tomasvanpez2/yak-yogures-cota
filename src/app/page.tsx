'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS } from '@/lib/config'
import { useReveal, useParallax, useStaggerReveal, useClipReveal } from '@/lib/use-gsap'
import { Drop, AppleLogo, Recycle, ArrowRight } from '@phosphor-icons/react'

const PILLARS = [
  {
    icon: <Drop width={24} height={24} weight="regular" color="currentColor" aria-hidden="true" />,
    title: 'Leche de la sabana',
    text: 'Leche fresca de la Sabana de Bogotá. Sin leche en polvo, sin grasas vegetales, sin cosas que no se pronuncian.',
  },
  {
    icon: <AppleLogo width={24} height={24} weight="regular" color="currentColor" aria-hidden="true" />,
    title: 'Fruta de verdad',
    text: 'Mora, mango, fresa y feijoa colombianas, cortadas a mano. Nada de saborizantes ni colorantes.',
  },
  {
    icon: <Recycle width={24} height={24} weight="regular" color="currentColor" aria-hidden="true" />,
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
  const heroParallax = useParallax(0.12)
  const heroReveal = useReveal({ y: 30, duration: 0.8 })
  const storyReveal = useReveal({ y: 30, duration: 0.7 })
  const pillarsReveal = useReveal({ y: 20 })
  const flavorsReveal = useReveal({ y: 20 })
  const flavorsGrid = useStaggerReveal({ stagger: 0.05, y: 16 })
  const stepsReveal = useReveal({ y: 20 })
  const ctaReveal = useReveal({ y: 20 })
  const ctaClip = useClipReveal({ direction: 'bottom', duration: 1 })

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ─── HERO — cinematic, product-forward ─── */}
      <section className="relative min-h-[calc(100dvh-4rem)] flex items-center overflow-hidden">
        {/* Background image with parallax */}
        <div ref={heroParallax} className="absolute inset-0 w-full h-[115%] -top-[7%] shadow-subtle">
          <Image
            src="/assets/hero-strawberry.jpg"
            alt="Yogur artesanal YAK con fresas frescas sobre mesa de madera"
            fill
            className="img-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-yak-navy/90 via-yak-navy/60 to-yak-navy/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-yak-navy/40 via-transparent to-transparent" />
        </div>

        <div ref={heroReveal} className="relative z-10 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full pt-10">
          <div className="max-w-xl md:max-w-2xl lg:max-w-xl">
            {/* Headline - 2 lines max, distinctive */}
            <h1 className="heading-display text-display-xl text-white mb-6 text-balance">
              Natural. Artesanal.<br />
              <span className="text-yak-mango">De tu familia, para la tuya.</span>
            </h1>

            {/* Subtext - max 20 words */}
            <p className="body-copy-lg text-white/75 mb-10 max-w-[65ch] text-pretty">
              Yogur artesanal hecho a mano en Cota, con leche fresca y fruta real.
              El que le darías a tu familia, porque es el que le damos a la nuestra.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
              <Link
                href="/productos"
                role="link"
                aria-label="Ir a la página de productos para conocer los sabores de yogur"
                className="btn-primary w-full sm:w-auto justify-center"
              >
                Conocer sabores
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link
                href="/filosofia"
                role="link"
                aria-label="Leer la historia y filosofía de YAK yogur artesanal"
                className="btn-secondary w-full sm:w-auto justify-center border-white/30 text-white hover:bg-white/10 hover:border-white"
              >
                Nuestra historia
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator - respecting reduced motion */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-[bounce_2s_ease-in-out_infinite] motion-reduce:animate-none" aria-hidden="true">
          <ArrowRight width={24} height={24} weight="regular" color="white" className="text-white/50 rotate-90" aria-hidden="true" />
        </div>
      </section>

      {/* ─── NUESTRA HISTORIA — asymmetric split ─── */}
      <section className="section bg-yak-cream">
        <div className="container">
          <div ref={storyReveal} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text column - left on desktop */}
            <div className="lg:order-2 max-w-xl mx-auto lg:mx-0">
              <h2 className="heading-section text-display-md md:text-display-lg mb-6 text-balance">
                Buscábamos un yogur de verdad.<br />
                <span className="text-yak-muted font-normal">No lo encontramos.</span><br />
                Entonces lo hicimos.
              </h2>
              <div className="space-y-5 body-copy max-w-lg">
                <p>
                  YAK nació en una cocina de Cota, como una búsqueda familiar: encontrar un yogur
                  sin las cosas que le sobran a los yogures industriales, azúcar de más,
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
                role="link"
                aria-label="Ir a la página de filosofía para conocer más sobre YAK"
                className="btn-ghost mt-6"
              >
                Leer nuestra filosofía
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            {/* Image column - right on desktop, full width on mobile */}
            <div ref={useClipReveal({ direction: 'bottom', duration: 1 })} className="lg:order-1 relative aspect-[4/5] rounded-3xl overflow-hidden shadow-elevated">
              <Image
                src="/assets/produccion.jpeg"
                alt="Producción artesanal de yogur YAK en cocina de Cota, Cundinamarca"
                fill
                className="img-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yak-navy/90 to-transparent p-6 pt-20">
                <p className="text-white/90 text-caption font-display font-bold tracking-wide">
                  Cota, Cundinamarca
                </p>
                <p className="text-white/60 text-caption mt-1">
                  Donde cada lote se hace a mano, uno por uno.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PILARES DE PUREZA — card grid with real icons ─── */}
      <section className="section bg-yak-griego/30">
        <div className="container">
          <div ref={pillarsReveal} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="heading-section text-display-md mb-3">
              Lo que sí hay dentro
            </h2>
            <p className="body-copy">
              Tres cosas que no negociamos. Lo que ves en la etiqueta es lo que hay en la botella.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PILLARS.map((pillar) => (
              <article
                key={pillar.title}
                className="surface-card group p-7 md:p-8"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yak-mango/10 text-yak-mango mb-5 group-hover:scale-105 transition-transform duration-base">
                  {pillar.icon}
                </div>
                <h3 className="heading-section text-heading-lg mb-3">
                  {pillar.title}
                </h3>
                <p className="text-body-sm text-yak-muted leading-relaxed">
                  {pillar.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SABORES — product-forward showcase ─── */}
      <section className="section bg-yak-cream">
        <div className="container">
          <div ref={flavorsReveal} className="max-w-2xl mx-auto mb-12">
            <h2 className="heading-section text-display-md mb-3 text-center">
              Nuestros sabores
            </h2>
            <p className="body-copy text-center">5 sabores, todos de 1 litro, en botella de vidrio retornable</p>
          </div>

          <div ref={flavorsGrid} className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {Object.values(PRODUCTS).map((product) => (
              <Link
                key={product.id}
                href="/productos"
                role="link"
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-yak-line shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yak-mango focus-visible:ring-offset-2 active:scale-[0.98] transition duration-140 ease-out-expo will-change-transform [@media(hover:hover)and(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)and(pointer:fine)]:hover:shadow-card"
                aria-label={`Ver sabor ${product.name}, precio $${product.price.toLocaleString('es-CO')}`}
              >
                <Image
                  src={product.image}
                  alt={`Botella de ${product.name} de YAK yogur artesanal`}
                  fill
                  className="img-cover group-hover:scale-[1.03] transition-transform duration-[700ms] ease-out-expo"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="font-display font-bold text-white text-heading-md mb-1">
                    {product.name.replace('Yogur de ', '').replace('Yogur ', '')}
                  </p>
                  <p className="text-white/80 text-body-sm font-medium">
                    ${product.price.toLocaleString('es-CO')}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: product.color }} />
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/productos"
              role="link"
              aria-label="Ver todos los sabores de yogur artesanal YAK"
              className="btn-secondary"
            >
              Ver todos los sabores
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA — minimal steps ─── */}
      <section className="section bg-yak-griego/30">
        <div className="container-narrow">
          <div ref={stepsReveal} className="text-center mb-14">
            <h2 className="heading-section text-display-md mb-3">
              Así de simple
            </h2>
            <p className="body-copy max-w-lg mx-auto">
              Tres pasos. Sin complicaciones. Tu yogur artesanal llega fresco a tu puerta.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <article
                key={step.num}
                className="surface-card relative p-7 md:p-8 text-center"
              >
                <span className="inline-block text-caption font-bold text-yak-mango/70 tracking-wider mb-4">
                  {step.num}
                </span>
                <h3 className="heading-section text-heading-md mb-2">
                  {step.title}
                </h3>
                <p className="text-body-sm text-yak-muted">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/como-funciona"
              role="link"
              aria-label="Ver zonas de entrega, días de ruta y corte de pedidos"
              className="btn-ghost"
            >
              Ver zonas, días de entrega y corte de pedidos
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL — full bleed with clip reveal ─── */}
      <section ref={ctaReveal} className="relative py-24 md:py-32 lg:py-40 px-6 bg-yak-navy text-white overflow-hidden">
        <div ref={ctaClip} className="absolute inset-0 bg-gradient-to-br from-yak-mango/15 via-transparent to-yak-feijoa/10" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="heading-display text-display-md md:text-display-lg mb-5 text-balance text-white">
            Pruébalo esta semana
          </h2>
          <p className="body-copy-lg text-white/60 mb-10 max-w-lg mx-auto">
            Elige tus sabores, recíbelos en tu puerta en botellas de vidrio y devuélvelas
            la próxima vez para ahorrar $2.000 por botella.
          </p>
          <Link
            href="/productos"
            role="link"
            aria-label="Hacer pedido de yogur artesanal YAK"
            className="btn-primary inline-flex items-center gap-2 px-9 py-4 shadow-elevated"
          >
            Hacer mi pedido
            <ArrowRight width={18} height={18} weight="regular" color="currentColor" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}