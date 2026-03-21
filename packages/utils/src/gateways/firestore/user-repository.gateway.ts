/* eslint-disable no-console */
import { DEFAULT_PAGINATION, type IUserRepository, type UserDTO } from '@herald/types'
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
  query,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  startAfter,
  where,
} from 'firebase/firestore'

import { createPaginatedResult } from '../../dto.ts'

export function createFirebaseUserRepository(firestore: Firestore): IUserRepository {
  const COLLECTION_NAME = 'users'

  return {
    async findById({ id }) {
      try {
        const docRef = doc(firestore, COLLECTION_NAME, id)
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
        const q = query(
          collection(firestore, COLLECTION_NAME),
          where('email', '==', email),
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

    async findAll(params) {
      try {
        const MAX_PAGE_LIMIT = 10

        const parsedPage = Number(params.pagination?.page)
        const page = Number.isFinite(parsedPage)
          ? Math.max(1, Math.floor(parsedPage))
          : DEFAULT_PAGINATION.page

        const parsedLimit = Number(params.pagination?.limit)
        const normalizedLimit = Number.isFinite(parsedLimit)
          ? Math.max(1, Math.floor(parsedLimit))
          : DEFAULT_PAGINATION.limit
        const pageLimit = Math.min(MAX_PAGE_LIMIT, normalizedLimit)

        const constraints: QueryConstraint[] = []

        if (params.filters?.positionId) {
          constraints.push(where('positionId', '==', params.filters.positionId))
        }

        if (params.filters?.permissions?.length) {
          if (params.filters.permissions.length === 1) {
            constraints.push(where('permissions', 'array-contains', params.filters.permissions[0]))
          } else {
            constraints.push(
              where('permissions', 'array-contains-any', params.filters.permissions.slice(0, 10))
            )
          }
        }

        const sortField = params.sort?.field ?? 'createdAt'
        const sortDirection = params.sort?.direction ?? 'desc'
        constraints.push(orderBy(sortField, sortDirection))

        const usersRef = collection(firestore, COLLECTION_NAME)
        const baseQuery = query(usersRef, ...constraints)

        const totalSnapshot = await getCountFromServer(baseQuery)
        const total = totalSnapshot.data().count

        let pageQuery = query(baseQuery, limit(pageLimit))

        if (page > 1) {
          let cursor: QueryDocumentSnapshot<DocumentData> | undefined
          let remaining = (page - 1) * pageLimit

          while (remaining > 0) {
            const step = Math.min(pageLimit, remaining)
            const cursorQuery = cursor
              ? query(baseQuery, startAfter(cursor), limit(step))
              : query(baseQuery, limit(step))

            const cursorSnapshot = await getDocs(cursorQuery)
            if (cursorSnapshot.empty) {
              break
            }

            cursor = cursorSnapshot.docs[cursorSnapshot.docs.length - 1]
            remaining -= cursorSnapshot.docs.length

            if (cursorSnapshot.docs.length < step) {
              break
            }
          }

          if (cursor) {
            pageQuery = query(baseQuery, startAfter(cursor), limit(pageLimit))
          }
        }

        const querySnapshot = await getDocs(pageQuery)

        const users: UserDTO[] = querySnapshot.docs.map((docSnap) =>
          mapUserDocToDTO(docSnap.id, docSnap.data())
        )

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

    async create() {
      throw new Error('Not implemented: create')
    },

    async update() {
      throw new Error('Not implemented: update')
    },

    async delete() {
      throw new Error('Not implemented: delete')
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
  }
}

function mapUserDocToDTO(id: string, docSnap: DocumentData): UserDTO {
  const firstName = requireStringField(docSnap, 'firstName', id)
  const lastName = requireStringField(docSnap, 'lastName', id)
  const email = requireStringField(docSnap, 'email', id)
  const positions = requirePositionsField(docSnap, id)
  const emailVerified = requireBooleanField(docSnap, 'emailVerified', id)
  const disabled = requireBooleanField(docSnap, 'disabled', id)
  const createdAt = requireStringField(docSnap, 'createdAt', id)
  const updatedAt = requireStringField(docSnap, 'updatedAt', id)

  return {
    id,
    firstName,
    middleName: typeof docSnap.middleName === 'string' ? docSnap.middleName : undefined,
    lastName,
    email,
    positions,
    emailVerified,
    disabled,
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
