import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { AccountCleanupBoundary } from "@/components/auth/account-cleanup-boundary";
import { NativeLifecycleBoundary } from "@/components/native/native-lifecycle-boundary";

export const metadata: Metadata = {
  title: {
    default: "Persist Fitness",
    template: "%s | Persist Fitness",
  },
  description:
    "An AI-assisted workout companion for tracking workouts, logging sets, and building consistent training habits.",
  applicationName: "Persist Fitness",
  appleWebApp: {
    capable: true,
    title: "Persist Fitness",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050505] text-neutral-100 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(132,204,22,0.10),transparent_30%),linear-gradient(180deg,#050505_0%,#0a0a0a_45%,#050505_100%)]" />
        {children}
        <ToastProvider />
        <ServiceWorkerRegistration />
        <AccountCleanupBoundary />
        <NativeLifecycleBoundary />
      </body>
    </html>
  );
}
