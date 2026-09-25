/**
 * Persistencia en Vercel Blob (privado) con la MISMA API que json-store/kv-store.
 *
 * Los pedidos se guardan como un único JSON (`yak/orders.json`) y los clientes
 * en (`yak/customers.json`) en un blob privado, sobrescribiéndolo con cada
 * cambio (allowOverwrite).
 */

import { get, put } from '@vercel/blob'
import type { Order } from './order'
import type { Customer } from './client-types'
import { normalizePhone } from './client-types'

const ORDERS_PATHNAME = 'yak/orders.json'
const CUSTOMERS_PATHNAME = 'yak/customers.json'

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
// Helpers lectura / escritura Blob
// ---------------------------------------------------------------------------

async function readBlobJson<T>(pathname: string): Promise<T[]> {
  try {
    const result = await get(pathname, {
      access: 'private',
      useCache: false,
    })
    if (!result || result.statusCode !== 200) return []
    const text = await new Response(result.stream).text()
    if (!text.trim()) return []
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function writeBlobJson<T>(pathname: string, data: T[]): Promise<void> {
  await put(pathname, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: true,
  })
}

// ===========================================================================
// PEDIDOS
// ===========================================================================

async function readOrders(): Promise<Order[]> {
  return readBlobJson<Order>(ORDERS_PATHNAME)
}

async function writeOrders(orders: Order[]): Promise<void> {
  return writeBlobJson<Order>(ORDERS_PATHNAME, orders)
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

// ===========================================================================
// CLIENTES
// ===========================================================================

async function readCustomers(): Promise<Customer[]> {
  return readBlobJson<Customer>(CUSTOMERS_PATHNAME)
}

async function writeCustomers(customers: Customer[]): Promise<void> {
  return writeBlobJson<Customer>(CUSTOMERS_PATHNAME, customers)
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const normalized = normalizePhone(phone)
  const customers = await readCustomers()
  return customers.find((c) => normalizePhone(c.phone) === normalized) ?? null
}

export async function listCustomers(limit = 200): Promise<Customer[]> {
  const customers = await readCustomers()
  return customers
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    )
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
      await writeCustomers(customers)
      return customers[idx]
    } else {
      const newCustomer: Customer = {
        ...customer,
        phone: normalized,
        createdAt: customer.createdAt || now,
        updatedAt: now,
      }
      customers.push(newCustomer)
      await writeCustomers(customers)
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
    await writeCustomers(customers)
    return customers[idx]
  })
}