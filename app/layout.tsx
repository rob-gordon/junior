import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { participantName } from "@/lib/participants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: "Junior",
  description: `Baby name picker for ${participantName("user1")} & ${participantName("user2")}`,
  appleWebApp: {
    capable: true,
    title: "Junior",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Capture the install prompt as early as possible — it can fire before
            React mounts. InstallPrompt reads window.__bip on mount. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.__bip=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});window.addEventListener('appinstalled',function(){window.__bip=null;});",
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
