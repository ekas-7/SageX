import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@livekit/components-styles";
import { Providers } from "../components/Providers";
import { SessionSync } from "../components/SessionSync";
import RemoveInjectedAttributes from "./removeInjectedAttributes";
import EscapeToMap from "./EscapeToMap";

/** Favicon + Apple touch icons: Next.js picks up `app/icon.png` and `app/apple-icon.png` automatically. */

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
      <body
        {...{"cz-shortcut-listen": "true"}}
        className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]"
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
