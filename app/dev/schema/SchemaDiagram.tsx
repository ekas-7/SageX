"use client";

import mermaid from "mermaid";
import { useEffect, useId, useRef } from "react";

export function SchemaDiagram({ diagram }: { diagram: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "strict",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    const renderId = `schema-er-${id}`;

    mermaid
      .render(renderId, diagram)
      .then(({ svg }) => {
        if (!cancelled) el.innerHTML = svg;
      })
      .catch(() => {
        if (!cancelled) {
          el.textContent = diagram;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [diagram, id]);

  return (
    <div
      ref={containerRef}
      className="overflow-x-auto rounded-lg border border-white/10 bg-zinc-950 p-4 text-sm"
    />
  );
}
