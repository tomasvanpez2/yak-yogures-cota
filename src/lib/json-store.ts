/**
 * Persistencia JSON local con escritura atómica.
 *
 * Los pedidos se almacenan en `data/orders.json` y los clientes en `data/customers.json`.
 *
 * Directorios de almacenamiento:
 *   1. `DATA_DIR` (variable de entorno, si se define)
 *   2. `<cwd>/data` (disco local de desarrollo)
 *   3. `/tmp/yak-data` (respaldo efímero en entorno serverless sin KV/Blob)
 */

import { readFile, writeFile, rename, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import type { Order } from './order'
import type { Customer } from './client-types'
import { normalizePhone } from './client-types'

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
// Resolución del directorio escribible
// ---------------------------------------------------------------------------
let resolvedDir: string | null = null

async function resolveDataDir(): Promise<string> {
  if (resolvedDir) return resolvedDir

  const candidates: string[] = []
  if (process.env.DATA_DIR) candidates.push(process.env.DATA_DIR)
  candidates.push(path.join(process.cwd(), 'data'))
  candidates.push('/tmp/yak-data')

  for (const dir of candidates) {
    try {
      await mkdir(dir, { recursive: true })
      const probe = path.join(dir, `__probe-${process.pid}-${Date.now()}.tmp`)
      await writeFile(probe, '1')
      await unlink(probe).catch(() => {})
      resolvedDir = dir
      return resolvedDir
    } catch {
      // Siguiente candidato
    }
  }

  throw new Error(
    '[json-store] No hay un directorio escribible para persistir datos. Conecta Vercel Blob o KV.'
  )
}

async function getFilePath(filename: string): Promise<string> {
  const dir = await resolveDataDir()
  return path.join(dir, filename)
}

// ---------------------------------------------------------------------------
// Helpers genéricos de lectura/escritura atómica
// ---------------------------------------------------------------------------

async function readJsonFile<T>(filename: string): Promise<T[]> {
  try {
    const file = await getFilePath(filename)
    if (!existsSync(file)) return []
    const raw = await readFile(file, 'utf-8')
    if (!raw.trim()) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('escribible')) throw err
    return []
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  const file = await getFilePath(filename)
  await mkdir(path.dirname(file), { recursive: true })
  const tmpPath = `${file}.tmp.${Date.now()}`
  const json = JSON.stringify(data, null, 2)
  await writeFile(tmpPath, json, 'utf-8')
  await rename(tmpPath, file)
}

// ===========================================================================
// PEDIDOS (orders.json)
// ===========================================================================

export async function readOrders(): Promise<Order[]> {
  return readJsonFile<Order>('orders.json')
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const orders = await readOrders()
  return orders.find((o) => o.id === orderId) ?? null
}

export async function listOrders(limit = 100): Promise<Order[]> {
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
    if (existing) return existing

    orders.push(order)
    await writeJsonFile('orders.json', orders)
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
    await writeJsonFile('orders.json', orders)
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
    await writeJsonFile('orders.json', orders)
    return orders[idx]
  })
}

// ===========================================================================
// CLIENTES (customers.json)
// ===========================================================================

export async function readCustomers(): Promise<Customer[]> {
  return readJsonFile<Customer>('customers.json')
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const normalized = normalizePhone(phone)
  const customers = await readCustomers()
  return customers.find((c) => normalizePhone(c.phone) === normalized) ?? null
}

export async function listCustomers(limit = 200): Promise<Customer[]> {
  const customers = await readCustomers()
  return customers
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, limit)
}

export async function upsertCustomer(customer: Customer): Promise<Customer> {
  return withWriteLock(async () => {
    const customers = await readCustomers()
    const normalized = normalizePhone(customer.phone)
    const idx = customers.findIndex((c) => normalizePhone(c.phone) === normalized)

    const now = new Date().toISOString()
    if (idx >= 0) {
      customers[idx] = {
        ...customers[idx],
        ...customer,
        phone: normalized,
        updatedAt: now,
      }
      await writeJsonFile('customers.json', customers)
      return customers[idx]
    } else {
      const newCustomer: Customer = {
        ...customer,
        phone: normalized,
        createdAt: customer.createdAt || now,
        updatedAt: now,
      }
      customers.push(newCustomer)
      await writeJsonFile('customers.json', customers)
      return newCustomer
    }
  })
}

export async function updateCustomer(
  phone: string,
  updates: Partial<Customer>
): Promise<Customer | null> {
  return withWriteLock(async () => {
    const customers = await readCustomers()
    const normalized = normalizePhone(phone)
    const idx = customers.findIndex((c) => normalizePhone(c.phone) === normalized)
    if (idx === -1) return null

    customers[idx] = {
      ...customers[idx],
      ...updates,
      phone: normalized,
      updatedAt: new Date().toISOString(),
    }
    await writeJsonFile('customers.json', customers)
    return customers[idx]
  })
}