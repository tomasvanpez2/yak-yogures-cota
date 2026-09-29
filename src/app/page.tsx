'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS } from '@/lib/config'
import { useReveal, useParallax, useStaggerReveal, useClipReveal, useTextLineReveal } from '@/lib/use-gsap'
import { Drop, AppleLogo, Recycle, ArrowRight } from '@phosphor-icons/react'

const PILLARS = [
  {
    icon: <Drop width={24} height={24} weight="regular" color="currentColor" aria-hidden="true" />,
    title: 'Etiqueta limpia',
    text: 'Cero aditivos químicos ni artificiales.',
  },
  {
    icon: <AppleLogo width={24} height={24} weight="regular" color="currentColor" aria-hidden="true" />,
    title: 'Textura pura',
    text: 'Sin almidones ni espesantes.',
  },
  {
    icon: <Recycle width={24} height={24} weight="regular" color="currentColor" aria-hidden="true" />,
    title: 'Envase retornable',
    text: 'El vidrio conserva el sabor y no absorbe olores.',
  },
  {
    icon: <Drop width={24} height={24} weight="regular" color="currentColor" aria-hidden="true" />,
    title: 'Insumos de origen',
    text: 'Leche de alta calidad y frutas maduras.',
  },
]

const STEPS = [
  { num: '01', title: 'Elige', text: 'Escoge tus sabores y cantidades' },
  { num: '02', title: 'Recibe', text: 'Entregamos el día de ruta de tu zona' },
  { num: '03', title: 'Paga', text: 'Transferencia y confirmamos por WhatsApp' },
]

