import { getApps, initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

function getServerFirestore() {
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID
  if (!firebaseProjectId) {
    throw new Error('Missing Firebase server configuration: FIREBASE_PROJECT_ID')
  }

  const apps = getApps()

  if (apps.length > 0) {
    return getFirestore(apps[0]!)
  }

  const app = initializeApp({ projectId: firebaseProjectId })
  return getFirestore(app)
}

export const firestore = getServerFirestore()
