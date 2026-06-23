import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-subtle">
          <Lock className="h-8 w-8 text-copy-secondary" />
        </div>
        <h1 className="text-lg font-semibold text-copy-primary">
          Access Denied
        </h1>
        <p className="max-w-sm text-sm text-copy-muted">
          You don&apos;t have permission to view this project or it
          doesn&apos;t exist.
        </p>
        <Link href="/editor" className="mt-4">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    </div>
  )
}
