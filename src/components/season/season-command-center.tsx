import Link from 'next/link'
import { TeamLogo } from '@/components/team/team-logo'

type NextMatch = {
  id: string
  opponent: string
  played_at: string
  home: boolean
  match_time?: string | null
  competition?: string | null
}

type Props = {
  seasonId: string
  seasonName: string
  team: { id: string; name: string; logo_url?: string | null }
  nextMatch?: NextMatch
  played: number
  points: number
  goalsFor: number
  goalsAgainst: number
  form: Array<'V' | 'E' | 'D'>
}

const formStyle = {
  V: 'border-green-500/30 bg-green-500/10 text-green-400',
  E: 'border-amber-400/25 bg-amber-400/10 text-amber-300',
  D: 'border-red-400/25 bg-red-400/10 text-red-400',
}

export function SeasonCommandCenter({ seasonId, seasonName, team, nextMatch, played, points, goalsFor, goalsAgainst, form }: Props) {
  const matchDate = nextMatch
    ? new Date(`${nextMatch.played_at}T12:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    : null

  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
      <div className="rounded-xl border border-[#2e3447] bg-[#0f172a] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <TeamLogo name={team.name} logoUrl={team.logo_url} size="lg" className="h-12 w-12 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-400">{seasonName}</p>
            <h1 className="mt-0.5 truncate font-[family-name:var(--font-heading)] text-xl font-bold text-slate-100 sm:text-2xl">{team.name}</h1>
          </div>
          <Link href={`/dashboard/season/${seasonId}/stats`} className="hidden min-h-10 items-center rounded-lg border border-[#334155] px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-green-400 hover:text-green-400 sm:inline-flex">
            Estadísticas
          </Link>
        </div>

        <div className="mt-6 border-t border-[#1e293b] pt-5">
          {nextMatch ? (
            <Link href={`/dashboard/season/${seasonId}/match/${nextMatch.id}`} className="group flex items-center gap-4 rounded-lg border border-[#334155] bg-[#111b2e] p-4 transition-colors hover:border-green-500/50">
              <span className="material-symbols-outlined text-green-400" aria-hidden="true">sports_soccer</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Próximo partido</p>
                <p className="mt-1 truncate text-base font-semibold text-slate-100">{nextMatch.home ? `${team.name} · ` : ''}vs {nextMatch.opponent}</p>
                <p className="mt-1 truncate text-sm text-slate-400">{matchDate}{nextMatch.match_time ? ` · ${nextMatch.match_time.slice(0, 5)}` : ''}</p>
              </div>
              <span className="material-symbols-outlined text-slate-500 transition-transform group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span>
            </Link>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-[#334155] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold text-slate-100">No hay ningún partido programado</p><p className="mt-1 text-sm text-slate-400">Añade el siguiente para tener la semana organizada.</p></div>
              <Link href={`/dashboard/season/${seasonId}?new=1`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-green-500 px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-green-400">Añadir partido</Link>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/dashboard/season/${seasonId}?new=1`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-bold text-slate-950 transition-colors hover:bg-green-400"><span className="material-symbols-outlined text-base" aria-hidden="true">add</span> Partido</Link>
          <Link href={`/dashboard/season/${seasonId}/calendar`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#334155] px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-[#151f33]">Calendario</Link>
          <Link href={`/dashboard/season/${seasonId}/trainings`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#334155] px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-[#151f33]">Entrenos</Link>
          <Link href={`/dashboard/team/${team.id}/players`} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#334155] px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-[#151f33]">Plantilla</Link>
        </div>
      </div>

      <aside className="rounded-xl border border-[#2e3447] bg-[#0f172a] p-5 sm:p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Temporada</p>
        <div className="mt-5 grid grid-cols-2 gap-y-5">
          <Metric label="Partidos" value={played} />
          <Metric label="Puntos" value={points} accent />
          <Metric label="A favor" value={goalsFor} />
          <Metric label="En contra" value={goalsAgainst} />
        </div>
        {form.length > 0 && <div className="mt-6 border-t border-[#1e293b] pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Últimos resultados</p><div className="mt-3 flex gap-1.5">{form.map((result, index) => <span key={`${result}-${index}`} className={`flex h-7 w-7 items-center justify-center rounded-md border text-[11px] font-bold ${formStyle[result]}`}>{result}</span>)}</div></div>}
      </aside>
    </section>
  )
}

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div><p className="text-2xl font-bold tabular-nums text-slate-100">{value}</p><p className={`mt-0.5 text-xs ${accent ? 'text-green-400' : 'text-slate-500'}`}>{label}</p></div>
}
