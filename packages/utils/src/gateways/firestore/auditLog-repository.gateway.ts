/* eslint-disable no-console */
import {
  type AuditLogDTO,
  AuditLogFilters,
  AuditLogSortField,
  DEFAULT_PAGINATION,
  type IAuditLogRepository,
} from '@herald/types'
import {
  type AuditLog,
  type AuditLogAction,
  type AuditLogPerformerSnapshot,
  type AuditLogPositionSnapshot,
  type AuditLogTargetSnapshot,
  type AuditLogUserSnapshot,
} from '@herald/types/auditLog'
import {
  collection,
  doc,
  DocumentData,
  type Firestore,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  type Query,
  query,
  type QueryConstraint,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore'

import { isValidDomain } from '../../constants.ts'
import { createPaginatedResult } from '../../dto.ts'
import { fetchPaginatedDocs } from './pagination.ts'

const DEFAULT_SORT_FIELD: AuditLogSortField = 'timestamp'
const DEFAULT_SORT_DIRECTION = 'desc'
const AUDIT_LOGS_COLLECTION = 'audit-logs'

export function createFirebaseAuditLogRepository(firestore: Firestore): IAuditLogRepository {
  return {
    async findById({ id }) {
      try {
        const validatedId = validateAuditLogId(id)
        const docRef = doc(firestore, AUDIT_LOGS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          return null
        }

        return mapAuditLogDoc(docSnap.id, docSnap.data())
      } catch (error) {
        console.error('Error finding audit log by ID:', error)
        throw error
      }
    },

    async findAll(params) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const search = normalizeSearchTerm(params.filters?.search)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)

        const baseQuery = buildAuditLogQuery(
          firestore,
          AUDIT_LOGS_COLLECTION,
          params.filters,
          sortField,
          sortDirection
        )

        if (search) {
          const { auditLogs, total } = await fetchSearchAuditLogs(
            baseQuery,
            search,
            page,
            pageLimit
          )
          return createPaginatedResult(auditLogs, total, { page, limit: pageLimit })
        }

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        const auditLogs = await fetchPaginatedAuditLogs(baseQuery, page, pageLimit)

        return createPaginatedResult(auditLogs, total, {
          page,
          limit: pageLimit,
        })
      } catch (error) {
        console.error('Error finding all audit logs:', error)
        throw error
      }
    },

    async create(params) {
      try {
        const trimmedAction = params.action?.trim() as AuditLogAction | undefined

        if (!trimmedAction) {
          throw new TypeError('Invalid input: "action" is required')
        }

        const now = Timestamp.now()

        const auditLogDoc = {
          action: trimmedAction,
          target: params.target ?? null,
          performer: params.performer ?? null,
          timestamp: now,
        }

        const docRef = doc(collection(firestore, AUDIT_LOGS_COLLECTION))
        await setDoc(docRef, stripUndefined(auditLogDoc))

        return {
          id: docRef.id,
          action: trimmedAction,
          target: params.target ?? null,
          performer: params.performer ?? null,
          timestamp: now.toDate().toISOString(),
        }
      } catch (error) {
        console.error('Error creating audit log:', error)
        throw error
      }
    },

    async getTotalCount() {
      try {
        const auditLogsRef = collection(firestore, AUDIT_LOGS_COLLECTION)
        const snapshot = await getCountFromServer(auditLogsRef)
        return { totalAuditLogs: snapshot.data().count }
      } catch (error) {
        console.error('Error getting total audit log count:', error)
        throw error
      }
    },

    async exists(id) {
      try {
        const validatedId = validateAuditLogId(id)
        const docRef = doc(firestore, AUDIT_LOGS_COLLECTION, validatedId)
        const docSnap = await getDoc(docRef)
        return docSnap.exists()
      } catch (error) {
        console.error('Error checking if audit log exists:', error)
        throw error
      }
    },
  }
}

