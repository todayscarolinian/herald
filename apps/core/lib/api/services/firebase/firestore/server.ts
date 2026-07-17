import { cert, getApps, initializeApp } from 'firebase-admin/app'
import type { Firestore } from 'firebase-admin/firestore'
import { getFirestore } from 'firebase-admin/firestore'

const ADMIN_APP_NAME = 'herald-core-admin'

let firestoreInstance: Firestore | null = null

export function getServerFirestore(): Firestore {
  if (firestoreInstance) {
    return firestoreInstance
  }

  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!firebaseProjectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase server configuration: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    )
  }

  // Shares the same named app as admin-storage.ts so both Firestore and
  // Storage are backed by a single service-account-authenticated app.
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME)
  const app =
    existing ??
    initializeApp(
      {
        credential: cert({
          projectId: firebaseProjectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId: firebaseProjectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      },
      ADMIN_APP_NAME
    )

  firestoreInstance = getFirestore(app)
  firestoreInstance.settings({ ignoreUndefinedProperties: true })
  return firestoreInstance
}
