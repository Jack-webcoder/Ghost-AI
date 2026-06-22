import { SignIn } from "@clerk/nextjs";

import { AuthPageLayout } from "@/components/auth/auth-page-layout";

export default function SignInPage() {
  return (
    <AuthPageLayout>
      <SignIn
        appearance={{
          variables: {
            colorBackground: "var(--bg-base)",
          },
          options: {
            socialButtonsVariant: "blockButton",
          },
          elements: {
            rootBox: {
              width: "100%",
            },
            cardBox: {
              width: "100%",
              backgroundColor: "var(--bg-base)",
              border: "1px solid var(--text-primary)",
              boxShadow: "none",
            },
            card: {
              backgroundColor: "var(--bg-base)",
            },
            socialButtonsRoot: {
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "0.5rem",
              width: "100%",
            },
            socialButtons: {
              display: "contents",
            },
            socialButtonsBlockButton: {
              width: "100%",
              minWidth: 0,
              color: "var(--text-primary)",
              justifyContent: "center",
            },
            socialButtonsBlockButton__github: {
              order: 1,
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--text-primary)",
              outline: "1px solid var(--text-primary)",
              outlineOffset: "-1px",
            },
            socialButtonsBlockButton__google: {
              order: 2,
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "var(--text-primary)",
              outline: "1px solid var(--text-primary)",
              outlineOffset: "-1px",
            },
            socialButtonsBlockButtonText: {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--text-primary)",
              textAlign: "center",
              width: "100%",
              fontSize: 0,
            },
            socialButtonsBlockButtonText__github: {
              "&::after": {
                content: '"GitHub"',
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              },
            },
            socialButtonsBlockButtonText__google: {
              "&::after": {
                content: '"Google"',
                fontSize: "0.875rem",
                color: "var(--text-primary)",
              },
            },
            footer: {
              backgroundColor: "var(--bg-base)",
            },
            footerAction: {
              paddingBottom: "1rem",
              borderBottom: "1px solid var(--border-default)",
            },
          },
        }}
      />
    </AuthPageLayout>
  );
}
