import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Collaborative system design with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorPrimary: "var(--accent-primary)",
              colorPrimaryForeground: "var(--bg-base)",
              colorDanger: "var(--state-error)",
              colorSuccess: "var(--state-success)",
              colorWarning: "var(--state-warning)",
              colorNeutral: "var(--text-primary)",
              colorForeground: "var(--text-primary)",
              colorMuted: "var(--bg-subtle)",
              colorMutedForeground: "var(--text-muted)",
              colorBackground: "var(--bg-surface)",
              colorInput: "var(--bg-elevated)",
              colorInputForeground: "var(--text-primary)",
              colorRing: "var(--accent-primary)",
              colorBorder: "var(--border-default)",
              fontFamily: "var(--font-geist-sans)",
              fontFamilyButtons: "var(--font-geist-sans)",
              fontFamilyMono: "var(--font-geist-mono)",
              borderRadius: "var(--radius)",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
