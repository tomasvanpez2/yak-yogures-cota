import { NextRequest, NextResponse } from 'next/server'
import { createOrder } from '@/lib/order-service'
import { listOrders } from '@/lib/store'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, customer } = body

    // Delegate all validation + price recalculation to order-service
    const result = await createOrder({ items, customer })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 }
      )
    }

    const order = result.data
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        total: order.total,
        subtotal: order.subtotal,
        deliveryCost: order.deliveryCost,
        totalUnits: order.totalUnits,
        deliveryDate: order.deliveryDate,
        deliveryDay: order.deliveryDay,
        status: order.status,
      },
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Error al procesar el pedido' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const orders = await listOrders(50)
    return NextResponse.json({ success: true, orders })
  } catch (err) {
    console.error('Error fetching orders:', err)
    return NextResponse.json(
      { error: 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}
