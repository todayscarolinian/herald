import { createAdminAuditLogService } from '@herald/utils'

import { firestore } from './firestore.ts'

export const adminAuditLogService = createAdminAuditLogService(firestore)
