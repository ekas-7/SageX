import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@livekit/components-styles";
import { Providers } from "../components/Providers";
import { SessionSync } from "../components/SessionSync";
import RemoveInjectedAttributes from "./removeInjectedAttributes";
import EscapeToMap from "./EscapeToMap";
import fs from 'fs';
import path from 'path';

// compute a cache-busting query string from the favicon file mtime
const faviconRel = '/assests/logo/main_logo.ico';
let faviconHref = faviconRel;
try {
  const p = path.resolve(process.cwd(), `public${faviconRel}`);
  const stat = fs.statSync(p);
  faviconHref = `${faviconRel}?v=${stat.mtimeMs}`;
} catch {
  // file missing or inaccessible fall back to the raw path
  faviconHref = faviconRel;
}

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SageX | Learn AI Through Play",
  description:
    "A 2D RPG where players learn AI concepts through quests and challenges in the SageX Space Academy.",
  icons: {
    icon: faviconHref,
    shortcut: faviconHref,
    apple: '/assests/logo/main_logo.png',
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full font-sans antialiased`}
    >
      <head>
        <link rel="icon" href={faviconHref} />
        <link rel="shortcut icon" href={faviconHref} />
        <link rel="apple-touch-icon" href="/assests/logo/main_logo.png" />
      </head>
      <body
        {...{"cz-shortcut-listen": "true"}}
        className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]"
      >
        <Providers>
          <SessionSync />
          <RemoveInjectedAttributes />
          <EscapeToMap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
