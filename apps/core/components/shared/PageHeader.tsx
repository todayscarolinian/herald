import { Bell } from 'lucide-react'

import { SidebarTrigger } from '@/components/ui/sidebar'

interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="border-tc_grayscale-200 bg-tc_white flex h-18.5 flex-none items-center justify-between border-b pr-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="hidden h-10 w-10 bg-transparent md:flex" />
        <div className="flex flex-col leading-tight">
          <span className="text-tc_grayscale-600 dark:text-tc_grayscale-400 font-roboto-condensed text-[11px] font-semibold tracking-[0.16em] uppercase">
            Admin Console
          </span>
          <span className="text-tc_black dark:text-tc_white text-[22px] font-bold tracking-tight">
            {title}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className="border-tc_grayscale-200 bg-tc_white relative flex size-[38px] flex-none items-center justify-center rounded-full border dark:border-white/10 dark:bg-white/5"
        >
          <Bell className="text-tc_grayscale-700 dark:text-tc_grayscale-300 size-5" />
          <span className="bg-tc_primary-500 absolute top-[7px] right-[8px] size-2 rounded-full ring-2 ring-white dark:ring-black" />
        </button>
      </div>
    </header>
  )
}
