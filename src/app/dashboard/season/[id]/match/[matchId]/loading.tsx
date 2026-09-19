export default function MatchLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 animate-pulse">
      <div className="h-4 w-32 rounded mb-6" style={{ backgroundColor: '#253028' }} />
      <div className="flex justify-between mb-6">
        <div>
          <div className="h-7 w-48 rounded mb-2" style={{ backgroundColor: '#253028' }} />
          <div className="h-4 w-36 rounded" style={{ backgroundColor: '#253028', opacity: 0.5 }} />
        </div>
        <div className="h-10 w-20 rounded-xl" style={{ backgroundColor: '#253028' }} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl border h-40" style={{ backgroundColor: '#111713', borderColor: '#253028' }} />
        <div className="rounded-2xl border h-40" style={{ backgroundColor: '#111713', borderColor: '#253028' }} />
      </div>
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#111713', borderColor: '#253028' }}>
        <div className="h-10 border-b" style={{ backgroundColor: '#111713', borderColor: '#253028' }} />
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#253028' }}>
            <div className="w-8 h-8 rounded" style={{ backgroundColor: '#253028' }} />
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#253028' }} />
            <div className="flex-1 h-4 rounded" style={{ backgroundColor: '#253028' }} />
            <div className="w-24 h-8 rounded-lg" style={{ backgroundColor: '#253028' }} />
            {[1,2,3,4,5].map(j => <div key={j} className="w-10 h-8 rounded-lg" style={{ backgroundColor: '#253028' }} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
