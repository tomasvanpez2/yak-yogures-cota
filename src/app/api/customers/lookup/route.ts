import { NextRequest, NextResponse } from 'next/server'
import { getCustomerByPhone } from '@/lib/store'
import { normalizePhone } from '@/lib/client-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Parámetro phone requerido' },
        { status: 400 }
      )
    }

    const normalized = normalizePhone(phone)
    if (!/^\d{10}$/.test(normalized)) {
      return NextResponse.json(
        { error: 'Número de teléfono inválido (debe tener 10 dígitos)' },
        { status: 400 }
      )
    }

    const customer = await getCustomerByPhone(normalized)

    if (!customer) {
      return NextResponse.json({ found: false, customer: null })
    }

    return NextResponse.json({
      found: true,
      customer: {
        phone: customer.phone,
        name: customer.name,
        address: customer.address,
        zone: customer.zone,
        apartment: customer.apartment || '',
        instructions: customer.instructions || '',
        isFounder: Boolean(customer.isFounder),
        bottlesInPossession: customer.bottlesInPossession || 0,
        bottlesHistory: customer.bottlesHistory || 0,
      },
    })
  } catch (error) {
    console.error('Error looking up customer:', error)
    return NextResponse.json(
      { error: 'Error al consultar cliente' },
      { status: 500 }
    )
  }
}