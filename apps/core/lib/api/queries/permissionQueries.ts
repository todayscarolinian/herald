import type { ListPermissionsInput, PaginatedResult, PermissionDTO } from '@herald/types'
import { useQuery } from '@tanstack/react-query'

import { fetchPermissions } from '@/lib/api/services/permissionService'

export function usePermissions(params: ListPermissionsInput) {
  return useQuery<PaginatedResult<PermissionDTO>>({
    queryKey: ['permissions', params],
    queryFn: () => fetchPermissions(params),
  })
}
