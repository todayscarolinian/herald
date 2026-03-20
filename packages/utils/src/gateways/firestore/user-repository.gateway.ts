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
        const page = Math.max(1, params.pagination?.page ?? DEFAULT_PAGINATION.page)
        const pageLimit = Math.max(1, params.pagination?.limit ?? DEFAULT_PAGINATION.limit)

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

    // Remove eslint-disable-next-line when implementing these methods and remove the _ prefix from the variable names

     
    async findByPosition(_positionId) {
      throw new Error('Not implemented: findByPosition')
    },

     
    async findByPermissions(_permissions) {
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

     
    async exists(_id) {
      throw new Error('Not implemented: exists')
    },

     
    async emailExists(_email) {
      throw new Error('Not implemented: emailExists')
    },
  }
}

function mapUserDocToDTO(id: string, docSnap: DocumentData): UserDTO {
  return {
    id,
    firstName: docSnap.firstName,
    middleName: docSnap.middleName,
    lastName: docSnap.lastName,
    email: docSnap.email,
    positions: docSnap.positions,
    emailVerified: docSnap.emailVerified,
    disabled: docSnap.disabled,
    createdAt: docSnap.createdAt,
    updatedAt: docSnap.updatedAt,
  }
}
