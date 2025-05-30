"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface RefundResponse {
  success: boolean
  message: string
  refund?: {
    id: string
    amount: number
    status: string
  }
}

export default function RefundOrderPage() {
  const [orderId, setOrderId] = useState("")
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<RefundResponse | null>(null)

  const refundReasons = [
    { value: "duplicate", label: "Duplicate charge" },
    { value: "fraudulent", label: "Fraudulent" },
    { value: "requested_by_customer", label: "Requested by customer" },
    { value: "other", label: "Other" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/lemonsqueezy/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount: refundAmount ? Number.parseFloat(refundAmount) : undefined,
          reason: refundReason === "other" ? customReason : refundReason,
        }),
      })

      const data: RefundResponse = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while processing the refund",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setOrderId("")
    setRefundAmount("")
    setRefundReason("")
    setCustomReason("")
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Refund Order</CardTitle>
            <CardDescription>
              Process a refund for a Lemon Squeezy order. Enter the order details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                      {result.message}
                    </AlertDescription>
                  </div>
                </Alert>

                {result.success && result.refund && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Refund Details</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Refund ID:</span> {result.refund.id}
                      </p>
                      <p>
                        <span className="font-medium">Amount:</span> ${(result.refund.amount / 100).toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span> {result.refund.status}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={resetForm} variant="outline">
                    Process Another Refund
                  </Button>
                  <Link href="/dashboard">
                    <Button>Return to Dashboard</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID *</Label>
                  <Input
                    id="orderId"
                    type="text"
                    placeholder="Enter Lemon Squeezy order ID"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    The unique identifier for the order you want to refund
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundAmount">Refund Amount (Optional)</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave empty for full refund"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Partial refund amount in USD. Leave empty to refund the full amount.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refundReason">Refund Reason *</Label>
                  <Select value={refundReason} onValueChange={setRefundReason} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason for the refund" />
                    </SelectTrigger>
                    <SelectContent>
                      {refundReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {refundReason === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="customReason">Custom Reason *</Label>
                    <Textarea
                      id="customReason"
                      placeholder="Please specify the reason for refund"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Important Notes:</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>
                      • Refunds are processed immediately but may take 5-10 business days to appear in the customer's
                      account
                    </li>
                    <li>• Partial refunds are supported - leave amount empty for full refund</li>
                    <li>• This action cannot be undone once processed</li>
                    <li>• The customer will receive an email notification about the refund</li>
                  </ul>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Refund...
                    </>
                  ) : (
                    "Process Refund"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
