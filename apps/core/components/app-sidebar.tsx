'use client'

import {
  ChartColumnIncreasing,
  ChevronsUpDown,
  LayoutDashboard,
  User,
  UserLock,
  UsersRound,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/users', icon: User, label: 'Users' },
  { href: '/positions', icon: UsersRound, label: 'Positions' },
  { href: '/permissions', icon: UserLock, label: 'Permissions' },
  { href: '/audit-logs', icon: ChartColumnIncreasing, label: 'Audit Logs' },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <div className="relative h-full">
      <Sidebar
        collapsible="icon"
        className="border-r-0"
        style={
          {
            '--sidebar-width': '16rem',
            '--sidebar-width-icon': '5rem',
          } as React.CSSProperties
        }
      >
        <div className="bg-tc_primary-500 text-tc_white flex h-full flex-col p-2 group-data-[collapsible=icon]:items-center">
          <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Image
              src="/tc-logo-white.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0"
            />
          </SidebarHeader>

          <SidebarSeparator className="bg-tc_white/30 mx-0 my-2 h-px group-data-[collapsible=icon]:w-full" />

          <SidebarContent className="flex-1 px-4 group-data-[collapsible=icon]:px-0">
            <SidebarMenu className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      className={`group/item relative flex items-center gap-3 rounded-md bg-transparent py-2 hover:bg-transparent ${isActive ? 'font-semibold' : 'font-normal'} px-0 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0`}
                    >
                      <Link
                        href={item.href}
                        className="flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center"
                      >
                        <span
                          className={`bg-tc_white absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full transition-opacity duration-150 group-data-[collapsible=icon]:left-[-8px] ${isActive ? 'opacity-100' : 'opacity-0'} `}
                        />

                        <Icon
                          className={`h-6 w-6 shrink-0 transition-all ${isActive ? 'opacity-100' : 'opacity-60 group-hover/item:opacity-100'} ml-3 group-data-[collapsible=icon]:ml-0`}
                        />

                        <span
                          className={`text-base transition-all group-data-[collapsible=icon]:hidden ${
                            isActive
                              ? 'text-tc_white font-semibold'
                              : 'text-tc_white/80 group-hover/item:text-tc_white font-normal group-hover/item:font-semibold'
                          } `}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarSeparator className="bg-tc_white/30 mx-0 my-2 h-px group-data-[collapsible=icon]:w-full" />

          <SidebarFooter className="px-4 py-4 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Account"
                  className="flex h-auto w-full items-center gap-3 rounded-lg bg-transparent px-0 py-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center hover:bg-transparent"
                >
                  <Image
                    src="/tc-logo-white.png"
                    alt="Profile"
                    width={50}
                    height={50}
                    className="ring-tc_white/30 h-10 min-h-10 w-10 min-w-10 flex-none rounded-full object-cover ring-2"
                  />

                  <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                    <span className="text-tc_white truncate text-sm font-semibold">Test User</span>
                    <span className="text-tc_white/70 truncate text-xs">testemail@gmail.com</span>
                  </div>

                  <ChevronsUpDown className="text-tc_white/70 ml-auto h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarTrigger className="absolute top-7 -right-20 h-10 w-10 bg-transparent" />
    </div>
  )
}
