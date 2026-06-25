"use client"

import { EditorShell } from "@/components/editor/editor-shell"
import type { ProjectRow } from "@/hooks/use-project-actions"

interface EditorHomeClientProps {
  ownedProjects: ProjectRow[]
  sharedProjects: ProjectRow[]
}

export function EditorHomeClient({
  ownedProjects,
  sharedProjects,
}: EditorHomeClientProps) {
  return (
    <EditorShell
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
