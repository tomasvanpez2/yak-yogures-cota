/**
 * Fachada unificada de persistencia para Pedidos y Clientes.
 *
 * El backend se elige automáticamente:
 *  1. Vercel KV (si KV_REST_API_URL y KV_REST_API_TOKEN existen)
 *  2. Vercel Blob (si BLOB_STORE_ID o BLOB_READ_WRITE_TOKEN existen)
 *  3. JSON local (fallback seguro para desarrollo y local)
 */

import * as jsonStore from './json-store'
import * as kvStore from './kv-store'
import * as blobStore from './blob-store'

const useKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
const useBlob = !!(
  process.env.BLOB_STORE_ID ||
  process.env.BLOB_READ_WRITE_TOKEN
)

const backend = useKv ? kvStore : useBlob ? blobStore : jsonStore

// ===========================================================================
// PEDIDOS
// ===========================================================================
export const getOrderById = backend.getOrderById
export const listOrders = backend.listOrders
export const listOrdersByStatus = backend.listOrdersByStatus
export const insertOrder = backend.insertOrder
export const updateOrder = backend.updateOrder
export const updateOrderStatus = backend.updateOrderStatus

// ===========================================================================
// CLIENTES
// ===========================================================================
export const getCustomerByPhone = backend.getCustomerByPhone
export const listCustomers = backend.listCustomers
export const upsertCustomer = backend.upsertCustomer
export const updateCustomer = backend.updateCustomer

const backendName = useKv ? 'kv' : useBlob ? 'blob' : 'json'
if (process.env.NODE_ENV !== 'production') {
  console.log(`[store] Persistencia activa: ${backendName}`)
}

export { useKv, useBlob, backendName }