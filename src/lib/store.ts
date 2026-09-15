/**
 * Unified store abstraction for order persistence.
 *
 * El backend se elige automáticamente, en este orden:
 *  - Si existen KV_REST_API_URL y KV_REST_API_TOKEN (Vercel KV / Upstash
 *    compatibles), usa `kv-store` (Redis persistente).
 *  - Si no, y existen credenciales de Vercel Blob (BLOB_STORE_ID con OIDC, o
 *    BLOB_READ_WRITE_TOKEN), usa `blob-store` (JSON en Blob privado durable).
 *  - Si no, usa `json-store` (archivo local → bueno para dev local).
 *
 * Todos los consumidores (order-service, API routes) importan SOLO desde aquí,
 * así que este cambio no toca nada más del proyecto.
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

export const getOrderById = backend.getOrderById
export const listOrders = backend.listOrders
export const listOrdersByStatus = backend.listOrdersByStatus
export const insertOrder = backend.insertOrder
export const updateOrder = backend.updateOrder
export const updateOrderStatus = backend.updateOrderStatus

const backendName = useKv ? 'kv' : useBlob ? 'blob' : 'json'
if (process.env.NODE_ENV !== 'production') {
  console.log(`[store] Persistencia activa: ${backendName}`)
}

export { useKv, useBlob, backendName }