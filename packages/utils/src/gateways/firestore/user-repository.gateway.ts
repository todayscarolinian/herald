/* eslint-disable no-console */
import {
  DEFAULT_PAGINATION,
  type IUserRepository,
  type UserDTO,
  type UserFilters,
  type UserSortField,
  UUID,
} from '@herald/types'
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
  type QueryDocumentSnapshot,
  setDoc,
  startAfter,
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

import { createPaginatedResult } from '../../dto.ts'

const MAX_PAGE_LIMIT = 10
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

  return {
    async findById({ id }) {
      try {
        const validatedId = validateUserId(id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          return null
        }

        return mapUserDocToDTO(docSnap.id, docSnap.data())
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

        return mapUserDocToDTO(docSnap.id, docSnap.data())
      } catch (error) {
        console.error('Error finding user by email:', error)
        throw error
      }
    },

    async findAll(params: Parameters<IUserRepository['findAll']>[0]) {
      try {
        const { page, limit: pageLimit } = normalizePagination(params.pagination)
        const sortField = validateSortField(params.sort?.field)
        const sortDirection = validateSortDirection(params.sort?.direction)

        const baseQuery = buildUserQuery(
          firestore,
          COLLECTION_NAME,
          params.filters,
          sortField,
          sortDirection
        )

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        const users = await fetchPaginatedUsers(baseQuery, page, pageLimit)

        return createPaginatedResult(users, total, {
          page,
          limit: pageLimit,
        })
      } catch (error) {
        console.error('Error finding all users:', error)
        throw error
      }
    },

    async findByPosition(/*positionId*/) {
      throw new Error('Not implemented: findByPosition')
    },

    async findByPermissions(/*permissions*/) {
      throw new Error('Not implemented: findByPermissions')
    },

    async create(params) {
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

        const userId = typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined

        const now = Timestamp.now()

        const userDoc = {
          firstName: trimmedFirstName,
          ...(typeof middleName === 'string' &&
            middleName.trim() && { middleName: middleName.trim() }),
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
        await setDoc(docRef, userDoc)

        return mapUserDocToDTO(docRef.id, userDoc)
      } catch (error) {
        console.error('Error creating user:', error)
        throw error
      }
    },

    async update(user) {
      try {
        const validatedId = validateUserId(user.id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found`)
        }

        const now = Timestamp.now()
        const updateData = {
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName ?? null,
          email: user.email,
          password: user.password,
          positions: user.positions,
          updatedAt: now,
        }

        await updateDoc(docRef, updateData)

        const updatedSnap = await getDoc(docRef)
        if (!updatedSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found after update`)
        }

        return mapUserDocToDTO(updatedSnap.id, updatedSnap.data())
      } catch (error) {
        console.error('Error updating user:', error)
        throw error
      }
    },

    async delete(params) {
      try {
        const validatedId = validateUserId(params.id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found`)
        }

        await deleteDoc(docRef)

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

    async disable(params) {
      try {
        const validatedId = validateUserId(params.id)
        const docRef = doc(firestore, COLLECTION_NAME, validatedId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          throw new Error(`User with ID "${validatedId}" not found`)
        }

        await updateDoc(docRef, {
          disabled: true,
          updatedAt: new Date().toISOString(),
        })

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
      throw new Error('Not implemented: getTotalCount')
    },

    async getPositionDistribution() {
      throw new Error('Not implemented: getPositionDistribution')
    },

    async exists(/*id*/) {
      throw new Error('Not implemented: exists')
    },

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

function validateSortField(field: unknown): UserSortField {
  const sortField = typeof field === 'string' ? field.trim() : DEFAULT_SORT_FIELD
  const allowedFields: UserSortField[] = [
    'firstName',
    'lastName',
    'email',
    'createdAt',
    'updatedAt',
  ]

  if (!allowedFields.includes(sortField as UserSortField)) {
    return DEFAULT_SORT_FIELD
  }

  return sortField as UserSortField
}

function validateSortDirection(direction: unknown): 'asc' | 'desc' {
  return direction === 'asc' ? 'asc' : DEFAULT_SORT_DIRECTION
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
  } else if (filters?.positionId) {
    constraints.push(where('positions', 'array-contains', filters.positionId))
  }

  if (Array.isArray(filters?.permissions) && filters.permissions.length > 0) {
    if (filters.permissions.length === 1) {
      constraints.push(where('permissions', 'array-contains', filters.permissions[0]))
    } else {
      constraints.push(where('permissions', 'array-contains-any', filters.permissions.slice(0, 10)))
    }
  }

  if (typeof filters?.disabled === 'boolean') {
    constraints.push(where('disabled', '==', filters.disabled))
  }

  if (typeof filters?.emailVerified === 'boolean') {
    constraints.push(where('emailVerified', '==', filters.emailVerified))
  }

  constraints.push(orderBy(sortField, sortDirection))
  return query(usersRef, ...constraints)
}

async function fetchPaginatedUsers(
  baseQuery: Query<DocumentData>,
  page: number,
  pageLimit: number
): Promise<UserDTO[]> {
  if (page === 1) {
    const snapshot = await getDocs(query(baseQuery, limit(pageLimit)))
    return snapshot.docs.map((docSnap) => mapUserDocToDTO(docSnap.id, docSnap.data()))
  }

  const cursor = await getPageCursor(baseQuery, page, pageLimit)
  if (!cursor) {
    return []
  }

  const pageQuery = query(baseQuery, startAfter(cursor), limit(pageLimit))
  const snapshot = await getDocs(pageQuery)
  return snapshot.docs.map((docSnap) => mapUserDocToDTO(docSnap.id, docSnap.data()))
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

function mapUserDocToDTO(id: string, docSnap: DocumentData): UserDTO {
  const firstName = requireStringField(docSnap, 'firstName', id)
  const lastName = requireStringField(docSnap, 'lastName', id)
  const email = requireStringField(docSnap, 'email', id)
  const positions = requirePositionsField(docSnap, id)
  const emailVerified = requireBooleanField(docSnap, 'emailVerified', id)
  const disabled = requireBooleanField(docSnap, 'disabled', id)
  const createdAt = requireTimestampField(docSnap, 'createdAt', id)
  const updatedAt = requireTimestampField(docSnap, 'updatedAt', id)

  return {
    id,
    firstName,
    middleName: typeof docSnap.middleName === 'string' ? docSnap.middleName : undefined,
    lastName,
    email,
    positions,
    emailVerified,
    disabled,
    profilePictureURL:
      typeof docSnap.profilePictureURL === 'string' ? docSnap.profilePictureURL : undefined,
    createdAt,
    updatedAt,
  }
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

function requirePositionsField(docSnap: DocumentData, userId: string): UserDTO['positions'] {
  const positions = docSnap?.positions
  if (!Array.isArray(positions)) {
    throw new Error(`Invalid or missing required user field "positions" for user ${userId}`)
  }

  return positions as UserDTO['positions']
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
