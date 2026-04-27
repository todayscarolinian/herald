'use client'
import { FileUp } from 'lucide-react'
import { ComponentPropsWithoutRef, ReactNode } from 'react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

export function ImportPositionButton({
  onCreateBulk,
  onUpdateBulk,
}: {
  onCreateBulk: () => void
  onUpdateBulk: () => void
}) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="hover:bg-accent data-[state=open]:bg-accent h-auto rounded-md p-2">
            <div className="text-muted-foreground flex flex-col items-center gap-1 p-2">
              <FileUp className="h-5 w-5" />
              <span className="font-roboto text-sm font-medium">Import</span>
            </div>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="font-roboto w-auto p-4">
            <p className="text-muted-foreground p-1 text-sm font-medium tracking-wide text-black/60 uppercase">
              Import Position List
            </p>
            <ul className="font-roboto w-full max-w-[90vw] sm:w-96">
              <ListItem
                href="#"
                title="Create Positions"
                onClick={(e) => {
                  e.preventDefault()
                  onCreateBulk()
                }}
              >
                Create multiple positions all at once via CSV upload
              </ListItem>
              <ListItem
                href="#"
                title="Update Positions"
                onClick={(e) => {
                  e.preventDefault()
                  onUpdateBulk()
                }}
              >
                Update multiple positions all at once via CSV upload
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

interface ListItemProps extends ComponentPropsWithoutRef<'li'> {
  href: string
  title: string
  children: ReactNode
}

function ListItem({ title, children, href, ...props }: ListItemProps) {
  return (
    <li {...props}>
      <NavigationMenuLink href={href}>
        <div className="font-roboto flex flex-col gap-1 rounded-md p-2 text-lg hover:bg-zinc-50">
          <div className="leading-none">{title}</div>
          <div className="text-muted-foreground line-clamp-2 text-sm">{children}</div>
        </div>
      </NavigationMenuLink>
    </li>
  )
}
