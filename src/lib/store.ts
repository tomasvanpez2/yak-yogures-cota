/**
 * Unified store abstraction for order persistence.
 *
 * El backend se elige automáticamente:
 *  - Si existen KV_REST_API_URL y KV_REST_API_TOKEN (Vercel KV instalado),
 *    usa `kv-store` (Redis persistente → seguro en producción).
 *  - Si no, usa `json-store` (archivo local → bueno para dev / sin KV).
 *
 * Todos los consumidores (order-service, API routes) importan SOLO desde aquí,
 * así que este cambio no toca nada más del proyecto.
 */

import * as jsonStore from './json-store'
import * as kvStore from './kv-store'

const useKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

const backend = useKv ? kvStore : jsonStore

export const getOrderById = backend.getOrderById
export const listOrders = backend.listOrders
export const listOrdersByStatus = backend.listOrdersByStatus
export const insertOrder = backend.insertOrder
export const updateOrder = backend.updateOrder
export const updateOrderStatus = backend.updateOrderStatus

export { useKv }