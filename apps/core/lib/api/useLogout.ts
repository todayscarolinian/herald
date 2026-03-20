import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { logoutFn } from './auth'

export const useLogout = () => {
  const router = useRouter()

  return useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      router.replace('/login')
    },
  })
}
