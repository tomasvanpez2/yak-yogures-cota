/**
 * Persistencia en Vercel KV (Redis) con la MISMA API que json-store.
 *
 * Los pedidos se guardan como una sola clave JSON (`yak:orders`) y los
 * clientes en `yak:customers`. Se usa un lock de proceso (async mutex) para
 * evitar condiciones de carrera entre requests, igual que en json-store.
 *
 * requiere las variables de entorno KV_REST_API_URL y KV_REST_API_TOKEN
 * (Vercel KV las inyecta automáticamente al conectar el servicio).
 */

import { kv } from '@vercel/kv'
import type { Order } from './order'
import type { Customer } from './client-types'
import { normalizePhone } from './client-types'

const ORDERS_KEY = 'yak:orders'
const CUSTOMERS_KEY = 'yak:customers'

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
// Pedidos
// ---------------------------------------------------------------------------

async function readOrders(): Promise<Order[]> {
  const data = await kv.get<Order[]>(ORDERS_KEY)
  return Array.isArray(data) ? data : []
}

async function writeOrders(orders: Order[]): Promise<void> {
  await kv.set(ORDERS_KEY, orders)
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

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

async function readCustomers(): Promise<Customer[]> {
  const data = await kv.get<Customer[]>(CUSTOMERS_KEY)
  return Array.isArray(data) ? data : []
}

async function writeCustomers(customers: Customer[]): Promise<void> {
  await kv.set(CUSTOMERS_KEY, customers)
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