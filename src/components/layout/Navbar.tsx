'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/lib/cart-context'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/filosofia', label: 'Filosofía' },
  { href: '/productos', label: 'Productos' },
  { href: '/como-funciona', label: 'Cómo funciona' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { totalUnits, isEmpty, openCart } = useCart()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-yak-cream/90 backdrop-blur-md border-b border-yak-griego/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="font-display font-extrabold text-2xl text-yak-navy tracking-tight">
          yak
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname === href
                  ? 'text-yak-navy'
                  : 'text-yak-muted hover:text-yak-ink'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Cart icon */}
        <button
          className="relative p-2 text-yak-navy hover:bg-yak-griego/50 rounded-lg transition-colors"
          aria-label="Abrir carrito"
          onClick={openCart}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {!isEmpty && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yak-mango text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalUnits}
            </span>
          )}
        </button>
      </div>
    </nav>
  )
}
