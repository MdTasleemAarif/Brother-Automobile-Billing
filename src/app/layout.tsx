import type { Metadata, Viewport } from "next";
import { AppHeader } from "@/components/AppHeader";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "BA Billing | Brothers Automobiles",
  applicationName: "BA Billing",
  description: "Garage e-billing app for Brothers Automobiles",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "BA Billing",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f9fa6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
