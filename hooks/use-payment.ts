'use client'

import { useState } from 'react'

export interface CreatePaymentData {
  bookingId: string
  paymentMethod: 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'CREDIT_CARD'
  paymentGateway: 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'STRIPE'
  isSplitPayment?: boolean
  splitDetails?: Array<{
    userId: string
    amount: number
  }>
  isInstallment?: boolean
  installmentMonths?: number
}

export function usePayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPayment = async (data: CreatePaymentData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Payment creation failed')
      }

      // Redirect to payment gateway
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      }

      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatus = async (paymentId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/payments?id=${paymentId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment status')
      }

      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    createPayment,
    getPaymentStatus,
    loading,
    error,
  }
}
