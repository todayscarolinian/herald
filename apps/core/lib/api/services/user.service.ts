import { createFirebaseUserRepository } from '@herald/utils'
import sharp from 'sharp'

import { getFirebaseStorageBucket } from '@/lib/api/services/firebase/admin-storage'
import { getServerFirestore } from '@/lib/api/services/firebase/firestore/server'

const VALID_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export class UserServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message)
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!VALID_MIME_TYPES.includes(file.type)) {
    throw new UserServiceError(
      'INVALID_FILE_TYPE',
      `File type "${file.type}" is not supported. Accepted types: JPEG, PNG, WEBP`
    )
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UserServiceError('FILE_TOO_LARGE', 'File must be under 5 MB')
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())

  const resizedBuffer = await sharp(rawBuffer)
    .resize(400, 400, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toBuffer()

  const bucket = getFirebaseStorageBucket()
  const firestore = getServerFirestore()
  const repo = createFirebaseUserRepository(firestore)

  return repo.uploadProfilePicture(userId, resizedBuffer, 'image/jpeg', bucket)
}
