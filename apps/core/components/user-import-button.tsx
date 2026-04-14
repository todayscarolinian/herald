'use client'

import { FileUp } from 'lucide-react'
import * as React from 'react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

export function ImportButton() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="hover:bg-accent data-[state=open]:bg-accent h-auto rounded-md p-2">
            <div className="text-muted-foreground flex flex-col items-center gap-1 p-2">
              <FileUp className="h-5 w-5" />
              <span className="text-sm font-medium">Import</span>
            </div>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="w-auto p-4">
            <p className="text-muted-foreground p-1 text-sm font-medium tracking-wide uppercase">
              Import User List
            </p>
            <ul className="w-96">
              <ListItem href="/docs" title="Create Users">
                Create multiple users all at once via CSV upload
              </ListItem>
              <ListItem href="/docs/installation" title="Update Users">
                Update multiple users all at once via CSV upload
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink href={href}>
        <div className="flex flex-col gap-1 text-sm">
          <div className="leading-none font-medium">{title}</div>
          <div className="text-muted-foreground line-clamp-2">{children}</div>
        </div>
      </NavigationMenuLink>
    </li>
  )
}
