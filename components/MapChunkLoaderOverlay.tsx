"use client";

type MapChunkLoaderOverlayProps = {
  error: string | null;
  onRetry: () => void;
  label?: string;
};

/**
 * Full-screen cover while priority map tiles preload; error + retry in prod.
 */
export function MapChunkLoaderOverlay({
  error,
  onRetry,
  label = "Loading map",
}: MapChunkLoaderOverlayProps) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--background)]/92 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/95 px-8 py-8 text-center shadow-[0_0_32px_rgba(0,0,0,0.45)]">
        {error ? (
          <>
            <p className="text-sm font-medium text-rose-300">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="btn-primary text-sm"
            >
              Retry
            </button>
          </>
        ) : (
          <>
            <div
              className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--sagex-accent)]"
              aria-hidden
            />
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
          </>
        )}
      </div>
    </div>
  );
}
