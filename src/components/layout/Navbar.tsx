'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/lib/cart-context'
import { usePressScale } from '@/lib/use-gsap'
import {
  ShoppingCartSimple,
  List,
  X,
} from '@phosphor-icons/react'

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/filosofia', label: 'Filosofía' },
  { href: '/productos', label: 'Productos' },
  { href: '/como-funciona', label: 'Cómo funciona' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { totalUnits, isEmpty, openCart } = useCart()
  const navRef = usePressScale<HTMLDivElement>(0.98)
  const cartButtonRef = usePressScale<HTMLButtonElement>(0.95)
  const reduceMotion = useReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Focus trap for mobile menu
  useEffect(() => {
    if (!mobileMenuOpen) return

    previousActiveElement.current = document.activeElement as HTMLElement

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    const updateFocusables = () => {
      if (!menuRef.current) return []
      const nodes = menuRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      return Array.from(nodes).filter((el) => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden' && el.getAttribute('aria-hidden') !== 'true'
      })
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMobileMenuOpen(false)
        return
      }
      if (e.key === 'Tab' && menuRef.current) {
        const focusables = updateFocusables()
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus({ preventScroll: true })
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus({ preventScroll: true })
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Focus first link
    requestAnimationFrame(() => {
      const focusables = updateFocusables()
      focusables[0]?.focus({ preventScroll: true })
    })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousActiveElement.current?.focus({ preventScroll: true })
    }
  }, [mobileMenuOpen])

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <nav
        ref={navRef}
        className="material-nav"
        role="navigation"
        aria-label="Navegación principal"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <Link
            href="/"
            className="font-display font-extrabold text-2xl md:text-3xl text-yak-navy tracking-tight hover:opacity-80 transition-opacity duration-fast active:scale-[0.97]"
            aria-label="YAK Yogurt - Inicio"
          >
            yak
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 md:gap-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`relative text-body-sm font-medium transition-all duration-fast ease-out-expo active:scale-[0.97] ${
                  pathname === href
                    ? 'text-yak-navy'
                    : 'text-yak-muted hover:text-yak-ink'
                }`}
                aria-current={pathname === href ? 'page' : undefined}
                aria-label={`Ir a ${label}`}
                onClick={closeMobileMenu}
              >
                {label}
                {pathname === href && (
                  <span className="absolute bottom-[-6px] left-0 right-0 h-0.5 bg-yak-mango rounded-full" aria-hidden="true" />
                )}
              </Link>
            ))}
          </div>

          {/* Cart icon */}
          <button
            ref={cartButtonRef}
            className="relative p-3 text-yak-navy hover:bg-yak-griego/50 rounded-xl transition-colors duration-fast min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={isEmpty ? 'Abrir carrito (vacío)' : `Abrir carrito (${totalUnits} productos)`}
            onClick={openCart}
          >
            <ShoppingCartSimple width={22} height={22} weight="regular" color="currentColor" aria-hidden="true" />
            {!isEmpty && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={totalUnits}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.12, 1], opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={
                    reduceMotion
                      ? { duration: 0.12, ease: 'linear' }
                      : { type: 'spring', bounce: 0, duration: 0.28 }
                  }
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yak-mango text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-soft"
                  aria-hidden="true"
                >
                  {totalUnits > 9 ? '9+' : totalUnits}
                </motion.span>
              </AnimatePresence>
            )}
          </button>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-3 text-yak-navy hover:bg-yak-griego/50 rounded-xl transition-colors duration-fast min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X width={22} height={22} weight="regular" color="currentColor" aria-hidden="true" />
            ) : (
              <List width={22} height={22} weight="regular" color="currentColor" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div
            ref={menuRef}
            id="mobile-menu"
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <motion.div
              className="mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            <motion.div
              className="mobile-menu-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={reduceMotion ? { duration: 0.01 } : { type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="px-6 py-4 border-b border-yak-line">
                <Link
                  href="/"
                  className="font-display font-extrabold text-2xl text-yak-navy tracking-tight"
                  onClick={closeMobileMenu}
                >
                  yak
                </Link>
              </div>
              <nav className="px-6 py-6 space-y-1" aria-label="Navegación principal móvil">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileMenu}
                    className={`block px-4 py-3.5 rounded-2xl text-body-lg font-medium transition-all duration-fast ease-out-expo active:scale-[0.98] ${
                      pathname === href
                        ? 'bg-yak-mango/10 text-yak-mango'
                        : 'text-yak-navy hover:bg-yak-griego/50'
                    }`}
                    aria-current={pathname === href ? 'page' : undefined}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="px-6 pb-6 border-t border-yak-line mt-auto">
                <button
                  onClick={() => { closeMobileMenu(); openCart(); }}
                  className="btn-primary w-full justify-center"
                >
                  <ShoppingCartSimple width={20} height={20} weight="regular" color="currentColor" aria-hidden="true" />
                  <span>Tu Canasta YAK</span>
                  {!isEmpty && (
                    <span className="ml-2 w-5 h-5 bg-white/20 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalUnits > 9 ? '9+' : totalUnits}
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}