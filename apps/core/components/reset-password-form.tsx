'use client'

import { isValidPassword, PASSWORD_STRENGTH_REQUIREMENTS } from '@herald/utils'
import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useResetPassword } from '@/lib/api/hooks/mutations/authMutations'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetPasswordMutation = useResetPassword()

  const router = useRouter()

  if (!token) {
    return (
      <div className="bg-tc_grayscale-100 flex min-h-screen flex-col">
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-14">
          <Card className="text-tc_grayscale-700 w-full max-w-xl px-10 py-12 text-center">
            <p className="text-base font-medium">Reset token is missing from this link.</p>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="bg-tc_grayscale-100 flex min-h-screen flex-col">
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
              <h1 className="text-tc_grayscale-800 text-2xl font-semibold">Reset Password</h1>
              <p className="text-tc_grayscale-700 text-sm">
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

                if (!isValidPassword(newPassword)) {
                  setError(PASSWORD_STRENGTH_REQUIREMENTS)
                  return
                }

                if (newPassword !== confirmPassword) {
                  setError("Passwords don't match.")
                  return
                }

                resetPasswordMutation.mutate(
                  { token, newPassword, confirmPassword },
                  {
                    onSuccess: (res) => {
                      setError(null)
                      setSuccess(res.data?.message ?? 'Password reset successfully')

                      setTimeout(() => {
                        router.push('/login')
                      }, 2000)
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
                  <label
                    className="text-tc_grayscale-800 text-left text-base font-medium"
                    htmlFor="newPassword"
                  >
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
                      className="text-tc_grayscale-700 hover:bg-tc_grayscale-200 absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNewPassword((v) => !v)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <label
                    className="text-tc_grayscale-800 text-left text-base font-medium"
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
                      className="text-tc_grayscale-700 hover:bg-tc_grayscale-200 absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-2"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="bg-tc_primary-500 hover:bg-tc_primary-400 mt-2 h-12 w-full rounded-md text-base font-semibold"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>

                {error ? <p className="text-tc_error-600 text-base font-medium">{error}</p> : null}
                {success ? (
                  <p className="text-tc_success-700 text-base font-medium">{success}</p>
                ) : null}
              </div>
            </form>
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
