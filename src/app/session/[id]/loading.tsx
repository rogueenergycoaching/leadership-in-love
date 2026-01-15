export default function SessionLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-1" />
          </div>
          <div className="flex items-center gap-4">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  i % 2 === 0
                    ? "bg-gray-200"
                    : "bg-card border border-border"
                }`}
              >
                <div className="h-4 w-48 bg-gray-300 rounded animate-pulse" />
                <div className="h-4 w-64 bg-gray-300 rounded animate-pulse mt-2" />
                {i === 1 && (
                  <div className="h-4 w-32 bg-gray-300 rounded animate-pulse mt-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 h-12 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-12 w-20 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </footer>
    </div>
  );
}
