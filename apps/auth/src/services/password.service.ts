import { firestore } from '../lib/firestore.ts'
import { emailService } from './email.service.ts'

export class PasswordService {
  async requestPasswordReset(email: string): Promise<void> {
    if (!email || typeof email !== 'string') {
      return
    }

    // check if user exists in Firestore
    const userSnapshot = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0]
      if (!userDoc) {
        return
      }
      const user = userDoc.data()

      const token = crypto.randomUUID()
      const resetUrl = `${process.env.NEXT_PUBLIC_CORE_URL}/reset-password?token=${encodeURIComponent(token)}`

      await firestore
        .collection('verification_tokens')
        .doc(token)
        .set({
          token,
          email: user.email,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // token expires in 1 hour
          type: 'password_reset',
          createdAt: new Date(),
        })

      await emailService.sendPasswordReset(user.email, resetUrl)
    }
  }
}

export const passwordService = new PasswordService()