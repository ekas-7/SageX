"use client";

import { useEffect, useState } from "react";

type EmbedData = {
  title: string;
  authorName: string;
  upvotes: number;
  previewUrl: string;
};

export default function VibeEmbedPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<EmbedData | null>(null);

  useEffect(() => {
    fetch(`/api/vibe/embed/${params.id}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.error) return;
        setData(payload as EmbedData);
      })
      .catch(() => null);
  }, [params.id]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--background)] p-4 text-[var(--foreground)]">
      <div className="glass-card w-full max-w-sm rounded-2xl p-5">
        <p className="section-label">Daily Vibe</p>
        <h2 className="mt-2 font-display text-lg font-semibold text-[var(--text-primary)]">
          {data?.title ?? "Loading..."}
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">By {data?.authorName ?? ""}</p>
        <p className="mt-3 text-xs text-[var(--text-muted)]">Upvotes: {data?.upvotes ?? 0}</p>
        <a
          href={data?.previewUrl}
          className="btn-primary mt-4 text-xs"
        >
          Open Live Preview
        </a>
      </div>
    </div>
  );
}
