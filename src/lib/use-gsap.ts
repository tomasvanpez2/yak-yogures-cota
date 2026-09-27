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
 * Emil's principle: UI animations should stay under 300ms.
 * Use custom easing curves - built-in CSS easings are too weak.
 * --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1) — strong ease-out for UI interactions
 * --ease-spring: cubic-bezier(0.32, 0.72, 0, 1) — iOS-like drawer curve
 */

const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'
const EASE_SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)'
const EASE_IN_OUT_QUINT = 'cubic-bezier(0.83, 0, 0.17, 1)'

/**
 * Fade + slide up on scroll. Returns a ref to attach to the element.
 * Respects prefers-reduced-motion (shows immediately without animation).
 * Duration: 700ms max (under 300ms for UI, slightly longer for scroll reveals)
 */
export function useReveal(options?: { y?: number; delay?: number; duration?: number; ease?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const opts = options ?? {}

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
        { opacity: 0, y: opts.y ?? 30 },
        {
          opacity: 1,
          y: 0,
          duration: opts.duration ?? 0.7,
          delay: opts.delay ?? 0,
          ease: opts.ease ?? EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [opts.y, opts.delay, opts.duration, opts.ease])

  return ref
}

/**
 * Parallax effect — element moves slower than scroll (scrub).
 * Returns a ref to attach to the parallax container.
 * Speed: 0.15-0.25 for subtle depth (Emil: subtle parallax adds depth without distraction)
 */
export function useParallax(speed = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const s = speed

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: s * 100,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      })
    })

    return () => ctx.revert()
  }, [s])

  return ref
}

/**
 * Stagger children reveal — animates direct children sequentially.
 * Returns a ref to attach to the parent container.
 * Stagger: 60-80ms between items (Emil: keep stagger delays short)
 */
export function useStaggerReveal(options?: { stagger?: number; y?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const opts = options ?? {}

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
        { opacity: 0, y: opts.y ?? 20 },
        {
          opacity: 1,
          y: 0,
          duration: opts.duration ?? 0.6,
          stagger: opts.stagger ?? 0.06,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [opts.y, opts.duration, opts.stagger])

  return ref
}

/**
 * Sequential block reveal — animates each child block one at a time
 * as the user scrolls, creating a narrative storytelling effect.
 * Each block triggers independently.
 */
export function useSequentialReveal(options?: { y?: number; stagger?: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const opts = options ?? {}

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
          { opacity: 0, y: opts.y ?? 40 },
          {
            opacity: 1,
            y: 0,
            duration: opts.duration ?? 0.8,
            delay: i * (opts.stagger ?? 0.12),
            ease: EASE_OUT_EXPO,
            scrollTrigger: {
              trigger: child,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })
    })

    return () => ctx.revert()
  }, [opts.y, opts.stagger, opts.duration])

  return ref
}

/**
 * Magnetic hover effect for buttons/cards - subtle follow mouse
 * Uses spring physics for natural feel (Emil: springs feel more natural)
 */
export function useMagnetic(options?: { strength?: number; radius?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const animationRef = useRef<gsap.core.Tween | null>(null)
  const opts = options ?? {}

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const strength = opts.strength ?? 0.15
    const radius = opts.radius ?? 100

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2)

      if (distance > radius) return

      if (animationRef.current) animationRef.current.kill()

      animationRef.current = gsap.to(el, {
        x: deltaX,
        y: deltaY,
        duration: 0.4,
        ease: EASE_SPRING,
        overwrite: true,
      })
    }

    const handleMouseLeave = () => {
      if (animationRef.current) animationRef.current.kill()
      animationRef.current = gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: EASE_SPRING,
        overwrite: true,
      })
    }

    el.addEventListener('mousemove', handleMouseMove)
    el.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      el.removeEventListener('mousemove', handleMouseMove)
      el.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) animationRef.current.kill()
    }
  }, [opts.strength, opts.radius])

  return ref
}

/**
 * Scale on press/tap - instant feedback (Emil: buttons must feel responsive)
 * Duration: 100-160ms for press feedback
 */
export function usePressScale<T extends HTMLElement = HTMLDivElement>(scale = 0.97) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handlePointerDown = () => {
      gsap.to(el, { scale, duration: 0.1, ease: 'power2.out', overwrite: true })
    }

    const handlePointerUp = () => {
      gsap.to(el, { scale: 1, duration: 0.15, ease: EASE_OUT_EXPO, overwrite: true })
    }

    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointerup', handlePointerUp)
    el.addEventListener('pointerleave', handlePointerUp)
    el.addEventListener('pointercancel', handlePointerUp)

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointerup', handlePointerUp)
      el.removeEventListener('pointerleave', handlePointerUp)
      el.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [scale])

  return ref
}

/**
 * Clip-path reveal for images - reveals from bottom to top
 * More natural than simple fade (Emil: clip-path is powerful for animation)
 */
export function useClipReveal(options?: { direction?: 'bottom' | 'top' | 'left' | 'right'; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const opts = options ?? {}

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { clipPath: 'inset(0 0 0 0)' })
      return
    }

    const direction = opts.direction ?? 'bottom'
    const startClip = direction === 'bottom' ? 'inset(0 0 100% 0)'
      : direction === 'top' ? 'inset(100% 0 0 0)'
      : direction === 'left' ? 'inset(0 100% 0 0)'
      : 'inset(0 0 0 100%)'

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: startClip },
        {
          clipPath: 'inset(0 0 0 0)',
          duration: opts.duration ?? 1,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [opts.direction, opts.duration])

  return ref
}

/**
 * Text line reveal - splits text into lines and reveals each
 * For headlines that need more dramatic entrance
 */
export function useTextLineReveal(options?: { stagger?: number; duration?: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const opts = options ?? {}

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1 })
      return
    }

    // Split text into lines
    const text = el.textContent || ''
    if (!text.trim()) return

    const lines = text.split('\n').filter(l => l.trim())
    el.innerHTML = lines.map(l => `<span class="block overflow-hidden"><span class="block">${l}</span></span>`).join('')

    const innerSpans = el.querySelectorAll('span > span')

    const ctx = gsap.context(() => {
      gsap.fromTo(
        innerSpans,
        { y: '100%', opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: opts.duration ?? 0.8,
          stagger: opts.stagger ?? 0.08,
          delay: opts.delay ?? 0,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [opts.duration, opts.stagger, opts.delay])

  return ref
}

export { EASE_OUT_EXPO, EASE_SPRING, EASE_IN_OUT_QUINT }