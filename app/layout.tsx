import type { Metadata } from "next";
import { comfortaa, nunito } from "@/lib/fonts";
import "./globals.css";

import AuthInitializer from "@/components/auth/AuthInitializer";
import AmbiancePlayer from "@/components/audio/AmbiancePlayer";
import GlobalClickSound from "@/components/audio/GlobalClickSound";
import PWAInstallPrompt from "@/components/layout/PWAInstallPrompt";

export const metadata: Metadata = {
  title: "Stride — Woodland Quest",
  description: "A gamified study manager for dental students.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stride",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#FEFCF7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${comfortaa.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className={`${nunito.className} min-h-full flex flex-col`}>
        <AuthInitializer>
          <AmbiancePlayer />
          <GlobalClickSound />
          <PWAInstallPrompt />
          {children}
        </AuthInitializer>
      </body>
    </html>
  );
}
