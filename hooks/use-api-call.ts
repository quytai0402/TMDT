import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
  errorMessage?: string
}

interface ApiCallState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

export function useApiCall<T = any>(options: UseApiCallOptions<T> = {}) {
  const { toast } = useToast()
  const [state, setState] = useState<ApiCallState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  })

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      })

      try {
        const result = await apiCall()
        
        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        })

        options.onSuccess?.(result)

        if (options.showSuccessToast) {
          toast({
            title: 'Success',
            description: options.successMessage || 'Operation completed successfully',
            variant: 'default',
          })
        }

        return result
      } catch (error) {
        const err = error as Error
        
        setState({
          data: null,
          error: err,
          isLoading: false,
          isSuccess: false,
          isError: true,
        })

        options.onError?.(err)

        if (options.showErrorToast !== false) {
          const errorMessage = getErrorMessage(err)
          toast({
            title: 'Error',
            description: options.errorMessage || errorMessage,
            variant: 'destructive',
          })
        }

        throw error
      }
    },
    [options, toast]
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}

/**
 * Hook for fetching data with retry logic
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  options: {
    retry?: number
    retryDelay?: number
    onError?: (error: Error) => void
  } = {}
) {
  const { retry = 2, retryDelay = 1000, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const fetchWithRetry = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const result = await fetcher()
        setData(result)
        setError(null)
        setRetryCount(0)
        return result
      } catch (err) {
        const error = err as Error
        
        if (attempt === retry) {
          setError(error)
          setRetryCount(attempt)
          onError?.(error)
          throw error
        }

        setRetryCount(attempt + 1)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
      } finally {
        setIsLoading(false)
      }
    }
  }, [fetcher, retry, retryDelay, onError])

  return {
    data,
    error,
    isLoading,
    retryCount,
    refetch: fetchWithRetry,
  }
}

/**
 * Extract user-friendly error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }
  }

  return 'An unexpected error occurred'
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true
  }
  
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('connection')
    )
  }

  return false
}

/**
 * Check if error is a database error
 */
export function isDatabaseError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any
    return (
      errorObj.code === 'CONNECTION_ERROR' ||
      errorObj.code === 'TIMEOUT' ||
      errorObj.code === 'P2010' ||
      errorObj.status === 503
    )
  }
  return false
}