export default function Home() {
  const heroParallax = useParallax(0.12)
  const heroReveal = useReveal({ y: 30, duration: 0.8 })
  const storyGridReveal = useReveal({ y: 20, duration: 0.8 })
  const storyTitleReveal = useTextLineReveal({ stagger: 0.06, duration: 0.7, delay: 0.1 })
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
            src="/assets/fresa.jpeg"
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
              Yogur artesanal <span className="text-yak-mango">para cuidar a los tuyos. Como cuido a los mios.</span>
            </h1>

            {/* Subtext - max 20 words */}
            <p className="body-copy-lg text-white/75 mb-10 max-w-[65ch] text-pretty">
              Hecho en casa, en pequeños lotes, con fruta madura y sin aditivos.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
              <Link
                href="/productos"
                role="link"
                aria-label="Ir a la página de productos para conocer los sabores de yogur"
                className="btn-primary w-full sm:w-auto justify-center"
              >
                Conocer más
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator - respecting reduced motion */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none animate-[bounce_2s_ease-in-out_infinite] motion-reduce:animate-none" aria-hidden="true">
          <ArrowRight width={24} height={24} weight="regular" color="white" className="text-white/50 rotate-90" aria-hidden="true" />
        </div>
      </section>

      {/* ─── NUESTRA HISTORIA — asymmetric split with craft detail ─── */}
      <section className="section bg-yak-cream relative overflow-hidden" aria-labelledby="historia-heading">
        {/* Subtle background texture via CSS variable pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%239C928A fill-opacity=0.03%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)')] opacity-50" aria-hidden="true" />

        {/* Accent line - top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-px bg-gradient-to-r from-transparent via-yak-mango/40 to-transparent" aria-hidden="true" />

        <div className="container relative">
          <div ref={storyGridReveal} className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

            {/* Text column - left on desktop */}
            <div className="lg:order-2 max-w-xl mx-auto lg:mx-0 pt-4 lg:pt-8">
              {/* Eyebrow / category label */}
              <p className="text-caption font-display font-semibold text-yak-mango tracking-wider uppercase mb-5">
                Nuestra historia
              </p>

              <h2 ref={storyTitleReveal} id="historia-heading" className="text-heading-lg md:text-heading-xl lg:text-display-sm mb-7 text-balance leading-[1.25] text-yak-navy" style={{ whiteSpace: 'pre-line' }}>
                Soy ingeniera de alimentos y sé lo que hacen los ultraprocesados.
                Por eso volví a lo artesanal: procesos lentos, fermentación natural y proteína real.
                Así nació <span className="font-extrabold text-yak-mango">YAK</span>, en mi casa, para cuidar a los tuyos como cuido a los míos.
              </h2>

              {/* Decorative separator */}
              <div className="flex items-center gap-3 my-8">
                <div className="flex-1 h-px bg-gradient-to-r from-yak-line via-yak-mango/30 to-yak-line" aria-hidden="true" />
                <div className="w-2 h-2 rounded-full bg-yak-mango flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 h-px bg-gradient-to-r from-yak-mango/30 via-yak-line to-transparent" aria-hidden="true" />
              </div>

              {/* Signature / location callout */}
              <div className="flex items-center gap-4 p-5 bg-white/70 border border-yak-line/60 rounded-2xl shadow-soft backdrop-blur-sm">
                <div className="w-12 h-12 rounded-xl bg-yak-mango/10 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C88B2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <p className="text-caption font-display font-bold text-yak-navy tracking-wide">Cota, Cundinamarca</p>
                  <p className="text-body-sm text-yak-muted/80 mt-0.5">Donde cada lote se hace a mano, uno por uno.</p>
                </div>
              </div>

              {/* CTA - kept as requested */}
              <Link
                href="/filosofia"
                role="link"
                aria-label="Ir a la página de filosofía para conocer más sobre YAK"
                className="btn-ghost mt-8 inline-flex"
              >
                Conocer nuestra historia
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>

            {/* Image column - right on desktop, full width on mobile */}
            <div className="lg:order-1 relative">
              {/* Clip reveal wrapper - only for the image frame */}
              <div ref={useClipReveal({ direction: 'bottom', duration: 1 })} className="relative">
                {/* Outer decorative frame */}
                <div className="relative aspect-[4/5] max-w-lg mx-auto lg:mx-0">
                  {/* Subtle glow/halo behind image */}
                  <div className="absolute -inset-4 bg-gradient-to-br from-yak-mango/20 via-transparent to-yak-feijoa/20 rounded-[2.5rem] blur-2xl opacity-60" aria-hidden="true" />

                  {/* Main image container with elegant shape */}
                  <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-elevated border border-yak-line/40 bg-white">
                    <Image
                      src="/assets/produccion.jpeg"
                      alt="Producción artesanal de yogur YAK en cocina de Cota, Cundinamarca"
                      fill
                      className="img-cover transition-transform duration-[1000ms] ease-out-expo hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />

                    {/* Subtle inner vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-yak-navy/30 via-transparent to-transparent pointer-events-none" aria-hidden="true" />

                    {/* Bottom gradient with location info - integrated into image */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yak-navy/95 via-yak-navy/60 to-transparent p-6 pt-20 pointer-events-none">
                      <p className="text-white/95 text-caption font-display font-bold tracking-wider">
                        Cota, Cundinamarca
                      </p>
                      <p className="text-white/70 text-caption mt-1">
                        Donde cada lote se hace a mano, uno por uno.
                      </p>
                    </div>
                  </div>

                  {/* Corner accent mark - top left */}
                  <div className="absolute -top-3 -left-3 w-16 h-16 border-t-2 border-l-2 border-yak-mango/50 rounded-tl-[2rem] pointer-events-none" aria-hidden="true" />
                  {/* Corner accent mark - bottom right */}
                  <div className="absolute -bottom-3 -right-3 w-16 h-16 border-b-2 border-r-2 border-yak-mango/50 rounded-br-[2rem] pointer-events-none" aria-hidden="true" />
                </div>
              </div>

              {/* Small "handmade" badge - OUTSIDE clip-reveal so it's never clipped */}
              <div className="absolute -bottom-5 -left-5 lg:-left-8 bg-white/95 backdrop-blur-sm border border-yak-line/50 rounded-full px-4 py-2 shadow-card flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <span className="w-2 h-2 rounded-full bg-yak-mango" aria-hidden="true"></span>
                <span className="text-caption font-medium text-yak-navy whitespace-nowrap">Hecho a mano</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accent line - bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120px] h-px bg-gradient-to-r from-transparent via-yak-mango/40 to-transparent" aria-hidden="true" />
      </section>

      {/* ─── LO QUE NO NEGOCIAMOS — card grid with real icons ─── */}
      <section className="section bg-yak-griego/30">
        <div className="container">
          <div ref={pillarsReveal} className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="heading-section text-display-md mb-3">
              Lo que no negociamos
            </h2>
            <p className="body-copy">
              Cuatro principios que guían cada lote.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
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

      {/* ─── CÓMO PEDIR — minimal steps ─── */}
      <section className="section bg-yak-griego/30">
        <div className="container-narrow">
          <div ref={stepsReveal} className="text-center mb-14">
            <h2 className="heading-section text-display-md mb-3">
              Pídelo en tres pasos
            </h2>
            <p className="body-copy max-w-lg mx-auto">
              Elige tus sabores. Recibe en tu día de ruta. Paga por transferencia.
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
            Prueba la diferencia esta semana
          </h2>
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