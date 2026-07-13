/* eslint-disable no-console */
import {
  DEFAULT_PAGINATION,
  type Domain,
  type IUserRepository,
  type Position,
  type UserDTO,
  type UserFilters,
  type UserSortField,
  UUID,
} from '@herald/types'
import type { AuditLogTargetSnapshot } from '@herald/types/auditLog'
import {
  collection,
  deleteDoc,
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
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import type { Firestore as AdminFirestore } from 'firebase-admin/firestore'
// Structural type for the Firebase Admin Storage bucket — avoids a direct
// dependency on @google-cloud/storage while remaining compatible with it.
type StorageFile = {
  save(data: Buffer, options?: { metadata?: { contentType?: string } }): Promise<void>
  makePublic(): Promise<unknown>
  publicUrl(): string
  delete(): Promise<unknown>
}
type StorageBucket = { file(path: string): StorageFile }

import { buildPositionSnapshots, createAuditLogService } from '../../audit-log/index.ts'
import { createPaginatedResult } from '../../dto.ts'
import { fetchPaginatedDocs } from './pagination.ts'

const DEFAULT_SORT_FIELD: UserSortField = 'createdAt'
const DEFAULT_SORT_DIRECTION = 'desc'

type AuthUserRecord = {
  id: UUID
  firstName: string
  middleName?: string
  lastName: string
  email: string
  disabled: boolean
}

// Intermediate representation with position IDs before enrichment
type RawUserDoc = Omit<UserDTO, 'positions'> & { positionIds: string[] }

export function createAdminFirebaseUserRepository(firestore: AdminFirestore) {
  const COLLECTION_NAME = 'users'

  return {
    async findById(userId: string): Promise<AuthUserRecord | null> {
      const validatedId = validateUserId(userId)
      const docSnap = await firestore.collection(COLLECTION_NAME).doc(validatedId).get()
      if (!docSnap.exists) {
        return null
      }

      return {
        id: docSnap.id,
        firstName: docSnap.get('firstName'),
        middleName: docSnap.get('middleName') || undefined,
        lastName: docSnap.get('lastName'),
        email: docSnap.get('email'),
        disabled: docSnap.get('disabled') || false,
      }
    },

    async findByEmail(email: string): Promise<AuthUserRecord | null> {
      const validatedEmail = validateEmail(email)

      const querySnap = await firestore
        .collection(COLLECTION_NAME)
        .where('email', '==', validatedEmail)
        .limit(1)
        .get()

      if (querySnap.empty) {
        return null
      }

      const docSnap = querySnap.docs[0]

      if (!docSnap || !docSnap.exists) {
        return null
      }

      return {
        id: docSnap.id,
        firstName: docSnap.get('firstName'),
        middleName: docSnap.get('middleName') || undefined,
        lastName: docSnap.get('lastName'),
        email: docSnap.get('email'),
        disabled: docSnap.get('disabled') || false,
      }
    },
  }
}

type UploadProfilePicture = {
  uploadProfilePicture(
    userId: string,
    imageBuffer: Buffer,
    contentType: string,
    bucket: StorageBucket
  ): Promise<string>
}

export function createFirebaseUserRepository(
  firestore: Firestore
): IUserRepository & UploadProfilePicture {
  const COLLECTION_NAME = 'users'
  const SESSIONS_COLLECTION = 'sessions'
  const ACCOUNTS_COLLECTION = 'accounts'
  const POSITIONS_COLLECTION = 'positions'

  return {
    async findById({ id }) {
      try {
        const validatedId = validateUserId(id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          return null
        }

        const positionIds = extractPositionIds(docSnap.data(), validatedId)
        const positionsMap = await buildPositionsMap(firestore, POSITIONS_COLLECTION, positionIds)
        return rawToDTO(mapRawUserDoc(docSnap.id, docSnap.data()), positionsMap)
      } catch (error) {
        console.error('Error finding user by ID:', error)
        throw error
      }
    },

    async findByEmail({ email }) {
      try {
        const validatedEmail = validateEmail(email)
        const q = query(
          collection(firestore, COLLECTION_NAME),
          where('email', '==', validatedEmail),
          limit(1)
        )
        const querySnapshot = await getDocs(q)

        if (querySnapshot.empty) {
          return null
        }

        const docSnap = querySnapshot.docs[0]
        if (!docSnap || !docSnap.exists()) {
          return null
        }

        const positionIds = extractPositionIds(docSnap.data(), docSnap.id)
        const positionsMap = await buildPositionsMap(firestore, POSITIONS_COLLECTION, positionIds)
        return rawToDTO(mapRawUserDoc(docSnap.id, docSnap.data()), positionsMap)
      } catch (error) {
        console.error('Error finding user by email:', error)
        throw error
      }
    },

    async findAll(params) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const search = normalizeSearchTerm(params.filters?.search)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)
        const baseQuery = buildUserQuery(
          firestore,
          COLLECTION_NAME,
          params.filters,
          sortField,
          sortDirection
        )

        if (search) {
          const { users, total } = await fetchSearchUsers(
            firestore,
            POSITIONS_COLLECTION,
            baseQuery,
            search,
            page,
            pageLimit
          )
          return createPaginatedResult(users, total, { page, limit: pageLimit })
        }

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        const rawUsers = await fetchPaginatedUsers(baseQuery, page, pageLimit)
        const allPositionIds = [...new Set(rawUsers.flatMap((u) => u.positionIds))]
        const positionsMap = await buildPositionsMap(
          firestore,
          POSITIONS_COLLECTION,
          allPositionIds
        )
        const users = rawUsers.map((raw) => rawToDTO(raw, positionsMap))

        return createPaginatedResult(users, total, { page, limit: pageLimit })
      } catch (error) {
        console.error('Error finding all users:', error)
        throw error
      }
    },

    // Intentionally unimplemented: part of the IUserRepository port contract
    // but has zero callers anywhere in apps/auth or apps/core as of writing.
    async findByPosition(/*positionId*/) {
      throw new Error('Not implemented: findByPosition')
    },

    async create(params, performedById) {
      try {
        const { id, firstName, middleName, lastName, email, positions } = params

        const validatedEmail = validateEmail(email)
        const trimmedFirstName = firstName?.trim()
        const trimmedLastName = lastName?.trim()

        if (!trimmedFirstName) {
          throw new TypeError('Invalid input: "firstName" is required')
        }

        if (!trimmedLastName) {
          throw new TypeError('Invalid input: "lastName" is required')
        }

        if (!Array.isArray(positions)) {
          throw new TypeError('Invalid input: "positions" must be an array')
        }

        const userId = validateUserId(id)
        const validatedCreatedById = validateUserId(performedById)

        const now = Timestamp.now()
        const trimmedMiddleName = typeof middleName === 'string' ? middleName.trim() : undefined
        const derivedName = [trimmedFirstName, trimmedMiddleName, trimmedLastName]
          .filter(Boolean)
          .join(' ')

        const userDoc = {
          name: derivedName,
          firstName: trimmedFirstName,
          ...(trimmedMiddleName && { middleName: trimmedMiddleName }),
          lastName: trimmedLastName,
          email: validatedEmail,
          positions,
          emailVerified: false,
          disabled: false,
          createdAt: now,
          updatedAt: now,
        }

        const docRef = userId
          ? doc(firestore, COLLECTION_NAME, userId)
          : doc(collection(firestore, COLLECTION_NAME))
        await setDoc(docRef, userDoc, { merge: true })

        const positionsMap = await buildPositionsMap(firestore, POSITIONS_COLLECTION, positions)

        const targetSnapshot: AuditLogTargetSnapshot = {
          type: 'user',
          data: {
            id: docRef.id,
            firstName: trimmedFirstName,
            middleName: trimmedMiddleName,
            lastName: trimmedLastName,
            email: validatedEmail,
            positions: buildPositionSnapshots(positions, positionsMap),
            createdAt: now.toDate().toISOString(),
          },
        }
        createAuditLogService(firestore).log('USER_CREATED', targetSnapshot, validatedCreatedById)

        return rawToDTO(mapRawUserDoc(docRef.id, userDoc), positionsMap)
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      }
    },

    async update(user, performedById) {
      try {
        const validatedId = validateUserId(user.id)
        const validatedUpdatedById = validateUserId(performedById)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found`)
        }

        const now = Timestamp.now()
        const derivedName = [user.firstName, user.middleName, user.lastName]
          .filter(Boolean)
          .join(' ')
        const previousPositionIds = extractPositionIds(docSnap.data(), validatedId)
        const positionsChanged =
          previousPositionIds.length !== user.positions.length ||
          !previousPositionIds.every((positionId) => user.positions.includes(positionId))
        const updateData = {
          name: derivedName,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName ?? null,
          email: user.email,
          positions: user.positions,
          updatedAt: now,
        }

        await updateDoc(docRef, updateData)

        const updatedSnap = await getDoc(docRef)
        if (!updatedSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found after update`)
        }

        const positionsMap = await buildPositionsMap(
          firestore,
          POSITIONS_COLLECTION,
          user.positions
        )

        const updatedData = updatedSnap.data()
        const targetSnapshot: AuditLogTargetSnapshot = {
          type: 'user',
          data: {
            id: docRef.id,
            firstName: typeof updatedData?.firstName === 'string' ? updatedData.firstName : '',
            middleName:
              typeof updatedData?.middleName === 'string' ? updatedData.middleName : undefined,
            lastName: typeof updatedData?.lastName === 'string' ? updatedData.lastName : '',
            email: typeof updatedData?.email === 'string' ? updatedData.email : '',
            positions: buildPositionSnapshots(user.positions, positionsMap),
            createdAt:
              updatedData?.createdAt instanceof Timestamp
                ? updatedData.createdAt.toDate().toISOString()
                : '',
          },
        }
        createAuditLogService(firestore).log(
          positionsChanged ? 'USER_POSITIONS_CHANGED' : 'USER_UPDATED',
          targetSnapshot,
          validatedUpdatedById
        )

        return rawToDTO(mapRawUserDoc(updatedSnap.id, updatedSnap.data()), positionsMap)
      } catch (error) {
        console.error('Error updating user:', error)
        throw error
      }
    },

    async delete(params, performedById) {
      try {
        const validatedId = validateUserId(params.id)
        const validatedDeletedById = validateUserId(performedById)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found`)
        }

        const deleteData = docSnap.data()
        const deletePositionIds = extractPositionIds(deleteData, validatedId)
        const deletePositionsMap = await buildPositionsMap(
          firestore,
          POSITIONS_COLLECTION,
          deletePositionIds
        )
        const deleteTargetSnapshot: AuditLogTargetSnapshot = {
          type: 'user',
          data: {
            id: docRef.id,
            firstName: typeof deleteData?.firstName === 'string' ? deleteData.firstName : '',
            middleName:
              typeof deleteData?.middleName === 'string' ? deleteData.middleName : undefined,
            lastName: typeof deleteData?.lastName === 'string' ? deleteData.lastName : '',
            email: typeof deleteData?.email === 'string' ? deleteData.email : '',
            positions: buildPositionSnapshots(deletePositionIds, deletePositionsMap),
            createdAt:
              deleteData?.createdAt instanceof Timestamp
                ? deleteData.createdAt.toDate().toISOString()
                : '',
          },
        }
        await deleteDoc(docRef)

        createAuditLogService(firestore).log(
          'USER_DELETED',
          deleteTargetSnapshot,
          validatedDeletedById
        )

        const sessionsQuery = query(
          collection(firestore, SESSIONS_COLLECTION),
          where('userId', '==', validatedId)
        )
        const sessionsSnapshot = await getDocs(sessionsQuery)

        const deletePromises = sessionsSnapshot.docs.map((sessionDoc) => deleteDoc(sessionDoc.ref))

        const accountsQuery = query(
          collection(firestore, ACCOUNTS_COLLECTION),
          where('userId', '==', validatedId)
        )
        const accountsSnapshot = await getDocs(accountsQuery)

        deletePromises.push(...accountsSnapshot.docs.map((accountDoc) => deleteDoc(accountDoc.ref)))

        await Promise.all(deletePromises)
      } catch (error) {
        console.error('Error deleting user:', error)
        throw error
      }
    },

    async disable(params, performedById) {
      try {
        const validatedId = validateUserId(params.id)
        const validatedDisabledById = validateUserId(performedById)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found`)
        }

        const disableData = docSnap.data()
        const disablePositionIds = extractPositionIds(disableData, validatedId)
        const disablePositionsMap = await buildPositionsMap(
          firestore,
          POSITIONS_COLLECTION,
          disablePositionIds
        )
        const disableTargetSnapshot: AuditLogTargetSnapshot = {
          type: 'user',
          data: {
            id: docRef.id,
            firstName: typeof disableData?.firstName === 'string' ? disableData.firstName : '',
            middleName:
              typeof disableData?.middleName === 'string' ? disableData.middleName : undefined,
            lastName: typeof disableData?.lastName === 'string' ? disableData.lastName : '',
            email: typeof disableData?.email === 'string' ? disableData.email : '',
            positions: buildPositionSnapshots(disablePositionIds, disablePositionsMap),
            createdAt:
              disableData?.createdAt instanceof Timestamp
                ? disableData.createdAt.toDate().toISOString()
                : '',
          },
        }
        await updateDoc(docRef, {
          disabled: true,
          updatedAt: Timestamp.now(),
        })

        createAuditLogService(firestore).log(
          'USER_DISABLED',
          disableTargetSnapshot,
          validatedDisabledById
        )

        const sessionsQuery = query(
          collection(firestore, SESSIONS_COLLECTION),
          where('userId', '==', validatedId)
        )
        const sessionsSnapshot = await getDocs(sessionsQuery)

        const deletePromises = sessionsSnapshot.docs.map((sessionDoc) => deleteDoc(sessionDoc.ref))
        await Promise.all(deletePromises)
      } catch (error) {
        console.error('Error disabling user:', error)
        throw error
      }
    },

    async getTotalCount() {
      try {
        const collectionRef = collection(firestore, COLLECTION_NAME)
        const snapshot = await getCountFromServer(collectionRef)
        return { totalUsers: snapshot.data().count }
      } catch (error) {
        console.error('Error getting total user count:', error)
        throw error
      }
    },

    // Intentionally unimplemented: part of the IUserRepository port contract
    // but has zero callers anywhere in apps/auth or apps/core as of writing.
    async getPositionDistribution() {
      throw new Error('Not implemented: getPositionDistribution')
    },

    // Intentionally unimplemented: part of the IUserRepository port contract
    // but has zero callers anywhere in apps/auth or apps/core as of writing.
    async exists(/*id*/) {
      throw new Error('Not implemented: exists')
    },

    // Intentionally unimplemented: part of the IUserRepository port contract
    // but has zero callers anywhere in apps/auth or apps/core as of writing.
    async emailExists(/*email*/) {
      throw new Error('Not implemented: emailExists')
    },

    async uploadProfilePicture(
      userId: string,
      imageBuffer: Buffer,
      contentType: string,
      bucket: StorageBucket
    ): Promise<string> {
      try {
        const validatedId = validateUserId(userId)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found`)
        }

        const previousUrl: string | undefined = docSnap.data()?.profilePictureURL

        const filePath = `users/${validatedId}/avatar.jpg`
        const file = bucket.file(filePath)
        await file.save(imageBuffer, { metadata: { contentType } })
        await file.makePublic()
        const publicUrl = file.publicUrl()

        await updateDoc(docRef, {
          profilePictureURL: publicUrl,
          updatedAt: Timestamp.now(),
        })

        if (previousUrl) {
          try {
            const url = new URL(previousUrl)
            const oldPath = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] ?? '')
            if (oldPath && oldPath !== filePath) {
              await bucket.file(oldPath).delete()
            }
          } catch {
            console.error(
              `[uploadProfilePicture] Failed to delete old image for user ${validatedId}`
            )
          }
        }

        return publicUrl
      } catch (error) {
        console.error('Error uploading profile picture:', error)
        throw error
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Position enrichment helpers
// ---------------------------------------------------------------------------

function mapPositionDocToPosition(id: string, data: DocumentData): Position {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : '',
    abbreviation: typeof data.abbreviation === 'string' ? data.abbreviation : '',
    domains: Array.isArray(data.domains) ? (data.domains as Domain[]) : [],
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : '',
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : '',
  }
}

async function buildPositionsMap(
  firestore: Firestore,
  positionsCollection: string,
  positionIds: string[]
): Promise<Record<string, Position>> {
  if (positionIds.length === 0) {
    return {}
  }

  const uniqueIds = [...new Set(positionIds)]
  const positionDocs = await Promise.all(
    uniqueIds.map((id) => getDoc(doc(firestore, positionsCollection, id)))
  )

  const map: Record<string, Position> = {}
  for (const docSnap of positionDocs) {
    if (docSnap.exists()) {
      map[docSnap.id] = mapPositionDocToPosition(docSnap.id, docSnap.data())
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// User doc mapping
// ---------------------------------------------------------------------------

// Handles both legacy full-object entries and new string-ID entries gracefully
function extractPositionIds(docSnap: DocumentData, userId: string): string[] {
  const positions = docSnap?.positions
  if (!Array.isArray(positions)) {
    throw new Error(`Invalid or missing required user field "positions" for user ${userId}`)
  }
  return positions.map((p) => {
    if (typeof p === 'string') {
      return p
    }
    if (typeof p?.id === 'string') {
      return p.id
    }
    throw new Error(`Invalid position entry in user document ${userId}`)
  })
}

function mapRawUserDoc(id: string, docSnap: DocumentData): RawUserDoc {
  const name = requireStringField(docSnap, 'name', id)
  const firstName = requireStringField(docSnap, 'firstName', id)
  const lastName = requireStringField(docSnap, 'lastName', id)
  const email = requireStringField(docSnap, 'email', id)
  const positionIds = extractPositionIds(docSnap, id)
  const emailVerified = requireBooleanField(docSnap, 'emailVerified', id)
  const disabled = requireBooleanField(docSnap, 'disabled', id)
  const createdAt = requireTimestampField(docSnap, 'createdAt', id)
  const updatedAt = requireTimestampField(docSnap, 'updatedAt', id)

  return {
    id,
    name,
    firstName,
    middleName: typeof docSnap.middleName === 'string' ? docSnap.middleName : undefined,
    lastName,
    email,
    positionIds,
    emailVerified,
    disabled,
    profilePictureURL:
      typeof docSnap.profilePictureURL === 'string' ? docSnap.profilePictureURL : undefined,
    createdAt,
    updatedAt,
  }
}

function rawToDTO(raw: RawUserDoc, positionsMap: Record<string, Position>): UserDTO {
  const { positionIds, ...rest } = raw
  return {
    ...rest,
    positions: positionIds.map((id) => positionsMap[id]).filter((p): p is Position => !!p),
  }
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

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

function validateSortField(field: unknown): UserSortField {
  const sortField = typeof field === 'string' ? field.trim() : DEFAULT_SORT_FIELD
  const allowedFields: UserSortField[] = ['name', 'email', 'createdAt', 'updatedAt']

  if (!allowedFields.includes(sortField as UserSortField)) {
    return DEFAULT_SORT_FIELD
  }

  return sortField as UserSortField
}

function validateSortDirection(direction: unknown): 'asc' | 'desc' {
  return direction === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION
}

function normalizeSearchTerm(search: unknown): string | undefined {
  if (typeof search !== 'string') {
    return undefined
  }

  const normalizedSearch = search.trim().toLowerCase()
  return normalizedSearch.length > 0 ? normalizedSearch : undefined
}

function buildUserQuery(
  firestore: Firestore,
  collectionName: string,
  filters: UserFilters | undefined,
  sortField: UserSortField,
  sortDirection: 'asc' | 'desc'
): Query<DocumentData> {
  const constraints: QueryConstraint[] = []
  const usersRef = collection(firestore, collectionName)

  if (filters?.positionIds?.length) {
    constraints.push(where('positions', 'array-contains-any', filters.positionIds.slice(0, 10)))
  }

  if (typeof filters?.disabled === 'boolean') {
    constraints.push(where('disabled', '==', filters.disabled))
  }

  if (typeof filters?.emailVerified === 'boolean') {
    constraints.push(where('emailVerified', '==', filters.emailVerified))
  }

  if (filters?.createdAfter) {
    constraints.push(where('createdAt', '>=', Timestamp.fromDate(new Date(filters.createdAfter))))
  }

  constraints.push(orderBy(sortField, sortDirection))
  return query(usersRef, ...constraints)
}

async function fetchPaginatedUsers(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<RawUserDoc[]> {
  const docs = await fetchPaginatedDocs(baseQuery, page, pageLimit)
  return docs.map((docSnap) => mapRawUserDoc(docSnap.id, docSnap.data()))
}

async function fetchSearchUsers(
  firestore: Firestore,
  positionsCollection: string,
  baseQuery: Query<DocumentData>,
  search: string,
  page: number,
  pageLimit: number
): Promise<{ users: UserDTO[]; total: number }> {
  const snapshot = await getDocs(baseQuery)
  const matchingRaw = snapshot.docs
    .map((docSnap) => mapRawUserDoc(docSnap.id, docSnap.data()))
    .filter((raw) => matchesSearch(raw, search))

  const startIndex = (page - 1) * pageLimit
  const pageRaw = matchingRaw.slice(startIndex, startIndex + pageLimit)

  const allPositionIds = [...new Set(pageRaw.flatMap((u) => u.positionIds))]
  const positionsMap = await buildPositionsMap(firestore, positionsCollection, allPositionIds)

  return {
    users: pageRaw.map((raw) => rawToDTO(raw, positionsMap)),
    total: matchingRaw.length,
  }
}

// ---------------------------------------------------------------------------
// Field validators
// ---------------------------------------------------------------------------

function matchesSearch(user: RawUserDoc, search: string): boolean {
  const firstName = user.firstName.toLowerCase()
  const middleName = user.middleName?.toLowerCase() ?? ''
  const lastName = user.lastName.toLowerCase()
  const email = user.email.toLowerCase()
  const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim()

  return (
    firstName.includes(search) ||
    middleName.includes(search) ||
    lastName.includes(search) ||
    email.includes(search) ||
    fullName.includes(search)
  )
}

function requireStringField(docSnap: DocumentData, field: string, userId: string): string {
  const value = docSnap?.[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid or missing required user field "${field}" for user ${userId}`)
  }

  return value
}

function requireBooleanField(docSnap: DocumentData, field: string, userId: string): boolean {
  const value = docSnap?.[field]
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid or missing required user field "${field}" for user ${userId}`)
  }

  return value
}

function requireTimestampField(docSnap: DocumentData, field: string, userId: string): string {
  const value = docSnap?.[field]
  if (!(value instanceof Timestamp)) {
    throw new Error(`Invalid or missing required user field "${field}" for user ${userId}`)
  }

  return value.toDate().toISOString()
}

function validateUserId(id: unknown): string {
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

function validateEmail(email: unknown): string {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (typeof email !== 'string') {
    throw new TypeError('Invalid findByEmail input: "email" must be a string')
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail.length === 0) {
    throw new TypeError('Invalid findByEmail input: "email" cannot be empty')
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new TypeError('Invalid findByEmail input: "email" must be a valid email address')
  }

  return normalizedEmail
}
