'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fade + slide up on scroll. Returns a ref to attach to the element.
 * Respects prefers-reduced-motion (shows immediately without animation).
 */
export function useReveal(options?: { y?: number; delay?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: options?.y ?? 50 },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 0.9,
          delay: options?.delay ?? 0,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return ref
}

/**
 * Parallax effect — element moves slower than scroll (scrub).
 * Returns a ref to attach to the parallax container.
 */
export function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: speed * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
      })
    })

    return () => ctx.revert()
  }, [])

  return ref
}

/**
 * Stagger children reveal — animates direct children sequentially.
 * Returns a ref to attach to the parent container.
 */
export function useStaggerReveal(options?: { stagger?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      Array.from(el.children).forEach((child) => {
        gsap.set(child, { opacity: 1, y: 0 })
      })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.children,
        { opacity: 0, y: options?.y ?? 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: options?.stagger ?? 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return ref
}

/**
 * Sequential block reveal — animates each child block one at a time
 * as the user scrolls, creating a narrative storytelling effect.
 * Each block triggers independently.
 */
export function useSequentialReveal(options?: { y?: number; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      Array.from(el.children).forEach((child) => {
        gsap.set(child, { opacity: 1, y: 0 })
      })
      return
    }

    const ctx = gsap.context(() => {
      Array.from(el.children).forEach((child, i) => {
        gsap.fromTo(
          child,
          { opacity: 0, y: options?.y ?? 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: i * (options?.stagger ?? 0.1),
            ease: 'power3.out',
            scrollTrigger: {
              trigger: child,
              start: 'top 85%',
              once: true,
            },
          }
        )
      })
    })

    return () => ctx.revert()
  }, [])

  return ref
}
