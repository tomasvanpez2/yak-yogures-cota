import { NextRequest, NextResponse } from 'next/server'
import { reportPayment } from '@/lib/order-service'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'ID de pedido requerido' }, { status: 400 })
    }

    const result = await reportPayment(orderId, new Date())

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Pago reportado exitosamente. Queda pendiente de verificación.',
      order: {
        id: result.data.id,
        status: result.data.status,
        deliveryDay: result.data.deliveryDay,
        deliveryDate: result.data.deliveryDate,
      },
    })
  } catch (err) {
    console.error('Error reporting payment:', err)
    return NextResponse.json(
      { error: 'Error al reportar el pago' },
      { status: 500 }
    )
  }
}
