/**
 * Persistencia JSON local con escritura atómica.
 *
 * - Los pedidos se almacenan en `data/orders.json` como un array.
 * - Se usa un lock de proceso (async mutex) para evitar condiciones de carrera
 *   cuando dos requests escriben casi simultáneamente.
 * - La escritura es atómica: se escribe a un archivo temporal y luego se renombra,
 *   evitando que un crash deje el archivo corrupto.
 */

import { readFile, writeFile, rename, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { Order } from './order'

// En Render, el disco persistente se monta en /data (absoluto).
// En local, usamos data/ dentro del cwd.
const DATA_DIR = process.env.DATA_DIR || (existsSync('/data') ? '/data' : path.join(process.cwd(), 'data'))
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')

// ---------------------------------------------------------------------------
// Lock de proceso (async mutex) — evita race conditions entre requests
// ---------------------------------------------------------------------------
let lockPromise: Promise<void> = Promise.resolve()

function acquireLock(): { release: () => void } {
  let releaseFn: () => void
  const waitPromise = new Promise<void>((resolve) => {
    releaseFn = resolve
  })

  lockPromise = lockPromise.then(() => waitPromise)

  // Cuando el lock anterior se libera, encadena el nuestro
  return {
    release: () => releaseFn!(),
  }
}

/**
 * Ejecuta una función bajo el lock de escritura.
 * Garantiza que solo una escritura ocurre a la vez.
 */
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
// Lectura / escritura del archivo JSON
// ---------------------------------------------------------------------------

/** Lee todos los pedidos del archivo. Si no existe o está corrupto, devuelve []. */
export async function readOrders(): Promise<Order[]> {
  try {
    if (!existsSync(ORDERS_FILE)) return []
    const raw = await readFile(ORDERS_FILE, 'utf-8')
    if (!raw.trim()) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    console.warn('[json-store] Error leyendo orders.json, devuelve []')
    return []
  }
}

/**
 * Escritura atómica: escribe a un .tmp y luego renombra.
 * Esto evita que un crash deje el archivo principal corrupto.
 */
async function atomicWrite(filePath: string, data: Order[]): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const tmpPath = `${filePath}.tmp.${Date.now()}`
  const json = JSON.stringify(data, null, 2)
  await writeFile(tmpPath, json, 'utf-8')
  await rename(tmpPath, filePath)
}

// ---------------------------------------------------------------------------
// API pública — todo pasa por el lock
// ---------------------------------------------------------------------------

/** Obtiene un pedido por ID. */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const orders = await readOrders()
  return orders.find((o) => o.id === orderId) ?? null
}

/** Devuelve todos los pedidos (más recientes primero, limit opcional). */
export async function listOrders(limit = 50): Promise<Order[]> {
  const orders = await readOrders()
  return orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

/** Devuelve pedidos filtrados por status (para daily summary, etc.). */
export async function listOrdersByStatus(statuses: string[]): Promise<Order[]> {
  const orders = await readOrders()
  return orders.filter((o) => statuses.includes(o.status))
}

/**
 * Inserta un pedido nuevo. Si ya existe uno con el mismo ID, lo retorna (idempotente).
 * Escritura atómica bajo lock.
 */
export async function insertOrder(order: Order): Promise<Order> {
  return withWriteLock(async () => {
    const orders = await readOrders()
    const existing = orders.find((o) => o.id === order.id)
    if (existing) return existing // idempotente

    orders.push(order)
    await atomicWrite(ORDERS_FILE, orders)
    return order
  })
}

/**
 * Actualiza un pedido existente aplicando un merge parcial.
 * Retorna null si no se encontró el pedido.
 * Escritura atómica bajo lock.
 */
export async function updateOrder(
  orderId: string,
  updates: Partial<Order>
): Promise<Order | null> {
  return withWriteLock(async () => {
    const orders = await readOrders()
    const idx = orders.findIndex((o) => o.id === orderId)
    if (idx === -1) return null

    orders[idx] = { ...orders[idx], ...updates }
    await atomicWrite(ORDERS_FILE, orders)
    return orders[idx]
  })
}

/**
 * Actualiza un pedido solo si su status actual coincide con `expectedStatus`.
 * Retorna el pedido actualizado, o null si no se cumplió la condición.
 * Esto garantiza idempotencia y evita transiciones inválidas.
 */
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
    await atomicWrite(ORDERS_FILE, orders)
    return orders[idx]
  })
}
