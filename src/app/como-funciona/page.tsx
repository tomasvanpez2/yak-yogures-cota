'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ZONES, DELIVERY_ROUTES } from '@/lib/config'
import { useReveal, useStaggerReveal } from '@/lib/use-gsap'
import { ShoppingCartSimple, Truck, CreditCard, WhatsappLogo } from '@phosphor-icons/react'

const STEPS = [
  {
    num: '01',
    title: 'Elige',
    description: 'Selecciona los sabores y cantidades que quieres. Griego, fresa, mora, mango, feijoa — todos de 1 litro.',
    icon: <ShoppingCartSimple width={28} height={28} weight="regular" color="currentColor" aria-hidden="true" />,
  },
  {
    num: '02',
    title: 'Recibe',
    description: 'Entregamos en tu zona el día de ruta. Cada barrio tiene su día fijo — elige tu zona y te decimos cuándo llega.',
    icon: <Truck width={28} height={28} weight="regular" color="currentColor" aria-hidden="true" />,
  },
  {
    num: '03',
    title: 'Paga',
    description: 'Paga por transferencia bancaria con tu llave Bre-B. Reportas el pago y listo — confirmamos por WhatsApp.',
    icon: <CreditCard width={28} height={28} weight="regular" color="currentColor" aria-hidden="true" />,
  },
]

// Map zone IDs to cutoff days (2 days before delivery)
const CUTOFF_DAYS: Record<string, string> = {
  COTA: 'Jueves',
  CHIA: 'Sábado',
  CAJICA: 'Domingo',
  CALLE_80: 'Lunes',
  SUBA: 'Martes',
  SUR: 'Miércoles',
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '3006539429'

export default function ComoFuncionaPage() {
  const headerReveal = useReveal({ y: 30, duration: 0.8 })
  const stepsGrid = useStaggerReveal({ stagger: 0.1, y: 20 })
  const cutoffReveal = useReveal({ y: 30 })
  const zonesReveal = useReveal({ y: 30 })
  const zonesGrid = useStaggerReveal({ stagger: 0.08, y: 20 })

  return (
    <main className="min-h-screen bg-yak-cream">
      <Navbar />

      {/* Hero - clean and focused */}
      <section ref={headerReveal} className="pt-10 md:pt-12 lg:pt-16 pb-10 px-6 max-w-4xl mx-auto text-center">
        <h1 className="heading-display text-display-lg md:text-display-xl mb-4 text-balance">
          Cómo funciona
        </h1>
        <p className="body-copy-lg max-w-lg mx-auto">
          Tres pasos. Sin complicaciones. Tu yogur artesanal llega fresco a tu puerta.
        </p>
      </section>

      {/* Steps - card layout with hierarchy */}
      <section className="pb-16 px-6 max-w-5xl mx-auto">
        <div ref={stepsGrid} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <article
              key={step.num}
              className="surface-card relative p-7 md:p-8 transition duration-140 ease-out-expo will-change-transform [@media(hover:hover)and(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)and(pointer:fine)]:hover:shadow-card"
            >
              <div className="w-14 h-14 rounded-2xl bg-yak-navy/5 flex items-center justify-center text-yak-navy mb-5">
                {step.icon}
              </div>
              <span className="text-label text-yak-mango/70 mb-3 block">
                {step.num}
              </span>
              <h3 className="heading-section text-heading-md mb-3">
                {step.title}
              </h3>
              <p className="text-body-sm text-yak-muted leading-relaxed">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Cutoff rule - focused explanation */}
      <section className="section bg-yak-griego/30">
        <div className="container-narrow">
          <div ref={cutoffReveal} className="max-w-3xl mx-auto text-center">
            <h2 className="heading-section text-display-md mb-5">
              La regla del corte
            </h2>
            <p className="body-copy-lg max-w-lg mx-auto mb-8">
              Tu pedido necesita pasar el corte <strong className="text-yak-navy">2 días antes</strong> de tu ruta de entrega.
              Si pides a tiempo, te llega esa semana. Si no, la siguiente.
            </p>

            {/* Example card */}
            <div className="material-surface inline-flex items-center gap-4 p-5 md:p-7 rounded-2xl max-w-md mx-auto text-left">
              <div className="w-12 h-12 rounded-xl bg-yak-mango/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yak-mango" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <p className="heading-section text-heading-sm">
                  Ejemplo: Chía (Lunes)
                </p>
                <p className="text-body-sm text-yak-muted mt-1">
                  Corte: <strong className="text-yak-navy">Sábado 2:00 PM</strong> - Entrega: <strong className="text-yak-navy">Lunes</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Zones grid - clean data presentation */}
      <section className="section bg-yak-cream">
        <div className="container">
          <div ref={zonesReveal} className="text-center mb-12">
            <h2 className="heading-section text-display-md mb-3">
              Zonas de entrega
            </h2>
            <p className="body-copy max-w-lg mx-auto">
              Elige tu zona al hacer el pedido. El domicilio es gratis en Cota y para Clientes Fundadores.
            </p>
          </div>
          <div ref={zonesGrid} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {Object.values(ZONES).map((zone) => {
              const route = DELIVERY_ROUTES.find((r) => r.zoneId === zone.id)
              const isFree = zone.deliveryCost === 0
              const isCota = zone.id === 'COTA'
              return (
                <article
                  key={zone.id}
                  className={`${isCota ? 'surface-elevated ring-1 ring-yak-feijoa/30' : 'surface-card'} p-6 rounded-2xl`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="heading-section text-heading-md">
                      {zone.name}
                      {isCota && <span className="ml-2 badge-success text-[10px] px-2 py-0.5">Zona piloto</span>}
                    </h3>
                    <span className="text-label bg-yak-navy/5 text-yak-navy px-3 py-1 rounded-pill">
                      {zone.routeDay}
                    </span>
                  </div>
                  <dl className="space-y-3 text-body-sm">
                    <div className="flex justify-between">
                      <dt className="text-yak-muted">Domicilio</dt>
                      <dd className={`font-medium ${isFree ? 'text-yak-feijoa' : 'text-yak-navy'}`}>
                        {isFree ? 'Gratis ($0)' : `$${zone.deliveryCost.toLocaleString('es-CO')}`}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-yak-muted">Corte de pedidos</dt>
                      <dd className="text-yak-navy font-medium">
                        {CUTOFF_DAYS[zone.id] || ' - '} 2:00 PM
                      </dd>
                    </div>
                    {route && (
                      <div className="flex justify-between pt-2 border-t border-yak-line">
                        <dt className="text-yak-muted">Día de entrega</dt>
                        <dd className="text-yak-navy font-medium">{route.day}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA - minimal */}
      <section className="section bg-yak-cream border-t border-yak-line">
        <div className="container-narrow text-center">
          <p className="text-body-sm text-yak-muted mb-4">¿Tienes dudas?</p>
          <a
            href={`https://wa.me/57${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            role="link"
            aria-label="Abrir chat de WhatsApp con el equipo de YAK para resolver dudas"
            className="btn-primary shadow-soft"
          >
            <WhatsappLogo width={18} height={18} weight="fill" color="currentColor" aria-hidden="true" />
            Escríbenos por WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}