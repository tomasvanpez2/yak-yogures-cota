'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { ZONES, DELIVERY_ROUTES } from '@/lib/config'
import { useReveal, useStaggerReveal } from '@/lib/use-gsap'

const STEPS = [
  {
    num: '01',
    title: 'Elige',
    description: 'Selecciona los sabores y cantidades que quieres. Griego, fresa, mora, mango, feijoa — todos de 1 litro.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Recibe',
    description: 'Entregamos en tu zona el día de ruta. Cada barrio tiene su día fijo — elige tu zona y te decimos cuándo llega.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 3v5a1 1 0 01-1 1h-1" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Paga',
    description: 'Paga por transferencia bancaria con tu llave Bre-B. Reportas el pago y listo — confirmamos por WhatsApp.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
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
  const headerReveal = useReveal({ y: 30 })
  const stepsGrid = useStaggerReveal({ stagger: 0.15, y: 20 })
  const cutoffReveal = useReveal({ y: 40 })
  const zonesReveal = useReveal({ y: 30 })
  const zonesGrid = useStaggerReveal({ stagger: 0.08, y: 20 })

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section ref={headerReveal} className="pt-24 pb-12 md:pt-28 md:pb-16 px-6 max-w-4xl mx-auto text-center">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-yak-muted mb-3">
          <span className="w-6 h-px bg-yak-mango" />
          Simple y directo
          <span className="w-6 h-px bg-yak-mango" />
        </span>
        <h1 className="font-display font-extrabold text-display-lg text-yak-navy mb-4">
          Cómo funciona
        </h1>
        <p className="text-yak-muted max-w-lg mx-auto text-lg">
          Tres pasos. Sin complicaciones. Tu yogur artesanal llega fresco a tu puerta.
        </p>
      </section>

      {/* Steps */}
      <section className="pb-16 px-6 max-w-5xl mx-auto">
        <div ref={stepsGrid} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="relative p-6 rounded-2xl bg-white border border-yak-griego/50 hover:border-yak-griego transition-colors"
            >
              <span className="text-xs font-bold text-yak-mango/60 tracking-wider">
                {step.num}
              </span>
              <div className="w-12 h-12 rounded-xl bg-yak-navy/5 flex items-center justify-center text-yak-navy mt-3 mb-4">
                {step.icon}
              </div>
              <h3 className="font-display font-bold text-lg text-yak-ink mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-yak-muted leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Cutoff rule */}
      <section className="py-12 px-6 bg-yak-griego/40">
        <div ref={cutoffReveal} className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-display-md text-yak-navy mb-4">
            La regla del corte
          </h2>
          <p className="text-yak-muted max-w-lg mx-auto mb-6">
            Tu pedido necesita pasar el corte <strong>2 días antes</strong> de tu ruta de entrega.
            Si pides a tiempo, te llega esa semana. Si no, la siguiente.
          </p>
          <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-white border border-yak-griego">
            <div className="text-left">
              <p className="text-sm font-medium text-yak-ink">
                Ejemplo para Chía (Lunes)
              </p>
              <p className="text-xs text-yak-muted">
                Corte: Sábado 2:00 PM → Entrega: Lunes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Zones grid */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <div ref={zonesReveal}>
          <h2 className="font-display font-bold text-display-md text-yak-navy text-center mb-10">
            Zonas de entrega
          </h2>
        </div>
        <div ref={zonesGrid} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.values(ZONES).map((zone) => {
            const route = DELIVERY_ROUTES.find((r) => r.zoneId === zone.id)
            return (
              <div
                key={zone.id}
                className="p-5 rounded-2xl bg-white border border-yak-griego/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-display font-bold text-lg text-yak-ink">
                    {zone.name}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yak-navy/5 text-yak-navy">
                    {zone.routeDay}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yak-muted">Domicilio</span>
                    <span className={`font-medium ${zone.deliveryCost === 0 ? 'text-yak-feijoa' : 'text-yak-ink'}`}>
                      {zone.deliveryCost === 0 ? 'Gratis' : `$${zone.deliveryCost.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yak-muted">Corte</span>
                    <span className="text-yak-ink">
                      {CUTOFF_DAYS[zone.id] || '—'} 2:00 PM
                    </span>
                  </div>
                  {route && (
                    <div className="flex justify-between">
                      <span className="text-yak-muted">Entrega</span>
                      <span className="text-yak-ink">{route.day}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-12 px-6 text-center">
        <p className="text-yak-muted mb-4">¿Tienes dudas?</p>
        <a
          href={`https://wa.me/57${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Escríbenos por WhatsApp
        </a>
      </section>

      <Footer />
    </main>
  )
}
