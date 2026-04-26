"use client";

import { useEffect } from "react";

export default function RemoveInjectedAttributes() {
  useEffect(() => {
    try {
      // Remove common extension-injected attributes that can pollute the DOM
      document.body.removeAttribute("cz-shortcut-listen");
    } catch {
      // noop
    }
  }, []);

  return null;
}
