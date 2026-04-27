/* eslint-disable no-console */
import {
  type AuditLogDTO,
  AuditLogFilters,
  type AuditLogPerformerDTO,
  AuditLogSortField,
  type AuditLogTargetDTO,
  type AuditLogTargetPositionDTO,
  type AuditLogTargetUserDTO,
  DEFAULT_PAGINATION,
  type IAuditLogRepository,
  type UserDTO,
} from '@herald/types'
import { AuditLog } from '@herald/types/auditLog'
import {
  collection,
  doc,
  DocumentData,
  type Firestore,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  type Query,
  query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore'

import { createPaginatedResult } from '../../dto.ts'

const MAX_PAGE_LIMIT = 10
const DEFAULT_SORT_FIELD: AuditLogSortField = 'timestamp'
const DEFAULT_SORT_DIRECTION = 'desc'
const AUDIT_LOGS_COLLECTION = 'auditLogs'
const USERS_COLLECTION = 'users'
const POSITIONS_COLLECTION = 'positions'

type AuditLogEnrichmentCache = {
  users: Map<string, AuditLogTargetUserDTO | null>
  positions: Map<string, AuditLogTargetPositionDTO | null>
}

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

        const rawAuditLog = mapAuditLogDocToRaw(docSnap.id, docSnap.data())
        return enrichAuditLog(rawAuditLog, firestore, createEnrichmentCache())
      } catch (error) {
        console.error('Error finding audit log by ID:', error)
        throw error
      }
    },

    async findAll(params) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)

        const baseQuery = buildAuditLogQuery(
          firestore,
          AUDIT_LOGS_COLLECTION,
          params.filters,
          sortField,
          sortDirection
        )

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        const auditLogs = await fetchPaginatedAuditLogs(baseQuery, page, pageLimit, firestore)

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
        const { action, targetId, performerId } = params

        const trimmedAction = action?.trim()

        if (!trimmedAction) {
          throw new TypeError('Invalid input: "action" is required')
        }

        if (typeof targetId !== 'string' || targetId.trim().length === 0) {
          throw new TypeError(
            'Invalid input: "targetId" is required and must be a non-empty string'
          )
        }

        if (typeof performerId !== 'string' || performerId.trim().length === 0) {
          throw new TypeError(
            'Invalid input: "performerId" is required and must be a non-empty string'
          )
        }

        const now = Timestamp.now()

        const auditLogDoc = {
          action: trimmedAction,
          targetId: targetId.trim(),
          performerId: performerId.trim(),
          timestamp: now,
        }

        const docRef = doc(collection(firestore, AUDIT_LOGS_COLLECTION))

        await setDoc(docRef, auditLogDoc)

        const rawAuditLog = mapAuditLogDocToRaw(docRef.id, auditLogDoc)
        return enrichAuditLog(rawAuditLog, firestore, createEnrichmentCache())
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
  const normalizedLimit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.floor(parsedLimit))
    : DEFAULT_PAGINATION.limit

  return {
    page,
    limit: Math.min(MAX_PAGE_LIMIT, normalizedLimit),
  }
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

  constraints.push(orderBy(sortField, sortDirection))
  return query(auditLogsRef, ...constraints)
}

async function fetchPaginatedAuditLogs(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number,
  firestore: Firestore
): Promise<AuditLogDTO[]> {
  const cache = createEnrichmentCache()

  if (page === 1) {
    const snapshot = await getDocs(query(baseQuery, limit(pageLimit)))
    const rawAuditLogs = snapshot.docs.map((docSnap) =>
      mapAuditLogDocToRaw(docSnap.id, docSnap.data())
    )
    return Promise.all(
      rawAuditLogs.map((rawAuditLog) => enrichAuditLog(rawAuditLog, firestore, cache))
    )
  }

  const cursor = await getPageCursor(baseQuery, page, pageLimit)
  if (!cursor) {
    return []
  }

  const pageQuery = query(baseQuery, startAfter(cursor), limit(pageLimit))
  const snapshot = await getDocs(pageQuery)
  const rawAuditLogs = snapshot.docs.map((docSnap) =>
    mapAuditLogDocToRaw(docSnap.id, docSnap.data())
  )
  return Promise.all(
    rawAuditLogs.map((rawAuditLog) => enrichAuditLog(rawAuditLog, firestore, cache))
  )
}

