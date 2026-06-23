"use client"

import { useEffect, useState } from "react"

export interface ProjectCollaborator {
  email: string
  displayName: string | null
  imageUrl: string | null
}

interface CollaboratorsResponse {
  isOwner: boolean
  collaborators: ProjectCollaborator[]
  error?: string
}

interface CollaboratorMutationResponse {
  collaborator?: ProjectCollaborator
  error?: string
}

async function readResponse<T extends { error?: string }>(response: Response) {
  const data = (await response.json()) as T

  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong")
  }

  return data
}

export function useProjectShare(projectId: string, isOpen: boolean) {
  const [collaborators, setCollaborators] = useState<ProjectCollaborator[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const controller = new AbortController()

    void fetch(
      `/api/projects/${encodeURIComponent(projectId)}/collaborators`,
      { signal: controller.signal }
    )
      .then((response) => readResponse<CollaboratorsResponse>(response))
      .then((data) => {
        setCollaborators(data.collaborators)
        setIsOwner(data.isOwner)
        setError(null)
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load collaborators"
        )
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [isOpen, projectId])

  async function mutateCollaborator(method: "POST" | "DELETE", email: string) {
    setIsMutating(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/collaborators`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      )
      const data = await readResponse<CollaboratorMutationResponse>(response)

      if (method === "POST" && data.collaborator) {
        setCollaborators((current) => [
          ...current,
          data.collaborator as ProjectCollaborator,
        ])
      } else {
        setCollaborators((current) =>
          current.filter((collaborator) => collaborator.email !== email)
        )
      }
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Could not update collaborators"
      )
      throw mutationError
    } finally {
      setIsMutating(false)
    }
  }

  return {
    collaborators,
    isOwner,
    isLoading,
    isMutating,
    error,
    invite: (email: string) => mutateCollaborator("POST", email),
    remove: (email: string) => mutateCollaborator("DELETE", email),
  }
}
