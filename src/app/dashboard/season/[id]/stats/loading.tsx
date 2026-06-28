export default function StatsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl" style={{ backgroundColor: '#1e293b' }} />
          <div>
            <div className="h-7 w-56 rounded-lg mb-2" style={{ backgroundColor: '#1e293b' }} />
            <div className="h-4 w-40 rounded" style={{ backgroundColor: '#1e293b', opacity: 0.5 }} />
          </div>
        </div>
      </div>
      {/* Hero section */}
      <div className="rounded-[24px] border p-6 mb-8 flex gap-8" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="w-48 h-48 rounded-full" style={{ backgroundColor: '#1e293b' }} />
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="rounded-lg h-28" style={{ backgroundColor: '#1e293b' }} />)}
        </div>
      </div>
      {/* Leaders */}
      <div className="h-6 w-40 rounded mb-4" style={{ backgroundColor: '#1e293b' }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[1,2,3,4,5].map(i => <div key={i} className="rounded-[16px] border h-48" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />)}
      </div>
    </div>
  )
}
