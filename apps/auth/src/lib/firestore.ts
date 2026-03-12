import 'dotenv/config'

import { betterAuth } from 'better-auth'
import { firestoreAdapter, initFirestore } from 'better-auth-firestore'
import { cert } from 'firebase-admin/app'
export const firestore = initFirestore({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  }),
  projectId: process.env.FIREBASE_PROJECT_ID!,
  name: 'better-auth',
})

export const auth = betterAuth({
  database: firestoreAdapter({
    firestore,
    namingStrategy: 'default',
    collections: {
      // users: "users",
      // sessions: "sessions",
      // accounts: "accounts",
      // verificationTokens: "verificationTokens",
    },
  }),
})
