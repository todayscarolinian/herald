import type { Metadata } from 'next'

import { AppNavigation } from '@/components/shared'
import { SidebarProvider } from '@/components/ui/sidebar'

export const metadata: Metadata = {
  title: "Herald | Today's Carolinian",
  description:
    "Today's Carolinian identity control center for users, roles, permissions, and audit history.",
}

export default function UsersLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <main className="bg-tc_grayscale-100 dark:bg-tc_black flex w-full min-w-0 flex-col md:flex-row">
        <AppNavigation />
        <div className="w-full min-w-0 pl-4">{children}</div>
      </main>
    </SidebarProvider>
  )
}
