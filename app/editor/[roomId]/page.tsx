import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentUserIdentity, userHasProjectAccess } from "@/lib/project-access"
import { getProjectsForUser } from "@/lib/projects"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"

interface EditorWorkspacePageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function EditorWorkspacePage({
  params,
}: EditorWorkspacePageProps) {
  const { roomId } = await params
  const identity = await getCurrentUserIdentity()

  if (!identity) {
    redirect("/sign-in")
  }

  const hasAccess = await userHasProjectAccess(identity, roomId)

  if (!hasAccess) {
    return <AccessDenied />
  }

  const project = await prisma.project.findUnique({
    where: { id: roomId },
  })

  if (!project) {
    return <AccessDenied />
  }

  const { ownedProjects, sharedProjects } = await getProjectsForUser()

  return (
    <WorkspaceShell
      project={project}
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    />
  )
}
