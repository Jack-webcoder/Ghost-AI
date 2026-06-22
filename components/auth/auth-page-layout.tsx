import type { ReactNode } from "react";
import { Blocks, FileText, Sparkles, Users } from "lucide-react";

interface AuthPageLayoutProps {
  children: ReactNode;
}

const features = [
  {
    title: "AI architecture generation",
    description: "Describe your system and map it to a live canvas.",
    icon: Sparkles,
  },
  {
    title: "Real-time collaboration",
    description: "Edit architecture together with shared team presence.",
    icon: Users,
  },
  {
    title: "Instant spec generation",
    description: "Export a technical specification from the canvas graph.",
    icon: FileText,
  },
];

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <main className="grid min-h-screen bg-base font-sans text-copy-primary lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden border-r border-surface-border bg-surface px-10 py-8 lg:flex lg:flex-col xl:px-14 xl:py-10">
        <div
          className="absolute inset-y-0 left-0 w-1 bg-brand"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-primary-foreground">
            <Blocks className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Ghost AI</span>
        </div>

        <div className="relative my-auto max-w-xl py-12">
          <p className="text-sm font-medium text-brand">
            Collaborative system design
          </p>
          <h1 className="mt-4 max-w-lg text-3xl font-semibold tracking-tight text-copy-primary xl:text-4xl">
            Design systems at the speed of thought.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-copy-muted">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="mt-10 space-y-6">
            {features.map(({ title, description, icon: Icon }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-accent-dim text-brand">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-medium text-copy-primary">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-copy-muted">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-copy-faint">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-base px-5 py-10 sm:px-8 lg:px-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
