/**
 * Persistencia en Vercel Blob (privado) con la MISMA API que json-store/kv-store.
 *
 * Los pedidos se guardan como un único JSON (`yak/orders.json`) en un blob
 * privado, sobrescribiéndolo con cada cambio (allowOverwrite). Blob es durable
 * y sobrevive los cold starts / reciclados de la función serverless.
 *
 * Concurrencia: se usa un lock de proceso (async mutex), igual que los otros
 * stores. Para volumen bajo (pedidos de un negocio local) es suficiente. La
 * lectura siempre pide la última versión (`useCache: false`) para no servir
 * datos viejos del CDN.
 *
 * requiere las variables de entorno de Blob (se inyectan al conectar el store):
 *  - En Vercel (default): BLOB_STORE_ID + VERCEL_OIDC_TOKEN (OIDC)
 *  - Local / CI: BLOB_READ_WRITE_TOKEN
 */

import { get, put } from '@vercel/blob'
import type { Order } from './order'

const ORDERS_PATHNAME = 'yak/orders.json'

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
  const result = await get(ORDERS_PATHNAME, {
    access: 'private',
    useCache: false,
  })
  if (!result || result.statusCode !== 200) return []
  const text = await new Response(result.stream).text()
  if (!text.trim()) return []
  const data = JSON.parse(text)
  return Array.isArray(data) ? data : []
}

async function writeOrders(orders: Order[]): Promise<void> {
  await put(ORDERS_PATHNAME, JSON.stringify(orders), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

// ---------------------------------------------------------------------------
// API pública — idéntica a json-store / kv-store
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
    if (orders[idx].status !== expectedStatus) return null // condición no cumplida

    orders[idx] = { ...orders[idx], ...updates }
    await writeOrders(orders)
    return orders[idx]
  })
}