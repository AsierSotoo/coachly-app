export default function SeasonLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 animate-pulse">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-xl border p-6 h-28" style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }} />
        ))}
      </div>
      {/* Action bar */}
      <div className="flex justify-between mb-8">
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded-lg" style={{ backgroundColor: '#1e293b' }} />
          <div className="h-10 w-44 rounded-lg" style={{ backgroundColor: '#1e293b' }} />
        </div>
        <div className="h-10 w-48 rounded-lg" style={{ backgroundColor: '#1e293b' }} />
      </div>
      {/* Table skeleton */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#070d1f', borderColor: '#1e293b' }}>
        <div className="h-14 border-b" style={{ backgroundColor: '#191f31', borderColor: '#1e293b' }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex items-center gap-6 px-6 py-5 border-b" style={{ borderColor: '#1e293b' }}>
            <div className="w-9 h-9 rounded-full" style={{ backgroundColor: '#1e293b' }} />
            <div className="flex-1">
              <div className="h-4 w-32 rounded mb-2" style={{ backgroundColor: '#1e293b' }} />
              <div className="h-3 w-20 rounded" style={{ backgroundColor: '#1e293b', opacity: 0.5 }} />
            </div>
            <div className="h-4 w-16 rounded" style={{ backgroundColor: '#1e293b' }} />
            <div className="h-6 w-20 rounded-full" style={{ backgroundColor: '#1e293b' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
