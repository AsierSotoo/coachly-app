export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-10 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="h-6 w-52 rounded-lg mb-2" style={{ backgroundColor: '#1e293b' }} />
          <div className="h-4 w-36 rounded" style={{ backgroundColor: '#1e293b', opacity: 0.5 }} />
        </div>
        <div className="h-11 w-36 rounded-lg" style={{ backgroundColor: '#1e293b' }} />
      </div>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-[24px] border p-6 h-56" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
            <div className="flex gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl" style={{ backgroundColor: '#1e293b' }} />
              <div className="flex-1">
                <div className="h-5 w-32 rounded mb-2" style={{ backgroundColor: '#1e293b' }} />
                <div className="h-4 w-20 rounded" style={{ backgroundColor: '#1e293b', opacity: 0.5 }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex-1 h-14 rounded-lg" style={{ backgroundColor: '#1e293b' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
