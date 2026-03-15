import 'dotenv/config'

import { initFirestore } from 'better-auth-firestore'
import { cert } from 'firebase-admin/app'
export const firestore = initFirestore({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: (String(process.env.FIREBASE_PRIVATE_KEY!) || '').replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID!,
  name: 'better-auth',
})