async function getPageCursor(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<QueryDocumentSnapshot<DocumentData> | undefined> {
  let cursor: QueryDocumentSnapshot<DocumentData> | undefined
  let remaining = (page - 1) * pageLimit

  while (remaining > 0) {
    const step = Math.min(pageLimit, remaining)
    const cursorQuery = cursor
      ? query(baseQuery, startAfter(cursor), limit(step))
      : query(baseQuery, limit(step))

    const snapshot = await getDocs(cursorQuery)
    if (snapshot.empty) {
      return undefined
    }

    cursor = snapshot.docs[snapshot.docs.length - 1]
    remaining -= snapshot.docs.length

    if (snapshot.docs.length < step) {
      return undefined
    }
  }

  return cursor
}

function mapAuditLogDocToRaw(id: string, docSnap: DocumentData): AuditLog {
  const action = requireStringField(docSnap, 'action', id)
  const targetId = requireStringField(docSnap, 'targetId', id)
  const performerId = requireStringField(docSnap, 'performerId', id)
  const timestamp = requireTimestampField(docSnap, 'timestamp', id)

  return {
    id,
    action,
    targetId,
    performerId,
    timestamp,
  }
}

async function enrichAuditLog(
  rawAuditLog: AuditLog,
  firestore: Firestore,
  cache: AuditLogEnrichmentCache
): Promise<AuditLogDTO> {
  const [target, performer] = await Promise.all([
    resolveTarget(rawAuditLog.action, rawAuditLog.targetId, firestore, cache),
    resolvePerformer(rawAuditLog.performerId, firestore, cache),
  ])

  return {
    ...rawAuditLog,
    target,
    performer,
  }
}

function createEnrichmentCache(): AuditLogEnrichmentCache {
  return {
    users: new Map<string, AuditLogTargetUserDTO | null>(),
    positions: new Map<string, AuditLogTargetPositionDTO | null>(),
  }
}

async function resolveTarget(
  action: string,
  targetId: string,
  firestore: Firestore,
  cache: AuditLogEnrichmentCache
): Promise<AuditLogTargetDTO | null> {
  const entityType = inferTargetEntityType(action)

  if (entityType === 'position') {
    const position = await getPositionById(targetId, firestore, cache)
    return position ? { type: 'position', data: position } : null
  }

  if (entityType === 'user') {
    const user = await getUserById(targetId, firestore, cache)
    return user ? { type: 'user', data: toTargetUserDTO(user) } : null
  }

  const [user, position] = await Promise.all([
    getUserById(targetId, firestore, cache),
    getPositionById(targetId, firestore, cache),
  ])

  if (user) {
    return { type: 'user', data: toTargetUserDTO(user) }
  }

  if (position) {
    return { type: 'position', data: position }
  }

  return null
}

function inferTargetEntityType(action: string): 'user' | 'position' | 'unknown' {
  const normalizedAction = action.trim().toUpperCase()

  if (normalizedAction.startsWith('POSITION_')) {
    return 'position'
  }

  if (normalizedAction.startsWith('USER_')) {
    return 'user'
  }

  return 'unknown'
}

async function resolvePerformer(
  performerId: string,
  firestore: Firestore,
  cache: AuditLogEnrichmentCache
): Promise<AuditLogPerformerDTO | null> {
  const user = await getUserById(performerId, firestore, cache)
  return user ? toPerformerDTO(user) : null
}

async function getUserById(
  userId: string,
  firestore: Firestore,
  cache: AuditLogEnrichmentCache
): Promise<AuditLogTargetUserDTO | null> {
  const cachedUser = cache.users.get(userId)
  if (cache.users.has(userId)) {
    return cachedUser ?? null
  }

  const userDocRef = doc(firestore, USERS_COLLECTION, userId)
  const userDocSnap = await getDoc(userDocRef)

  if (!userDocSnap.exists()) {
    cache.users.set(userId, null)
    return null
  }

  const mappedUser = mapUserDocToLookup(userDocSnap.id, userDocSnap.data())
  cache.users.set(userId, mappedUser)
  return mappedUser
}

async function getPositionById(
  positionId: string,
  firestore: Firestore,
  cache: AuditLogEnrichmentCache
): Promise<AuditLogTargetPositionDTO | null> {
  const cachedPosition = cache.positions.get(positionId)
  if (cache.positions.has(positionId)) {
    return cachedPosition ?? null
  }

  const positionDocRef = doc(firestore, POSITIONS_COLLECTION, positionId)
  const positionDocSnap = await getDoc(positionDocRef)

  if (!positionDocSnap.exists()) {
    cache.positions.set(positionId, null)
    return null
  }

  const mappedPosition = mapPositionDocToTarget(positionDocSnap.id, positionDocSnap.data())
  cache.positions.set(positionId, mappedPosition)
  return mappedPosition
}

function mapUserDocToLookup(id: string, docSnap: DocumentData): AuditLogTargetUserDTO | null {
  const firstName = readTrimmedString(docSnap?.firstName)
  const lastName = readTrimmedString(docSnap?.lastName)
  const email = readTrimmedString(docSnap?.email)
  const createdAt = readDateLikeValue(docSnap?.createdAt)

  if (!firstName || !lastName || !email || !createdAt) {
    return null
  }

  const positions = Array.isArray(docSnap?.positions)
    ? (docSnap.positions as UserDTO['positions'])
    : []

  return {
    id,
    firstName,
    middleName: typeof docSnap?.middleName === 'string' ? docSnap.middleName : undefined,
    lastName,
    email,
    positions,
    createdAt,
  }
}

function mapPositionDocToTarget(
  id: string,
  docSnap: DocumentData
): AuditLogTargetPositionDTO | null {
  const name = readTrimmedString(docSnap?.name)
  const abbreviation = readTrimmedString(docSnap?.abbreviation)
  const createdAt = readDateLikeValue(docSnap?.createdAt)

  if (!name || !abbreviation || !createdAt) {
    return null
  }

  const permissions = Array.isArray(docSnap?.permissions)
    ? (docSnap.permissions.filter(
        (permission: unknown): permission is string => typeof permission === 'string'
      ) as string[])
    : []

  return {
    id,
    name,
    abbreviation,
    permissions,
    createdAt,
  }
}

function toTargetUserDTO(user: AuditLogTargetUserDTO): AuditLogTargetUserDTO {
  return {
    id: user.id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
    positions: user.positions,
    createdAt: user.createdAt,
  }
}

function toPerformerDTO(user: AuditLogTargetUserDTO): AuditLogPerformerDTO {
  return {
    id: user.id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
  }
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function readDateLikeValue(value: unknown): string | null {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString()
    }
  }

  return null
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
