import type { Metadata } from "next";
import { Inter, Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import RemoveInjectedAttributes from './removeInjectedAttributes';
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
  weight: ["300", "400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
      className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable} h-full antialiased`}
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
        <RemoveInjectedAttributes />
        {children}
      </body>
    </html>
  );
}
