import { useState, useEffect } from 'react'

interface SystemStatus {
  initialized: boolean
  timestamp: string
  version: string
}

export function useSystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkSystemStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use direct fetch to avoid toast errors for system status check
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8787'
      const response = await fetch(`${API_BASE_URL}/system/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('System status response:', data)
        setStatus(data.data)
      } else if (response.status === 404) {
        // System status endpoint doesn't exist, assume not initialized
        setStatus({
          initialized: false,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        })
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (err: any) {
      console.error('Failed to check system status:', err)
      // On any error, assume system is not initialized
      setStatus({
        initialized: false,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })
      setError(null) // Don't show error for system status check
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSystemStatus()
  }, [])

  return {
    status,
    isLoading,
    error,
    refetch: checkSystemStatus
  }
}
