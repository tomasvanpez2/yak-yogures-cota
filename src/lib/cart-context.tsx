'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { PRODUCTS, getDeliveryCost, type SugarOption } from './config'

export interface CartItem {
  productId: string
  quantity: number
  /** 'CON' | 'SIN' para sabores de fruta; undefined para el Griego. */
  sugar?: SugarOption
}

/** Clave estable de una línea: diferencia "Mora con azúcar" de "Mora sin azúcar". */
export function lineKey(productId: string, sugar?: SugarOption): string {
  return sugar ? `${productId}:${sugar}` : productId
}

interface CartContextValue {
  items: CartItem[]
  addToCart: (productId: string, quantity?: number, sugar?: SugarOption) => void
  updateQuantity: (productId: string, quantity: number, sugar?: SugarOption) => void
  removeFromCart: (productId: string, sugar?: SugarOption) => void
  clearCart: () => void
  totalUnits: number
  subtotal: number
  deliveryCostFor: (zoneId: string) => number
  isEmpty: boolean
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_STORAGE_KEY = 'yak-cart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const hydrated = useRef(false)

  const openCart = useCallback(() => setIsCartOpen(true), [])
  const closeCart = useCallback(() => setIsCartOpen(false), [])

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    if (!hydrated.current) {
      const saved = loadCart()
      if (saved.length > 0) setItems(saved)
      hydrated.current = true
    }
  }, [])

  // Persist to localStorage on change
  useEffect(() => {
    if (hydrated.current) {
      saveCart(items)
    }
  }, [items])

  const addToCart = useCallback((productId: string, quantity = 1, sugar?: SugarOption) => {
    setItems((prev) => {
      const existing = prev.find((i) => lineKey(i.productId, i.sugar) === lineKey(productId, sugar))
      if (existing) {
        return prev.map((i) =>
          lineKey(i.productId, i.sugar) === lineKey(productId, sugar)
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { productId, quantity, ...(sugar ? { sugar } : {}) }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string, sugar?: SugarOption) => {
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.sugar) !== lineKey(productId, sugar)))
  }, [])

  const updateQuantity = useCallback(
    (productId: string, quantity: number, sugar?: SugarOption) => {
      setItems((prev) =>
        quantity <= 0
          ? prev.filter((i) => lineKey(i.productId, i.sugar) !== lineKey(productId, sugar))
          : prev.map((i) =>
              lineKey(i.productId, i.sugar) === lineKey(productId, sugar)
                ? { ...i, quantity }
                : i
            )
      )
    },
    []
  )

  const clearCart = useCallback(() => setItems([]), [])

  const totalUnits = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (PRODUCTS[i.productId]?.price ?? 0) * i.quantity,
        0
      ),
    [items]
  )

  const deliveryCostFor = useCallback(
    (zoneId: string) => getDeliveryCost(zoneId, totalUnits),
    [totalUnits]
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalUnits,
      subtotal,
      deliveryCostFor,
      isEmpty: items.length === 0,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalUnits,
      subtotal,
      deliveryCostFor,
      isCartOpen,
      openCart,
      closeCart,
    ]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de <CartProvider>')
  }
  return ctx
}