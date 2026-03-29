'use client'

import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'

import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useResetPassword } from '@/lib/api/hooks/mutations/authMutations'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-tc_grayscale-100">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <Card className="w-full max-w-xl py-12 px-10 text-center text-tc_grayscale-700">Loading...</Card>
      </main>
      <Footer />
    </div>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetPasswordMutation = useResetPassword()

  return (
    <div className="flex min-h-screen flex-col bg-tc_grayscale-100">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <Card className="w-full max-w-xl py-0">
          <div className="flex flex-col items-center gap-6 px-10 py-12 text-center">
            <Image
              src="/tc-logo-red.png"
              alt="TC"
              width={200}
              height={200}
              priority
              className="h-16 w-16"
            />

            <div className="flex flex-col items-center gap-2">
              <h1 className="text-2xl font-semibold text-tc_grayscale-800">Reset Password</h1>
              <p className="text-sm text-tc_grayscale-700">
                Your new password must be different to your old passwords.
              </p>
            </div>

            <form
              className="w-full"
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                setSuccess(null)

                if (!token) {
                  setError('Reset token is missing from this link.')
                  return
                }

                if (newPassword.length < 8) {
                  setError('Password must be at least 8 characters.')
                  return
                }

                if (newPassword !== confirmPassword) {
                  setError("Passwords don't match.")
                  return
                }

                resetPasswordMutation.mutate(
                  { token, newPassword },
                  {
                    onSuccess: (res) => {
                      setError(null)
                      setSuccess(res.data?.message ?? 'Password reset successfully')
                    },
                    onError: (err) => {
                      setError(err?.message ?? 'Something went wrong')
                    },
                  }
                )
              }}
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3">
                  <label className="text-base font-medium text-tc_grayscale-800 text-left" htmlFor="newPassword">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                      className="h-12 bg-white pr-12 text-base"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-tc_grayscale-700 hover:bg-tc_grayscale-200"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNewPassword((v) => !v)}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label
                    className="text-base font-medium text-tc_grayscale-800 text-left"
                    htmlFor="confirmPassword"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      className="h-12 bg-white pr-12 text-base"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-tc_grayscale-700 hover:bg-tc_grayscale-200"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-2 h-12 w-full rounded-md bg-tc_primary-500 text-base font-semibold hover:bg-tc_primary-400"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>

                {error ? <p className="text-base font-medium text-tc_error-600">{error}</p> : null}
                {success ? <p className="text-base font-medium text-tc_success-700">{success}</p> : null}
              </div>
            </form>
          </div>
        </Card>
      </main>

      <Footer/>
    </div>
  )
}

