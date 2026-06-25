"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export interface ProjectRow {
  id: string
  name: string
  ownerId: string
  createdAt: Date
}

type DialogType = "create" | "rename" | "delete" | null

interface ActiveDialog {
  type: DialogType
  project: ProjectRow | null
}

export interface UseProjectActionsResult {
  activeDialog: ActiveDialog
  projectName: string
  roomId: string
  isLoading: boolean
  setProjectName: (name: string) => void
  openCreateDialog: () => void
  openRenameDialog: (project: ProjectRow) => void
  openDeleteDialog: (project: ProjectRow) => void
  closeDialog: () => void
  createProject: () => Promise<void>
  renameProject: () => Promise<void>
  deleteProject: () => Promise<void>
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function generateSuffix() {
  const values = crypto.getRandomValues(new Uint32Array(2))

  return Array.from(values, (value) => value.toString(36))
    .join("")
    .slice(0, 6)
    .padEnd(6, "0")
}

export function useProjectActions(
  activeProjectId?: string
): UseProjectActionsResult {
  const router = useRouter()
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({
    type: null,
    project: null,
  })
  const [projectName, setProjectName] = useState("")
  const [roomSuffix, setRoomSuffix] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const slug = slugify(projectName)
  const roomId = `${slug || "project"}-${roomSuffix}`

  function openCreateDialog() {
    setProjectName("")
    setRoomSuffix(generateSuffix())
    setActiveDialog({ type: "create", project: null })
  }

  function openRenameDialog(project: ProjectRow) {
    setProjectName(project.name)
    setActiveDialog({ type: "rename", project })
  }

  function openDeleteDialog(project: ProjectRow) {
    setProjectName("")
    setActiveDialog({ type: "delete", project })
  }

  function closeDialog() {
    if (isLoading) return

    setActiveDialog({ type: null, project: null })
    setProjectName("")
    setRoomSuffix("")
  }

  async function createProject() {
    const name = projectName.trim()
    if (!name || !roomSuffix) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, id: roomId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      setActiveDialog({ type: null, project: null })
      setProjectName("")
      setRoomSuffix("")
      router.push(`/editor/${roomId}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function renameProject() {
    const name = projectName.trim()
    const project = activeDialog.project
    if (!name || !project) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error("Failed to rename project")
      }

      setActiveDialog({ type: null, project: null })
      setProjectName("")
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteProject() {
    const project = activeDialog.project
    if (!project) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete project")
      }

      setActiveDialog({ type: null, project: null })
      setProjectName("")

      if (activeProjectId === project.id) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    activeDialog,
    projectName,
    roomId,
    isLoading,
    setProjectName,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    createProject,
    renameProject,
    deleteProject,
  }
}
