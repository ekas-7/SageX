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
    <div className="flex h-full w-full items-center justify-center bg-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Daily Vibe</p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          {data?.title ?? "Loading..."}
        </h2>
        <p className="mt-1 text-xs text-slate-400">By {data?.authorName ?? ""}</p>
        <p className="mt-3 text-xs text-slate-400">Upvotes: {data?.upvotes ?? 0}</p>
        <a
          href={data?.previewUrl}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-sagex-teal px-4 text-xs font-semibold text-slate-900"
        >
          Open Live Preview
        </a>
      </div>
    </div>
  );
}
