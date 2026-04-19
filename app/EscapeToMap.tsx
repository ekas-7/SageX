"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Global hotkey: pressing Escape on any page (except the map itself,
 * the landing page, and onboarding) navigates the player back to /map.
 *
 * Ignored when:
 *  - the user is typing in an input/textarea/contenteditable element
 *  - an open modal/dialog is detected (role="dialog" or [data-modal-open])
 *  - the default event has already been prevented (page handled it)
 */

const EXEMPT_PATHS = new Set<string>(["/", "/map"]);
const EXEMPT_PREFIXES = ["/onboarding"];

function isExempt(pathname: string | null): boolean {
  if (!pathname) return true;
  if (EXEMPT_PATHS.has(pathname)) return true;
  return EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function hasOpenDialog(): boolean {
  if (typeof document === "undefined") return false;
  if (document.querySelector('[data-modal-open="true"]')) return true;
  if (document.querySelector('dialog[open]')) return true;
  const openRoleDialogs = document.querySelectorAll('[role="dialog"]');
  for (const el of openRoleDialogs) {
    if (el instanceof HTMLElement && el.offsetParent !== null) return true;
  }
  return false;
}

export default function EscapeToMap() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isExempt(pathname)) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.defaultPrevented) return;
      if (isTypingTarget(event.target)) return;
      if (hasOpenDialog()) return;
      event.preventDefault();
      router.push("/map");
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pathname, router]);

  return null;
}
