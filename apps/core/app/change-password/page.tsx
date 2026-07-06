'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { ChangePasswordForm } from '@/components/change-password-form'
import { Footer } from '@/components/shared/Footer'
import { Card } from '@/components/ui/card'

export default function ChangePasswordPage() {
  const router = useRouter()

  return (
    <div className="bg-tc_grayscale-100 flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <Card className="w-full max-w-xl px-8 py-10">
          <div className="mb-2 flex flex-col items-center gap-4 text-center">
            <Image
              src="/tc-logo-red.png"
              alt="TC"
              width={200}
              height={200}
              priority
              className="h-16 w-16"
            />

            <div className="flex flex-col items-center gap-2">
              <h1 className="text-tc_grayscale-800 text-2xl font-semibold">Change Your Password</h1>
              <p className="text-tc_grayscale-700 text-sm">
                For security, you must set a new password before continuing.
              </p>
            </div>
          </div>

          <ChangePasswordForm submitLabel="Set New Password" onSuccess={() => router.push('/')} />
        </Card>
      </main>

      <Footer />
    </div>
  )
}