function normalizePagination(pagination: { page?: unknown; limit?: unknown }): {
  page: number
  limit: number
} {
  const parsedPage = Number(pagination?.page)
  const page = Number.isFinite(parsedPage)
    ? Math.max(1, Math.floor(parsedPage))
    : DEFAULT_PAGINATION.page

  const parsedLimit = Number(pagination?.limit)
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.floor(parsedLimit))
    : DEFAULT_PAGINATION.limit

  return { page, limit }
}

function normalizeSearchTerm(search: unknown): string | undefined {
  if (typeof search !== 'string') {
    return undefined
  }

  const normalizedSearch = search.trim().toLowerCase()
  return normalizedSearch.length > 0 ? normalizedSearch : undefined
}

function validateSortField(field: unknown): AuditLogSortField {
  const sortField = typeof field === 'string' ? field.trim() : DEFAULT_SORT_FIELD
  const allowedFields: AuditLogSortField[] = ['action', 'timestamp']

  if (!allowedFields.includes(sortField as AuditLogSortField)) {
    return DEFAULT_SORT_FIELD
  }

  return sortField as AuditLogSortField
}

function validateSortDirection(direction: unknown): 'asc' | 'desc' {
  return direction === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION
}

function buildAuditLogQuery(
  firestore: Firestore,
  collectionName: string,
  filters: AuditLogFilters | undefined,
  sortField: AuditLogSortField,
  sortDirection: 'asc' | 'desc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = []
  const auditLogsRef = collection(firestore, collectionName)

  if (filters?.action) {
    constraints.push(where('action', '==', filters.action.trim()))
  }

  if (filters?.since) {
    constraints.push(where('timestamp', '>=', Timestamp.fromDate(new Date(filters.since))))
  }

  if (filters?.until) {
    constraints.push(where('timestamp', '<', Timestamp.fromDate(new Date(filters.until))))
  }

  constraints.push(orderBy(sortField, sortDirection))
  return query(auditLogsRef, ...constraints)
}

async function fetchPaginatedAuditLogs(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<AuditLogDTO[]> {
  const docs = await fetchPaginatedDocs(baseQuery, page, pageLimit)
  return docs.map((docSnap) => mapAuditLogDoc(docSnap.id, docSnap.data()))
}

async function fetchSearchAuditLogs(
  baseQuery: Query<DocumentData>,
  search: string,
  page: number,
  pageLimit: number
): Promise<{ auditLogs: AuditLogDTO[]; total: number }> {
  const snapshot = await getDocs(baseQuery)
  const matching = snapshot.docs
    .map((docSnap) => mapAuditLogDoc(docSnap.id, docSnap.data()))
    .filter((auditLog) => matchesSearch(auditLog, search))

  const startIndex = (page - 1) * pageLimit
  const auditLogs = matching.slice(startIndex, startIndex + pageLimit)

  return { auditLogs, total: matching.length }
}

// Free-text search matches the performer and target of the log entry —
// `action` already has its own exact-match filter (see buildAuditLogQuery),
// so search is more useful surfacing "who did this" / "what did it touch".
function matchesSearch(auditLog: AuditLog, search: string): boolean {
  const performer = auditLog.performer
  if (performer) {
    const performerMatch =
      performer.firstName.toLowerCase().includes(search) ||
      performer.lastName.toLowerCase().includes(search) ||
      performer.email.toLowerCase().includes(search)

    if (performerMatch) {
      return true
    }
  }

  const target = auditLog.target
  if (target?.type === 'user') {
    return (
      target.data.firstName.toLowerCase().includes(search) ||
      target.data.lastName.toLowerCase().includes(search) ||
      target.data.email.toLowerCase().includes(search)
    )
  }

  if (target?.type === 'position') {
    return target.data.name.toLowerCase().includes(search)
  }

  return false
}

function mapAuditLogDoc(id: string, docSnap: DocumentData): AuditLog {
  const action = requireStringField(docSnap, 'action', id) as AuditLogAction
  const timestamp = requireTimestampField(docSnap, 'timestamp', id)

  return {
    id,
    action,
    target: readTargetSnapshot(docSnap.target),
    performer: readPerformerSnapshot(docSnap.performer),
    timestamp,
  }
}

function readTargetSnapshot(value: unknown): AuditLogTargetSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const obj = value as Record<string, unknown>

  if (obj.type === 'user') {
    const data = readUserSnapshot(obj.data)
    return data ? { type: 'user', data } : null
  }

  if (obj.type === 'position') {
    const data = readPositionSnapshot(obj.data)
    return data ? { type: 'position', data } : null
  }

  return null
}

