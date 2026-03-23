'use client'

import { Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'

import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex min-h-screen flex-col bg-tc_grayscale-100">
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <div className="flex w-full max-w-xl flex-col items-center gap-6">
          <div className="flex items-center justify-center">
            <Image
              src="/tc-logo-red.png"
              alt="TC"
              width={200}
              height={200}
              priority
              className="h-16 w-16"
            />
          </div>

          <form
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)

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

              // UI-only for now: keep the payload shape aligned with the backend.
              // Later we can wire this to an API helper/mutation.
              // eslint-disable-next-line no-console
              console.log('reset-password payload', { token, newPassword })
            }}
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                <label className="text-base font-medium text-tc_grayscale-800" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="h-12 bg-white pr-12 text-lg"
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
                  className="text-base font-medium text-tc_grayscale-800"
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
                    autoComplete="new-password"
                    className="h-12 bg-white pr-12 text-lg"
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
              >
                Submit
              </Button>

              {error ? <p className="text-base font-medium text-tc_error-600">{error}</p> : null}
            </div>
          </form>
        </div>
      </main>

      <Footer/>
    </div>
  )
}

