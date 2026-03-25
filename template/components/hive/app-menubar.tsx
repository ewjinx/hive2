"use client"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
} from "@/components/ui/menubar"

function ThemeToggleItem() {
  return (
    <MenubarItem
      onSelect={() => {
        const html = document.documentElement
        html.classList.toggle("dark")
      }}
    >
      Toggle Theme
      <span className="ml-auto text-muted-foreground">Ctrl+T</span>
    </MenubarItem>
  )
}

export function AppMenubar() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full">
        <Menubar className="h-8 rounded-none border-0 px-2">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New Job</MenubarItem>
              <MenubarItem>Open Workspace</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <ThemeToggleItem />
              <MenubarItem>Toggle Sidebar</MenubarItem>
              <MenubarSeparator />
              <MenubarLabel>Layout</MenubarLabel>
              <MenubarItem>Compact</MenubarItem>
              <MenubarItem>Comfortable</MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          <MenubarMenu>
            <MenubarTrigger>Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Documentation</MenubarItem>
              <MenubarItem>Report Issue</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>About Hive</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>
  )
}
