import { firestore } from '../lib/firestore.ts'

type UserRecord = Record<string, unknown> | undefined

export class UserRepository {
  async findById(userId: string): Promise<UserRecord> {
    const userDoc = await firestore.collection('users').doc(userId).get()
    return userDoc.data() as UserRecord
  }

  async markWelcomeEmailSent(userId: string): Promise<void> {
    await firestore.collection('users').doc(userId).set({ welcomeEmailSent: true }, { merge: true })
  }
}

export const userRepository = new UserRepository()
