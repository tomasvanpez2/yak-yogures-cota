'use client'

import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { PRODUCTS } from '@/lib/config'
import { useReveal, useSequentialReveal, useStaggerReveal, useParallax } from '@/lib/use-gsap'
import { ArrowRight, Recycle, Gift } from '@phosphor-icons/react'

export default function FilosofiaPage() {
  const heroReveal = useReveal({ y: 40, duration: 1 })
  const heroParallax = useParallax(0.1)
  const processReveal = useSequentialReveal({ y: 40, stagger: 0.12 })
  const ingredientReveal = useReveal({ y: 30 })
  const flavorGrid = useStaggerReveal({ stagger: 0.06, y: 20 })
  const sustainReveal = useReveal({ y: 30 })
  const ctaReveal = useReveal({ y: 30 })

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* ─── HERO — production photo with depth ─── */}
      <section className="section bg-yak-cream">
        <div className="container">
          <div ref={heroParallax} className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-card mb-12 md:mb-16">
            <Image
              src="/assets/produccion.jpeg"
              alt="Producción artesanal de yogur YAK en cocina de Cota, vista general del proceso"
              fill
              className="img-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-yak-navy/75 via-yak-navy/45 to-yak-navy/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-yak-navy/30 via-transparent to-transparent" />
            <div ref={heroReveal} className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6 text-white">
              <h1 className="heading-display text-display-lg md:text-display-xl mb-5 text-balance">
                <span className="text-white">Cuidado en pequeños lotes.</span><br />
                <span className="text-yak-mango">Frescura y control en cada frasco.</span>
              </h1>
              <p className="body-copy-lg text-white/75 max-w-lg mx-auto">
                Lotes pequeños, producción cuidadosa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STORY BLOCKS — sequential narrative ─── */}
      <section className="section bg-yak-cream pt-0">
        <div className="container-narrow">
          <div ref={processReveal} className="space-y-24 md:space-y-32">
            {/* Block 1 — Lotes pequeños */}
            <article className="text-center max-w-3xl mx-auto">
              <h2 className="heading-section text-display-md md:text-display-lg mb-5 text-balance">
                Lotes pequeños,<br />
                producción cuidadosa.
              </h2>
              <p className="body-copy-lg max-w-xl mx-auto">
                No producimos en masa. Cada lote se hace con atención,
                controlamos la temperatura, el tiempo de fermentación y la proporción
                de fruta. Así cada botella sabe como debe saber.
              </p>
            </article>

            <hr className="divider w-32 mx-auto" />

            {/* Block 2 — Lo que entra al frasco */}
            <article className="text-center max-w-3xl mx-auto">
              <h2 className="heading-section text-display-md md:text-display-lg mb-5 text-balance">
                Lo que entra al frasco.
              </h2>
              <p className="body-copy-lg max-w-xl mx-auto">
                Leche de alta calidad, fruta madura en su punto y fermentación natural. Sin aditivos químicos, sin almidones, sin espesantes. Nada más.
              </p>
            </article>

            <hr className="divider w-32 mx-auto" />

            {/* Block 3 — Sin atajos - quote style */}
            <article className="text-center max-w-2xl mx-auto">
              <blockquote>
                <p className="body-copy-lg md:text-display-sm text-yak-muted leading-relaxed italic">
                  &ldquo;La confianza no se delega.&rdquo; YAK es una promesa diaria de calidad artesanal, transparencia y respeto por la vida.
                </p>
              </blockquote>
            </article>
          </div>
        </div>
      </section>

      {/* ─── INGREDIENTES REALES — visual grid ─── */}
      <section className="section bg-yak-griego/30">
        <div className="container">
          <div ref={ingredientReveal} className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="heading-section text-display-md mb-3">
              Fruta de verdad.
            </h2>
            <p className="body-copy">
              Usamos fruta natural, madurada en su punto, que conserva sus trozos, sus nutrientes y su dulzor real.
            </p>
          </div>
          <div ref={flavorGrid} className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {Object.values(PRODUCTS).map((product) => (
              <figure
                key={product.id}
                className="surface-card group relative aspect-[4/5] rounded-2xl overflow-hidden"
              >
                <Image
                  src={product.image}
                  alt={`Botella de ${product.name}, yogur artesanal YAK`}
                  fill
                  className="img-cover group-hover:scale-[1.02] transition-transform duration-[700ms] ease-out-expo"
                  sizes="(max-width: 640px) 50vw, 20vw"
                />
                <figcaption className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white text-caption font-medium">
                  {product.name.replace('Yogur de ', '').replace('Yogur ', '')}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOSTENIBILIDAD — focused message ─── */}
      <section className="section bg-yak-cream">
        <div className="container-narrow">
          <div ref={sustainReveal} className="max-w-3xl mx-auto text-center">
            <h2 className="heading-section text-display-md md:text-display-lg mb-6 text-balance">
              Vidrio que vuelve.
            </h2>
            <p className="body-copy-lg max-w-xl mx-auto mb-8">
              Conserva el sabor sin absorber olores y se usa una y otra vez. Devuélvelo y te descontamos $2.000 por botella.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <span className="badge-success">
                <Recycle width={14} height={14} weight="regular" color="currentColor" aria-hidden="true" />
                Retorno $2.000 por botella
              </span>
              <span className="badge-primary">
                <Gift width={14} height={14} weight="regular" color="currentColor" aria-hidden="true" />
                Fidelidad 10+1
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="section bg-yak-navy text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yak-mango/10 via-transparent to-yak-feijoa/10" />
        <div ref={ctaReveal} className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="heading-display text-display-md md:text-display-lg mb-4 text-balance text-white">
            Nutrición que protege el hogar
          </h2>
          <p className="body-copy-lg text-white/60 mb-8 max-w-lg mx-auto">
            Alimentamos a las familias con la misma exigencia y el mismo amor con que cuidamos a nuestros hijos.
          </p>
          <Link
            href="/productos"
            role="link"
            aria-label="Ver todos los productos y sabores de yogur artesanal YAK"
            className="btn-primary inline-flex items-center gap-2 px-9 py-4 shadow-elevated"
          >
            Ver productos
            <ArrowRight width={18} height={18} weight="regular" color="currentColor" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}