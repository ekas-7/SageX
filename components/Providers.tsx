"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { XpToastProvider } from "./XpToastProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <XpToastProvider>{children}</XpToastProvider>
    </SessionProvider>
  );
}
