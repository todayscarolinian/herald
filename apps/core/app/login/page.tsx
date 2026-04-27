import { Suspense } from 'react'

import { LoginForm } from '@/components/login-form'
import { Footer } from '@/components/shared/Footer'

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <div className="md:bg-tc_grayscale-100 flex min-h-screen flex-col bg-white">
        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full md:max-w-[550px] md:rounded-xl md:bg-white md:shadow-md">
            <LoginForm />
          </div>
        </main>
        <Footer />
      </div>
    </Suspense>
  )
}

function LoginLoading() {
  return (
    <div className="bg-tc_grayscale-100 flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <div className="text-tc_grayscale-700 w-full max-w-xl px-10 py-12 text-center">
          Loading...
        </div>
      </main>
      <Footer />
    </div>
  )
}
