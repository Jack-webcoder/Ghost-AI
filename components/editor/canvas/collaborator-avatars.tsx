"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { useOthers } from "@liveblocks/react/suspense"

const MAX_VISIBLE_COLLABORATORS = 5

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return "?"
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function CollaboratorAvatars() {
  const { user } = useUser()
  const others = useOthers()
  const collaborators = others.filter((other) => other.id !== user?.id)
  const visibleCollaborators = collaborators.slice(0, MAX_VISIBLE_COLLABORATORS)
  const overflowCount = Math.max(
    0,
    collaborators.length - MAX_VISIBLE_COLLABORATORS
  )

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-20 flex h-10 items-center rounded-full border border-surface-border bg-surface/90 px-2 shadow-2xl backdrop-blur">
      {visibleCollaborators.length > 0 ? (
        <>
          <div className="flex items-center pl-1">
            {visibleCollaborators.map((collaborator, index) => {
              const name = collaborator.info.name || "Collaborator"
              const avatar = collaborator.info.avatar

              return (
                <div
                  key={collaborator.connectionId}
                  className="flex size-8 items-center justify-center overflow-hidden rounded-full border-2 border-base bg-elevated text-xs font-semibold text-copy-primary ring-1 ring-surface-border-subtle"
                  style={{
                    marginLeft: index === 0 ? 0 : -8,
                    zIndex: visibleCollaborators.length - index,
                  }}
                  aria-label={name}
                  title={name}
                >
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatar}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(name)}</span>
                  )}
                </div>
              )
            })}
            {overflowCount > 0 ? (
              <div
                className="flex size-8 items-center justify-center rounded-full border-2 border-base bg-subtle text-xs font-semibold text-copy-secondary ring-1 ring-surface-border-subtle"
                style={{ marginLeft: -8 }}
                aria-label={`${overflowCount} more collaborators`}
                title={`${overflowCount} more collaborators`}
              >
                +{overflowCount}
              </div>
            ) : null}
          </div>
          <div className="mx-2 h-5 w-px bg-surface-border" />
        </>
      ) : null}
      <div className="flex size-8 items-center justify-center overflow-hidden rounded-full ring-1 ring-surface-border-subtle">
        <UserButton />
      </div>
    </div>
  )
}
