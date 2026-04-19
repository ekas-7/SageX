"use client";

import { useEffect, useMemo, useState } from "react";

type Submission = {
  title: string;
  authorName: string;
  code: { html: string; css: string; js: string };
};

export default function VibePreviewPage({ params }: { params: { id: string } }) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/vibe/submissions/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }
        setSubmission(data as Submission);
      })
      .catch(() => setError("Unable to load submission."));
  }, [params.id]);

  const srcDoc = useMemo(() => {
    if (!submission) return "";
    return `<!DOCTYPE html><html><head><style>${submission.code.css}</style></head><body>${submission.code.html}<script>${submission.code.js}</script></body></html>`;
  }, [submission]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <header>
          <p className="text-xs uppercase tracking-[0.35em] text-sagex-teal/70">
            Vibe Preview
          </p>
          <h1 className="text-2xl font-semibold text-white">
            {submission?.title ?? "Loading"}
          </h1>
          <p className="text-sm text-slate-400">By {submission?.authorName ?? "..."}</p>
        </header>
        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <iframe
            title="Vibe sandbox preview"
            sandbox="allow-scripts"
            className="h-[70vh] w-full rounded-2xl border border-white/10 bg-white"
            srcDoc={srcDoc}
          />
        )}
      </div>
    </div>
  );
}
