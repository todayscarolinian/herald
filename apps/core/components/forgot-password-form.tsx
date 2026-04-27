'use client'

import { forgotPasswordSchema } from '@herald/utils'
import { useForm } from '@tanstack/react-form'
import Image from 'next/image'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForgotPassword } from '@/lib/api/mutations/authMutations'

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPassword()

  const handleForgotPassword = useCallback(
    async (email: string) => {
      try {
        const response = await forgotPasswordMutation.mutateAsync({ email })
        if (response.success && response.data) {
          toast.success(response.data.message || 'Password reset email sent successfully.')
        } else {
          toast.error(response.error?.message || 'Failed to send password reset email.')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.')
      }
    },
    [forgotPasswordMutation]
  )

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: ({ value }) => handleForgotPassword(value.email),
  })

  return (
    <div className="flex min-h-[550px] w-full max-w-[550px] flex-col justify-center">
      <div className="flex w-full flex-col items-start gap-6 px-[42px] py-[52px] md:items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-16 w-16">
            <Image
              src="/tc-logo-red.png"
              alt="TC Herald logo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="w-full text-center">
            <h1 className="text-tc_accent_black-300 text-2xl font-bold">Forgot Password</h1>
            <p className="text-tc_accent_black-300 mt-1 text-base opacity-60">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="w-full space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) => {
                const result = forgotPasswordSchema.shape.email.safeParse(value)
                return result.success ? undefined : result.error.issues[0]?.message
              },
              onSubmit: ({ value }) => {
                const result = forgotPasswordSchema.shape.email.safeParse(value)
                return result.success ? undefined : result.error.issues[0]?.message
              },
            }}
          >
            {(field) => (
              <div className="flex flex-col gap-[10px]">
                <Label
                  htmlFor={field.name}
                  className="text-tc_accent_black-400 text-base font-semibold opacity-60"
                >
                  Email
                </Label>
                <Input
                  id={field.name}
                  type="email"
                  placeholder="12345678@usc.edu.ph"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="border-tc_grayscale-400 placeholder:text-tc_grayscale-600 w-full text-sm opacity-60"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-tc_error-500 text-sm">{String(field.state.meta.errors[0])}</p>
                )}
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-tc_primary-500 text-tc_white hover:bg-tc_primary-600 active:bg-tc_primary-500 h-[42px] w-full text-base font-semibold transition-colors"
              >
                {isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
