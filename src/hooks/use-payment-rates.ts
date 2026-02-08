// hooks/use-payment-rates.ts
"use client"

import { useState, useEffect } from "react"

export interface PaymentRates {
  [key: string]: number
}

export function usePaymentRates() {
  const [rates, setRates] = useState<PaymentRates>({
    "1": 0,
    "3": 18,
    "6": 25,
    "9": 35,
    "12": 47
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setRates(data)
      }
    } catch (error) {
      console.error("Error loading payment rates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveRates = async (newRates: PaymentRates) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRates)
      })
      
      if (res.ok) {
        const data = await res.json()
        setRates(data)
        return true
      }
      return false
    } catch (error) {
      console.error("Error saving payment rates:", error)
      return false
    }
  }

  return { rates, isLoading, saveRates, refreshRates: loadRates }
}