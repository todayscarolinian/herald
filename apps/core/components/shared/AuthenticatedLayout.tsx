import { AppNavigation } from '@/components/shared'
import { SidebarProvider } from '@/components/ui/sidebar'

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex w-full flex-col md:flex-row">
        <AppNavigation />
        <main className="ml-4 w-full min-w-0 flex-1">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  )
}
