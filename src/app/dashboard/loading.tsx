export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <header className="bg-card border-b border-border p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <section className="mb-12">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="card">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse mt-6" />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="card">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-3 border-b border-border last:border-0"
                >
                  <div>
                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-64 bg-gray-100 rounded animate-pulse mt-2" />
                  </div>
                  <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
