import { useEffect } from 'react'
import { toast } from 'sonner'

export function useToastOnError(isError: boolean, error: Error | null | undefined) {
  useEffect(() => {
    if (isError && error) {
      toast.error(error.message)
    }
  }, [isError, error])
}
