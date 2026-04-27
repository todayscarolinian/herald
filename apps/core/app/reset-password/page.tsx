import { Suspense } from 'react'

import { ResetPasswordForm } from '@/components/reset-password-form'
import { Footer } from '@/components/shared/Footer'
import { Card } from '@/components/ui/card'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordLoading() {
  return (
    <div className="bg-tc_grayscale-100 flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <Card className="text-tc_grayscale-700 w-full max-w-xl px-10 py-12 text-center">
          Loading...
        </Card>
      </main>
      <Footer />
    </div>
  )
}
