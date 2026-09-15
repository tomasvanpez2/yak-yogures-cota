/**
 * Persistencia JSON local con escritura atómica.
 *
 * Los pedidos se almacenan en `data/orders.json` como un array.
 *
 * IMPORTANTE (Vercel): en las funciones serverless la carpeta del proyecto es
 * de SOLO LECTURA (excepto `/tmp`). Para que los pedidos nunca fallen con
 * "Error al procesar el pedido", al arrancar se elige el PRIMER directorio
 * realmente escribible, en este orden:
 *   1. `DATA_DIR` (variable de entorno, si se define)
 *   2. `/data` (disco persistente de Render)
 *   3. `<cwd>/data` (disco local de desarrollo)
 *   4. `/tmp/yak-data` (respaldo efímero en Vercel sin KV)
 *
 * Nota: en `/tmp` los datos pueden perderse si Vercel reinicia la función.
 * Para datos DUrables en producción usa Vercel KV (ver kv-store.ts), que se
 * activa solo con KV_REST_API_URL/KV_REST_API_TOKEN (store.ts decide).
 */

import { readFile, writeFile, rename, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { Order } from './order'

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
// Resolución del directorio escribible (se hace una sola vez)
// ---------------------------------------------------------------------------
let resolvedFile: string | null = null

async function resolveOrdersFile(): Promise<string> {
  if (resolvedFile) return resolvedFile

  const candidates: string[] = []
  if (process.env.DATA_DIR) candidates.push(process.env.DATA_DIR)
  if (existsSync('/data')) candidates.push('/data')
  candidates.push(path.join(process.cwd(), 'data'))
  candidates.push('/tmp/yak-data')

  for (const dir of candidates) {
    try {
      // Prueba real de escritura: crea un archivo temporal y lo borra.
      await mkdir(dir, { recursive: true })
      const probe = path.join(dir, `__probe-${process.pid}-${Date.now()}.tmp`)
      await writeFile(probe, '1')
      await unlink(probe).catch(() => {})
      resolvedFile = path.join(dir, 'orders.json')
      console.log(`[json-store] 💾 Persistiendo pedidos en: ${resolvedFile}`)
      return resolvedFile
    } catch {
      // Sigue con el siguiente candidato
    }
  }

  throw new Error(
    '[json-store] No hay un directorio escribible para perseguir pedidos. Conecta Vercel KV.'
  )
}

// ---------------------------------------------------------------------------
// Lectura / escritura del archivo JSON
// ---------------------------------------------------------------------------

/** Lee todos los pedidos. Si no existe o está corrupto, devuelve []. */
export async function readOrders(): Promise<Order[]> {
  try {
    const file = await resolveOrdersFile()
    if (!existsSync(file)) return []
    const raw = await readFile(file, 'utf-8')
    if (!raw.trim()) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('escribible')) throw err
    console.warn('[json-store] Error leyendo pedidos, devuelve []')
    return []
  }
}

/** Escritura atómica: escribe a un .tmp y luego renombra. */
async function atomicWrite(data: Order[]): Promise<void> {
  const file = await resolveOrdersFile()
  await mkdir(path.dirname(file), { recursive: true })
  const tmpPath = `${file}.tmp.${Date.now()}`
  const json = JSON.stringify(data, null, 2)
  await writeFile(tmpPath, json, 'utf-8')
  await rename(tmpPath, file)
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
    await atomicWrite(orders)
    return order
  })
}

/**
 * Actualiza un pedido existente aplicando un merge parcial.
 * Retorna null si no se encontró el pedido.
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
    await atomicWrite(orders)
    return orders[idx]
  })
}

/**
 * Actualiza un pedido solo si su status actual coincide con `expectedStatus`.
 * Retorna el pedido actualizado, o null si no se cumplió la condición.
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
    await atomicWrite(orders)
    return orders[idx]
  })
}