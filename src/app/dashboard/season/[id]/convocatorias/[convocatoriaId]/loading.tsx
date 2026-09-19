export default function ConvocatoriaLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 animate-pulse">
      <div className="flex gap-2 mb-6">
        {[1,2,3].map(i => <div key={i} className="h-4 w-24 rounded" style={{ backgroundColor: '#253028' }} />)}
      </div>
      <div className="rounded-2xl border h-36 mb-8" style={{ backgroundColor: '#171f1a', borderColor: '#2a342d' }} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl border h-[500px]" style={{ backgroundColor: '#111713', borderColor: '#2a342d' }} />
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-2xl border h-72" style={{ backgroundColor: '#171f1a', borderColor: '#2a342d' }} />
          <div className="rounded-2xl border h-48" style={{ backgroundColor: '#111713', borderColor: '#253028' }} />
        </div>
      </div>
    </div>
  )
}
