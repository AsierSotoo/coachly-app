export default function ConvocatoriasLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="h-4 w-32 rounded mb-2" style={{ backgroundColor: '#1e293b', opacity: 0.6 }} />
          <div className="h-9 w-72 rounded-lg mb-1" style={{ backgroundColor: '#1e293b' }} />
          <div className="h-4 w-56 rounded" style={{ backgroundColor: '#1e293b', opacity: 0.4 }} />
        </div>
        <div className="h-11 w-48 rounded-lg" style={{ backgroundColor: '#1e293b' }} />
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between rounded-xl border p-6"
            style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }}>
            <div>
              <div className="h-3 w-24 rounded mb-3" style={{ backgroundColor: '#2e3447' }} />
              <div className="h-9 w-12 rounded" style={{ backgroundColor: '#2e3447' }} />
            </div>
            <div className="w-12 h-12 rounded-full" style={{ backgroundColor: '#2e3447' }} />
          </div>
        ))}
      </section>

      {/* Table */}
      <section className="rounded-[24px] border overflow-hidden" style={{ backgroundColor: '#191f31', borderColor: '#1e293b' }}>
        <div className="px-6 py-4 border-b" style={{ backgroundColor: 'rgba(35,41,60,0.5)', borderColor: '#1e293b' }}>
          <div className="flex gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 w-20 rounded" style={{ backgroundColor: '#2e3447' }} />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-6 px-6 py-5 border-b" style={{ borderColor: '#1e293b' }}>
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2" style={{ backgroundColor: '#2e3447', borderColor: '#151b2d' }} />
                <div className="w-10 h-10 rounded-full border-2" style={{ backgroundColor: '#2e3447', borderColor: '#151b2d' }} />
              </div>
              <div>
                <div className="h-4 w-40 rounded mb-1.5" style={{ backgroundColor: '#2e3447' }} />
                <div className="h-3 w-28 rounded" style={{ backgroundColor: '#2e3447', opacity: 0.5 }} />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
