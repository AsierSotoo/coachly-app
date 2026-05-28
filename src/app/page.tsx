export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-white px-4">
      <main className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Coachly
        </h1>
        <p className="max-w-sm text-base text-gray-500">
          Las estadísticas de tu equipo, en un sitio.
        </p>
        <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-500">
          En construcción
        </span>
      </main>
    </div>
  );
}
