export default function ArenaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="page-label mb-3">Coming Soon</p>
        <h1 className="page-title text-3xl">Learn to Code Arena</h1>
        <p className="mt-3 page-description text-sm">
          Coding challenges and AI problem-solving await.
        </p>
      </div>
      <a href="/map" className="back-link">Back to map</a>
    </div>
  );
}
