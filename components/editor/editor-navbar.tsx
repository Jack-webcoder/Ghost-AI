"use client"

import { UserButton } from "@clerk/nextjs"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

import { Button } from "@/components/ui/button"

interface EditorNavbarProps {
  isSidebarOpen: boolean
  onSidebarToggle: () => void
}

export function EditorNavbar({
  isSidebarOpen,
  onSidebarToggle,
}: EditorNavbarProps) {
  const SidebarIcon = isSidebarOpen ? PanelLeftClose : PanelLeftOpen

  return (
    <header className="grid h-14 shrink-0 grid-cols-3 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex items-center justify-start">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSidebarToggle}
          aria-label={
            isSidebarOpen
              ? "Close projects sidebar"
              : "Open projects sidebar"
          }
          aria-expanded={isSidebarOpen}
          aria-controls="project-sidebar"
        >
          <SidebarIcon className="h-5 w-5" />
        </Button>
      </div>

      <div />
      <div className="flex items-center justify-end">
        <UserButton />
      </div>
    </header>
  )
}
