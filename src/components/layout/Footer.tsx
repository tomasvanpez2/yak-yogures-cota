'use client'

import Link from 'next/link'
import { WhatsappLogo } from '@phosphor-icons/react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '3013109200'

export default function Footer() {
  return (
    <footer className="material-footer text-white/80" role="contentinfo">
      <div className="max-w-7xl mx-auto px-6 py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="max-w-xs">
            <span className="font-display font-extrabold text-3xl md:text-4xl text-white tracking-tight">
              YAK
            </span>
            <p className="mt-4 text-body-sm text-white/55 leading-relaxed">
              Yogur artesanal hecho a mano en Cota.<br />
              Ingredientes reales. Nada que esconder.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-caption uppercase tracking-wider text-white/45 mb-5">
              Navegación
            </h4>
            <ul className="space-y-3" role="list">
              {[
                { href: '/', label: 'Inicio' },
                { href: '/filosofia', label: 'Filosofía' },
                { href: '/productos', label: 'Productos' },
                { href: '/como-funciona', label: 'Cómo funciona' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={`Ir a ${label}`}
                    className="text-body-sm text-white/55 hover:text-white transition-all duration-fast ease-out-expo inline-block [@media(hover:hover_and_pointer:fine)]:hover:-translate-y-[1px]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-caption uppercase tracking-wider text-white/45 mb-5">
              Contacto
            </h4>
            <a
              href={`https://wa.me/57${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contactar por WhatsApp (abre en nueva pestaña)"
              className="inline-flex items-center gap-2 px-3 py-2.5 text-body-sm text-white/55 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-fast ease-out-expo min-h-[44px] [@media(hover:hover_and_pointer:fine)]:hover:-translate-y-[1px]"
            >
              <WhatsappLogo width={20} height={20} weight="fill" color="currentColor" aria-hidden="true" />
              WhatsApp
            </a>
            <p className="mt-5 text-caption text-white/35 leading-relaxed">
              Cota, Cundinamarca<br />
              Entregas en Cota, Chía, Cajicá, Calle 80, Suba y Sur
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-caption text-white/35">
            © {new Date().getFullYear()} YAK Yogurt. Todos los derechos reservados.
          </p>
          <p className="text-caption text-white/35">
            Cuidado en pequeños lotes
          </p>
        </div>
      </div>
    </footer>
  )
}