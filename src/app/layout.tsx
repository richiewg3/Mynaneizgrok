import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grok Prompt Architect — Img2Vid Master",
  description:
    "Transform your starter frames into optimized Grok video generation prompts with AI-powered prompt engineering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="party-bg min-h-screen antialiased">{children}</body>
    </html>
  );
}
