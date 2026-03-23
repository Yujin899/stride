import type { Metadata } from "next";
import { Comfortaa, Nunito } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

import AuthInitializer from "@/components/auth/AuthInitializer";
import AmbiancePlayer from "@/components/audio/AmbiancePlayer";
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
          <PWAInstallPrompt />
          {children}
        </AuthInitializer>
      </body>
    </html>
  );
}
