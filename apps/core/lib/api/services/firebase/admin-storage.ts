import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'

const ADMIN_APP_NAME = 'herald-core-admin'

export function getFirebaseStorageBucket() {
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME)

  const app =
    existing ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
      },
      ADMIN_APP_NAME
    )

  return getStorage(app).bucket()
}
