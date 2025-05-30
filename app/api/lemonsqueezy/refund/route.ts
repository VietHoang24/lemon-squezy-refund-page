import { type NextRequest, NextResponse } from "next/server"

interface RefundRequest {
  orderId: string
  amount?: number
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, reason }: RefundRequest = await request.json()

    // Validate required fields
    if (!orderId || !reason) {
      return NextResponse.json({ success: false, message: "Order ID and reason are required" }, { status: 400 })
    }

    // Get API key from environment variables
    const apiKey = process.env.LEMONSQUEEZY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, message: "Lemon Squeezy API key not configured" }, { status: 500 })
    }

    // First, get the order details to validate it exists
    const orderResponse = await fetch(`https://api.lemonsqueezy.com/v1/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      return NextResponse.json(
        {
          success: false,
          message: `Order not found: ${errorData.errors?.[0]?.detail || "Invalid order ID"}`,
        },
        { status: 404 },
      )
    }

    const orderData = await orderResponse.json()
    const order = orderData.data

    // Check if order is refundable
    if (order.attributes.status !== "paid") {
      return NextResponse.json(
        { success: false, message: "Order must be in 'paid' status to be refunded" },
        { status: 400 },
      )
    }

    // Prepare refund data
    const refundData = {
      data: {
        type: "refunds",
        attributes: {
          reason: reason,
          ...(amount && { amount: Math.round(amount * 100) }), // Convert to cents
        },
        relationships: {
          order: {
            data: {
              type: "orders",
              id: orderId,
            },
          },
        },
      },
    }

    // Create the refund
    const refundResponse = await fetch("https://api.lemonsqueezy.com/v1/refunds", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify(refundData),
    })

    if (!refundResponse.ok) {
      const errorData = await refundResponse.json()
      return NextResponse.json(
        {
          success: false,
          message: `Refund failed: ${errorData.errors?.[0]?.detail || "Unknown error"}`,
        },
        { status: refundResponse.status },
      )
    }

    const refundResult = await refundResponse.json()
    const refund = refundResult.data

    return NextResponse.json({
      success: true,
      message: "Refund processed successfully",
      refund: {
        id: refund.id,
        amount: refund.attributes.amount,
        status: refund.attributes.status,
      },
    })
  } catch (error) {
    console.error("Refund API error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
