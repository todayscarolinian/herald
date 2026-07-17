/* eslint-disable no-console */
import type { Position } from '@herald/types'
import type {
  AuditLogAction,
  AuditLogPerformerSnapshot,
  AuditLogPositionSnapshot,
  AuditLogTargetSnapshot,
} from '@herald/types/auditLog'
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore'
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'

import { createAdminFirebaseUserRepository } from '../gateways/firestore/user-repository.gateway.ts'

export function createAdminAuditLogService(firestore: AdminFirestore) {
  return {
    log(
      action: AuditLogAction,
      target: AuditLogTargetSnapshot | null,
      performerId: string | null
    ): void {
      void (async () => {
        try {
          const performer = performerId
            ? await fetchAdminPerformerSnapshot(firestore, performerId)
            : null

          await firestore.collection('audit-logs').add({
            action,
            target,
            performer,
            timestamp: AdminTimestamp.now(),
          })
        } catch (error) {
          console.error('Error creating audit log (admin):', error)
        }
      })()
    },
  }
}

async function fetchAdminPerformerSnapshot(
  firestore: AdminFirestore,
  performerId: string
): Promise<AuditLogPerformerSnapshot | null> {
  const user = await createAdminFirebaseUserRepository(firestore).findById(performerId)
  if (!user) {
    return null
  }

  return {
    id: user.id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
  }
}

export function buildPositionSnapshots(
  positionIds: string[],
  positionsMap: Record<string, Position>
): AuditLogPositionSnapshot[] {
  return positionIds
    .map((id) => positionsMap[id])
    .filter((p): p is Position => !!p)
    .map((p) => ({
      id: p.id,
      name: p.name,
      abbreviation: p.abbreviation,
      domains: p.domains,
      createdAt: p.createdAt,
    }))
}
