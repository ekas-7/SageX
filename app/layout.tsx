import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
} catch (e) {
  // file missing or inaccessible — fall back to the raw path
  faviconHref = faviconRel;
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SageX Learn AI Through Play",
  description:
    "A 2D RPG where players learn AI concepts through quests and challenges.",
  icons: {
    // favicon (.ico) served from public/assests/logo/main_logo.ico
    icon: faviconHref,
    // provide a shortcut and apple touch icon fallback
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
  className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* explicit favicon links to ensure browsers pick it up */}
        <link rel="icon" href={faviconHref} />
        <link rel="shortcut icon" href={faviconHref} />
        <link rel="apple-touch-icon" href="/assests/logo/main_logo.png" />
      </head>
      <body
        {...{"cz-shortcut-listen": "true"}}
        className="min-h-full flex flex-col bg-[#07090f] text-slate-100"
      >
        <RemoveInjectedAttributes />
        {children}
      </body>
    </html>
  );
}
