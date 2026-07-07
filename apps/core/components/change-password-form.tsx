'use client'

import { isValidPassword, PASSWORD_STRENGTH_REQUIREMENTS } from '@herald/utils'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangePassword } from '@/lib/api/mutations/authMutations'

interface ChangePasswordFormProps {
  submitLabel?: string
  onSuccess?: () => void
}

export function ChangePasswordForm({
  submitLabel = 'Update Password',
  onSuccess,
}: ChangePasswordFormProps) {
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValidPassword(newPassword)) {
      toast.error(PASSWORD_STRENGTH_REQUIREMENTS)
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }

    changePassword(
      { currentPassword, newPassword, confirmPassword },
      {
        onSuccess: (res) => {
          toast.success(res.data?.message ?? 'Password changed successfully')
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="currentPassword">Current Password</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            className="text-tc_grayscale-700 hover:bg-tc_grayscale-200 absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5"
            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowCurrentPassword((v) => !v)}
          >
            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            className="text-tc_grayscale-700 hover:bg-tc_grayscale-200 absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5"
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowNewPassword((v) => !v)}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            className="text-tc_grayscale-700 hover:bg-tc_grayscale-200 absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowConfirmPassword((v) => !v)}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-1 flex justify-end">
        <Button
          type="submit"
          disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          className="bg-tc_primary-500 hover:bg-tc_primary-600 h-10 px-5 text-white"
        >
          {isChangingPassword ? 'Updating...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
