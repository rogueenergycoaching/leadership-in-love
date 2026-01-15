export default function DocumentLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-1" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="card">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-8" />

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i}>
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse mt-2" />
                {i === 2 && (
                  <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse mt-2" />
                )}
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-200 my-8" />

          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mt-0.5" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