function readUserSnapshot(value: unknown): AuditLogUserSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const obj = value as Record<string, unknown>

  const id = typeof obj.id === 'string' ? obj.id : null
  const firstName = typeof obj.firstName === 'string' ? obj.firstName : null
  const lastName = typeof obj.lastName === 'string' ? obj.lastName : null
  const email = typeof obj.email === 'string' ? obj.email : null
  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : null

  if (!id || !firstName || !lastName || !email || !createdAt) {
    return null
  }

  const positions = Array.isArray(obj.positions)
    ? obj.positions
        .map(readPositionSnapshot)
        .filter((p): p is AuditLogPositionSnapshot => p !== null)
    : []

  return {
    id,
    firstName,
    middleName: typeof obj.middleName === 'string' ? obj.middleName : undefined,
    lastName,
    email,
    positions,
    createdAt,
  }
}

function readPositionSnapshot(value: unknown): AuditLogPositionSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const obj = value as Record<string, unknown>

  const id = typeof obj.id === 'string' ? obj.id : null
  const name = typeof obj.name === 'string' ? obj.name : null
  const abbreviation = typeof obj.abbreviation === 'string' ? obj.abbreviation : null
  const createdAt = typeof obj.createdAt === 'string' ? obj.createdAt : null

  if (!id || !name || !abbreviation || !createdAt) {
    return null
  }

  const domains = Array.isArray(obj.domains) ? obj.domains.filter(isValidDomain) : []

  return { id, name, abbreviation, domains, createdAt }
}

function readPerformerSnapshot(value: unknown): AuditLogPerformerSnapshot | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const obj = value as Record<string, unknown>

  const id = typeof obj.id === 'string' ? obj.id : null
  const firstName = typeof obj.firstName === 'string' ? obj.firstName : null
  const lastName = typeof obj.lastName === 'string' ? obj.lastName : null
  const email = typeof obj.email === 'string' ? obj.email : null

  if (!id || !firstName || !lastName || !email) {
    return null
  }

  return {
    id,
    firstName,
    middleName: typeof obj.middleName === 'string' ? obj.middleName : undefined,
    lastName,
    email,
  }
}

function requireStringField(docSnap: DocumentData, field: string, auditLogId: string): string {
  const value = docSnap?.[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      `Invalid or missing required audit log field "${field}" for audit log ${auditLogId}`
    )
  }

  return value
}

function requireTimestampField(docSnap: DocumentData, field: string, auditLogId: string): string {
  const value = docSnap?.[field]
  if (!(value instanceof Timestamp)) {
    throw new Error(
      `Invalid or missing required audit log field "${field}" for audit log ${auditLogId}`
    )
  }

  return value.toDate().toISOString()
}

function stripUndefined<T>(value: T): T {
  if (value instanceof Timestamp || value === null || typeof value !== 'object') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(stripUndefined) as unknown as T
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefined(v)])
  ) as T
}

function validateAuditLogId(id: unknown): string {
  if (typeof id !== 'string') {
    throw new TypeError('Invalid findById input: "id" must be a string')
  }

  const normalizedId = id.trim()
  if (normalizedId.length === 0) {
    throw new TypeError('Invalid findById input: "id" cannot be empty')
  }

  if (normalizedId.includes('/')) {
    throw new TypeError('Invalid findById input: "id" cannot contain "/"')
  }

  return normalizedId
}
