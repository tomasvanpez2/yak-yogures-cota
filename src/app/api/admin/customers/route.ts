import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/admin-auth'
import { listCustomers, upsertCustomer, updateCustomer, getCustomerByPhone } from '@/lib/store'
import { normalizePhone, type Customer } from '@/lib/client-types'

// Guard: solo sesiones admin con cookie válida
function guard(): NextResponse | null {
  if (!verifyAdminSession()) {
    return NextResponse.json(
      { error: 'No autorizado. Se requiere autenticación 2FA.' },
      { status: 401 }
    )
  }
  return null
}

// GET: Lista todos los clientes (o busca uno por teléfono)
export async function GET(request: NextRequest) {
  const unauthorized = guard()
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (phone) {
      const customer = await getCustomerByPhone(phone)
      return NextResponse.json({ success: true, customer })
    }

    const customers = await listCustomers(500)
    return NextResponse.json({ success: true, customers })
  } catch (error) {
    console.error('[admin/customers] Error listando clientes:', error)
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

// POST: Crea/actualiza un cliente completo (registro de fundador desde el panel)
export async function POST(request: NextRequest) {
  const unauthorized = guard()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const { name, phone, zone, address, apartment, instructions, isFounder, bottlesInPossession, bottlesHistory } = body

    if (!name || !phone || !zone || !address) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: name, phone, zone, address' },
        { status: 400 }
      )
    }

    const normalized = normalizePhone(phone)
    if (!/^\d{10}$/.test(normalized)) {
      return NextResponse.json({ error: 'Teléfono inválido (10 dígitos)' }, { status: 400 })
    }

    const existing = await getCustomerByPhone(normalized)
    const now = new Date().toISOString()

    const customer: Customer = {
      phone: normalized,
      name: String(name).trim(),
      address: String(address).trim(),
      zone: String(zone),
      apartment: apartment ? String(apartment).trim() : undefined,
      instructions: instructions ? String(instructions).trim() : undefined,
      isFounder: Boolean(isFounder),
      bottlesInPossession: Number(bottlesInPossession) || 0,
      bottlesHistory: Number(bottlesHistory) || 0,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    }

    const saved = await upsertCustomer(customer)
    return NextResponse.json({ success: true, customer: saved })
  } catch (error) {
    console.error('[admin/customers] Error guardando cliente:', error)
    return NextResponse.json({ error: 'Error al guardar cliente' }, { status: 500 })
  }
}

// PATCH: Actualiza campos puntuales (isFounder, botellas, etc.)
export async function PATCH(request: NextRequest) {
  const unauthorized = guard()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const { phone, ...updates } = body

    if (!phone) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 })
    }

    // Solo permitir campos seguros
    const safeUpdates: Partial<Customer> = {}
    if (typeof updates.isFounder === 'boolean') safeUpdates.isFounder = updates.isFounder
    if (typeof updates.bottlesInPossession === 'number' && updates.bottlesInPossession >= 0)
      safeUpdates.bottlesInPossession = Math.floor(updates.bottlesInPossession)
    if (typeof updates.bottlesHistory === 'number' && updates.bottlesHistory >= 0)
      safeUpdates.bottlesHistory = Math.floor(updates.bottlesHistory)
    if (typeof updates.name === 'string' && updates.name.trim())
      safeUpdates.name = updates.name.trim()
    if (typeof updates.zone === 'string' && updates.zone) safeUpdates.zone = updates.zone
    if (typeof updates.address === 'string' && updates.address.trim())
      safeUpdates.address = updates.address.trim()

    const updated = await updateCustomer(phone, safeUpdates)
    if (!updated) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, customer: updated })
  } catch (error) {
    console.error('[admin/customers] Error actualizando cliente:', error)
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}