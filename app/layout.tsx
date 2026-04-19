import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
    icon: '/assests/logo/main_logo.ico',
    // provide a shortcut and apple touch icon fallback
    shortcut: '/assests/logo/main_logo.ico',
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
      <body className="min-h-full flex flex-col bg-[#07090f] text-slate-100">
        {children}
      </body>
    </html>
  );
}
