export default function ConvocatoriaLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-10 py-8 animate-pulse">
      <div className="flex gap-2 mb-6">
        {[1,2,3].map(i => <div key={i} className="h-4 w-24 rounded" style={{ backgroundColor: '#1e293b' }} />)}
      </div>
      <div className="rounded-[24px] border h-36 mb-8" style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-[24px] border h-[500px]" style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }} />
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-[24px] border h-72" style={{ backgroundColor: '#191f31', borderColor: '#2e3447' }} />
          <div className="rounded-[24px] border h-48" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
        </div>
      </div>
    </div>
  )
}
