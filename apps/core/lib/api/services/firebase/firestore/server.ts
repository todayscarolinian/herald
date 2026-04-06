import { getApps, initializeApp } from 'firebase/app'
import type { Firestore } from 'firebase/firestore'
import { getFirestore } from 'firebase/firestore'

let firestoreInstance: Firestore | null = null

export function getServerFirestore() {
  if (firestoreInstance) {
    return firestoreInstance
  }

  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID
  if (!firebaseProjectId) {
    throw new Error('Missing Firebase server configuration: FIREBASE_PROJECT_ID')
  }

  const apps = getApps()

  if (apps.length > 0) {
    firestoreInstance = getFirestore(apps[0]!)
    return firestoreInstance
  }

  const app = initializeApp({ projectId: firebaseProjectId })
  firestoreInstance = getFirestore(app)
  return firestoreInstance
}
