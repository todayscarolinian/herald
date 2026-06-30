import type { Position } from '@herald/types'
import type {
  AuditLogPerformerSnapshot,
  AuditLogPositionSnapshot,
  AuditLogTargetSnapshot,
} from '@herald/types/auditLog'
import { doc, type Firestore, getDoc } from 'firebase/firestore'

import { dispatchCreateAuditLog } from '../domain-events/create-audit-log.domain-event.ts'
import { createFirebaseAuditLogRepository } from '../gateways/firestore/auditLog-repository.gateway.ts'

export function createAuditLogService(firestore: Firestore) {
  return {
    log(action: string, target: AuditLogTargetSnapshot | null, performerId: string): void {
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
      permissions: p.permissions,
      createdAt: p.createdAt,
    }))
}

async function fetchPerformerSnapshot(
  firestore: Firestore,
  performerId: string
): Promise<AuditLogPerformerSnapshot | null> {
  const docSnap = await getDoc(doc(firestore, 'users', performerId))
  if (!docSnap.exists()) {return null}

  const data = docSnap.data()
  const firstName = typeof data.firstName === 'string' ? data.firstName : ''
  const lastName = typeof data.lastName === 'string' ? data.lastName : ''
  const email = typeof data.email === 'string' ? data.email : ''

  if (!firstName || !lastName || !email) {return null}

  return {
    id: performerId,
    firstName,
    middleName: typeof data.middleName === 'string' ? data.middleName : undefined,
    lastName,
    email,
  }
}
