'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { ChangePasswordForm } from '@/components/change-password-form'
import { PageHeader } from '@/components/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateProfile } from '@/lib/api/mutations/userMutations'
import { useMyProfile } from '@/lib/api/queries/userQueries'
import { useSession } from '@/lib/auth-client'
import { formatDate } from '@/lib/utils'

export default function ProfilePage() {
  const { refetch: refetchSession } = useSession()
  const { data: profileRes, isLoading } = useMyProfile()
  const user = profileRes?.data

  const { mutate: updateProfile, isPending: isSavingName } = useUpdateProfile()

  const [form, setForm] = useState({ firstName: '', middleName: '', lastName: '' })
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null)
  const [touched, setTouched] = useState({ firstName: false, lastName: false })

  if (user && user.id !== loadedUserId) {
    setLoadedUserId(user.id)
    setForm({
      firstName: user.firstName,
      middleName: user.middleName ?? '',
      lastName: user.lastName,
    })
  }

  const firstNameError = touched.firstName && form.firstName.trim() === ''
  const lastNameError = touched.lastName && form.lastName.trim() === ''
  const isNameFormValid = form.firstName.trim() !== '' && form.lastName.trim() !== ''

  const handleSaveName = () => {
    if (!isNameFormValid) {
      return
    }

    updateProfile(
      {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
      },
      {
        onSuccess: () => {
          toast.success('Profile updated successfully')
          void refetchSession()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <main className="text-tc_black dark:text-tc_white flex min-h-screen w-full min-w-0 flex-col">
      <PageHeader title="Profile" />

      <div className="flex flex-1 flex-col gap-6 p-8 pb-10">
        {isLoading || !user ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-40 w-full max-w-2xl" />
            <Skeleton className="h-64 w-full max-w-2xl" />
            <Skeleton className="h-64 w-full max-w-2xl" />
          </div>
        ) : (
          <div className="flex max-w-2xl flex-col gap-6">
            {/* Name fields */}
            <Card className="gap-5 px-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-[15.5px] font-semibold">Personal Information</span>
                <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 text-[13px]">
                  {user.name}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className={firstNameError ? 'border-red-500' : ''}
                    value={form.firstName}
                    onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Middle Name</Label>
                  <Input
                    value={form.middleName}
                    onChange={(e) => setForm((prev) => ({ ...prev, middleName: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className={lastNameError ? 'border-red-500' : ''}
                    value={form.lastName}
                    onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Positions</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {user.positions.length === 0 ? (
                      <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 text-[13px]">
                        No positions assigned
                      </span>
                    ) : (
                      user.positions.map((position) => (
                        <Badge key={position.id} variant="secondary">
                          {position.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Member Since</Label>
                  <span className="text-tc_grayscale-700 dark:text-tc_grayscale-400 text-[13.5px]">
                    {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>

              <div className="mt-1 flex justify-end">
                <Button
                  type="button"
                  disabled={!isNameFormValid || isSavingName}
                  onClick={handleSaveName}
                  className="bg-tc_primary-500 hover:bg-tc_primary-600 h-10 px-5 text-white"
                >
                  {isSavingName ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Card>

            {/* Change password */}
            <Card className="gap-5 px-6">
              <span className="text-[15.5px] font-semibold">Change Password</span>
              <ChangePasswordForm />
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
