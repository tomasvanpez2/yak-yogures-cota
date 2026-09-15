/**
 * Persistencia en Vercel KV (Redis) con la MISMA API que json-store.
 *
 * Los pedidos se guardan como una sola clave JSON (`yak:orders`).
 * Se usa un lock de proceso (async mutex) para evitar condiciones de carrera
 * entre requests, igual que en json-store.
 *
 * requiere las variables de entorno KV_REST_API_URL y KV_REST_API_TOKEN
 * (Vercel KV las inyecta automáticamente al conectar el servicio).
 */

import { kv } from '@vercel/kv'
import type { Order } from './order'

const ORDERS_KEY = 'yak:orders'

// ---------------------------------------------------------------------------
// Lock de proceso (async mutex)
// ---------------------------------------------------------------------------
let lockPromise: Promise<void> = Promise.resolve()

function acquireLock(): { release: () => void } {
  let releaseFn: () => void
  const waitPromise = new Promise<void>((resolve) => {
    releaseFn = resolve
  })
  lockPromise = lockPromise.then(() => waitPromise)
  return {
    release: () => releaseFn!(),
  }
}

async function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  await lockPromise
  const lock = acquireLock()
  try {
    return await fn()
  } finally {
    lock.release()
  }
}

// ---------------------------------------------------------------------------
// Lectura / escritura
// ---------------------------------------------------------------------------

async function readOrders(): Promise<Order[]> {
  const data = await kv.get<Order[]>(ORDERS_KEY)
  return Array.isArray(data) ? data : []
}

async function writeOrders(orders: Order[]): Promise<void> {
  await kv.set(ORDERS_KEY, orders)
}

// ---------------------------------------------------------------------------
// API pública — idéntica a json-store
// ---------------------------------------------------------------------------

export async function getOrderById(orderId: string): Promise<Order | null> {
  const orders = await readOrders()
  return orders.find((o) => o.id === orderId) ?? null
}

export async function listOrders(limit = 50): Promise<Order[]> {
  const orders = await readOrders()
  return orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export async function listOrdersByStatus(statuses: string[]): Promise<Order[]> {
  const orders = await readOrders()
  return orders.filter((o) => statuses.includes(o.status))
}

export async function insertOrder(order: Order): Promise<Order> {
  return withWriteLock(async () => {
    const orders = await readOrders()
    const existing = orders.find((o) => o.id === order.id)
    if (existing) return existing // idempotente

    orders.push(order)
    await writeOrders(orders)
    return order
  })
}

export async function updateOrder(
  orderId: string,
  updates: Partial<Order>
): Promise<Order | null> {
  return withWriteLock(async () => {
    const orders = await readOrders()
    const idx = orders.findIndex((o) => o.id === orderId)
    if (idx === -1) return null

    orders[idx] = { ...orders[idx], ...updates }
    await writeOrders(orders)
    return orders[idx]
  })
}

export async function updateOrderStatus(
  orderId: string,
  expectedStatus: string,
  updates: Partial<Order>
): Promise<Order | null> {
  return withWriteLock(async () => {
    const orders = await readOrders()
    const idx = orders.findIndex((o) => o.id === orderId)
    if (idx === -1) return null
    if (orders[idx].status !== expectedStatus) return null

    orders[idx] = { ...orders[idx], ...updates }
    await writeOrders(orders)
    return orders[idx]
  })
}