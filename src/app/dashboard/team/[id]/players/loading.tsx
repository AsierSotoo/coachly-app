export default function PlayersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 animate-pulse">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div>
          <div className="h-8 w-40 rounded-lg mb-2" style={{ backgroundColor: '#1e293b' }} />
          <div className="h-4 w-56 rounded" style={{ backgroundColor: '#1e293b', opacity: 0.5 }} />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 rounded-xl" style={{ backgroundColor: '#1e293b' }} />
          <div className="h-10 w-32 rounded-xl" style={{ backgroundColor: '#1e293b' }} />
        </div>
      </div>
      {/* Form skeleton */}
      <div className="rounded-[24px] border p-6 mb-8" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="h-5 w-36 rounded mb-6" style={{ backgroundColor: '#1e293b' }} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: '#1e293b' }} />)}
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="rounded-[24px] border p-6 flex flex-col items-center gap-4" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
            <div className="w-24 h-24 rounded-full" style={{ backgroundColor: '#1e293b' }} />
            <div className="h-5 w-28 rounded" style={{ backgroundColor: '#1e293b' }} />
            <div className="h-5 w-16 rounded-full" style={{ backgroundColor: '#1e293b', opacity: 0.6 }} />
            <div className="w-full h-1 rounded-full" style={{ backgroundColor: '#1e293b' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
