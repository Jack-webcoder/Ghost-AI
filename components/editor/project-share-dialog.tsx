"use client"

import Image from "next/image"
import { FormEvent, useState } from "react"
import { Check, Copy, Loader2, Trash2, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useProjectShare } from "@/hooks/use-project-share"

interface ProjectShareDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function initialsFor(email: string, displayName: string | null) {
  if (displayName) {
    return displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return email[0]?.toUpperCase() ?? "?"
}

export function ProjectShareDialog({
  projectId,
  open,
  onOpenChange,
}: ProjectShareDialogProps) {
  const [email, setEmail] = useState("")
  const [copied, setCopied] = useState(false)
  const share = useProjectShare(projectId, open)

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setEmail("")
      setCopied(false)
    }

    onOpenChange(nextOpen)
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      await share.invite(email.trim().toLowerCase())
      setEmail("")
    } catch {
      // The hook exposes the request error in the dialog.
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-surface-border bg-elevated p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg text-copy-primary">
            Share project
          </DialogTitle>
          <DialogDescription className="text-copy-muted">
            {share.isOwner
              ? "Invite collaborators and manage who can access this project."
              : "View the people who have access to this project."}
          </DialogDescription>
        </DialogHeader>

        {share.isOwner && (
          <form className="flex gap-2" onSubmit={handleInvite}>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="collaborator@example.com"
              aria-label="Collaborator email"
              required
              disabled={share.isMutating}
              className="h-10 rounded-xl border-surface-border bg-subtle text-copy-primary placeholder:text-copy-faint"
            />
            <Button
              type="submit"
              disabled={share.isMutating || email.trim() === ""}
              className="h-10 rounded-xl"
            >
              {share.isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Invite"
              )}
            </Button>
          </form>
        )}

        {share.error && (
          <p className="text-sm text-error" role="alert">
            {share.error}
          </p>
        )}

        <section aria-labelledby="collaborators-heading">
          <h3
            id="collaborators-heading"
            className="mb-3 text-sm font-medium text-copy-secondary"
          >
            Collaborators
          </h3>

          {share.isLoading ? (
            <div className="flex min-h-24 items-center justify-center text-copy-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="sr-only">Loading collaborators</span>
            </div>
          ) : share.collaborators.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-surface-border p-5 text-center text-sm text-copy-muted">
              No collaborators yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {share.collaborators.map((collaborator) => (
                <li
                  key={collaborator.email}
                  className="flex items-center gap-3 rounded-2xl border border-surface-border bg-subtle p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-dim text-xs font-semibold text-brand">
                    {collaborator.imageUrl ? (
                      <Image
                        src={collaborator.imageUrl}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initialsFor(
                        collaborator.email,
                        collaborator.displayName
                      )
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {collaborator.displayName && (
                      <p className="truncate text-sm font-medium text-copy-primary">
                        {collaborator.displayName}
                      </p>
                    )}
                    <p className="truncate text-sm text-copy-muted">
                      {collaborator.email}
                    </p>
                  </div>

                  {share.isOwner && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void share.remove(collaborator.email)}
                      disabled={share.isMutating}
                      aria-label={`Remove ${collaborator.email}`}
                      className="text-copy-muted hover:text-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {share.isOwner ? (
          <div className="flex items-center justify-between gap-3 border-t border-surface-border pt-4">
            <div className="flex min-w-0 items-center gap-2 text-sm text-copy-muted">
              <UserRound className="h-4 w-4 shrink-0" />
              <span className="truncate">Anyone invited can collaborate</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopyLink()}
              className="shrink-0 rounded-xl"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy link
                </>
              )}
            </Button>
          </div>
        ) : (
          <p className="border-t border-surface-border pt-4 text-sm text-copy-muted">
            Only the project owner can invite or remove collaborators.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
