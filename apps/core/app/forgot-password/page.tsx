import { Footer } from '@/components/footer'
import { ForgotPasswordForm } from '@/components/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="md:bg-tc_grayscale-100 flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full md:max-w-[550px] md:rounded-xl md:bg-white md:shadow-md">
          <ForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </div>
  )
}
