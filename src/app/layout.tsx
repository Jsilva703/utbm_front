import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { DM_Mono, Outfit } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const fontVariables = {
  "--font-ui": "var(--font-outfit)",
  "--font-mono": "var(--font-dm-mono)",
  "--font-geist-sans": "var(--font-outfit)",
  "--font-geist-mono": "var(--font-dm-mono)",
} as CSSProperties;

export const metadata: Metadata = {
  title: "RacePulse",
  description: "Acompanhamento de atletas e progresso em provas de endurance.",
  applicationName: "RacePulse",
  appleWebApp: {
    capable: true,
    title: "RacePulse",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#08090a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} ${dmMono.variable}`} style={fontVariables}>
        {children}
      </body>
    </html>
  );
}
