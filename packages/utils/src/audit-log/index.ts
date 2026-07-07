/* eslint-disable no-console */
import type { Position } from '@herald/types'
import type {
  AuditLogAction,
  AuditLogPerformerSnapshot,
  AuditLogPositionSnapshot,
  AuditLogTargetSnapshot,
} from '@herald/types/auditLog'
import { doc, type Firestore, getDoc } from 'firebase/firestore'
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore'
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore'

import { dispatchCreateAuditLog } from '../domain-events/create-audit-log.domain-event.ts'
import { createFirebaseAuditLogRepository } from '../gateways/firestore/auditLog-repository.gateway.ts'
import { createAdminFirebaseUserRepository } from '../gateways/firestore/user-repository.gateway.ts'

export function createAuditLogService(firestore: Firestore) {
  return {
    log(action: AuditLogAction, target: AuditLogTargetSnapshot | null, performerId: string): void {
      void (async () => {
        const performer = await fetchPerformerSnapshot(firestore, performerId)
        const repository = createFirebaseAuditLogRepository(firestore)
        dispatchCreateAuditLog(repository, {
          type: 'audit-log.create.requested',
          payload: { action, target, performer },
        })
      })()
    },
  }
}

// Admin-SDK counterpart for services running outside the browser (e.g. apps/auth),
// where sign-in/out and password-reset flows only have access to a firebase-admin
// Firestore instance rather than the client SDK.
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

async function fetchPerformerSnapshot(
  firestore: Firestore,
  performerId: string
): Promise<AuditLogPerformerSnapshot | null> {
  const docSnap = await getDoc(doc(firestore, 'users', performerId))
  if (!docSnap.exists()) {
    return null
  }

  const data = docSnap.data()
  const firstName = typeof data.firstName === 'string' ? data.firstName : ''
  const lastName = typeof data.lastName === 'string' ? data.lastName : ''
  const email = typeof data.email === 'string' ? data.email : ''

  if (!firstName || !lastName || !email) {
    return null
  }

  return {
    id: performerId,
    firstName,
    middleName: typeof data.middleName === 'string' ? data.middleName : undefined,
    lastName,
    email,
  }
}
