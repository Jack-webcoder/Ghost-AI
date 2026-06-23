import { redirect } from "next/navigation"

import { EditorHomeClient } from "@/components/editor/editor-home-client"
import { getCurrentUserIdentity } from "@/lib/project-access"
import { getProjectsForUser } from "@/lib/projects"

export default async function EditorPage() {
  const identity = await getCurrentUserIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const { ownedProjects, sharedProjects } = await getProjectsForUser()

  return (
    <EditorHomeClient
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
