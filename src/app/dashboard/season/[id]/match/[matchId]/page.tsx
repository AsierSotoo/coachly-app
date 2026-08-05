import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { MatchForm } from '@/components/match/match-form'
import { RivalLogoUpload } from '@/components/match/rival-logo-upload'
import { PageTransition } from '@/components/ui/page-transition'
import Link from 'next/link'

export default async function MatchPage({
  params, searchParams,
}: {
  params: Promise<{ id: string; matchId: string }>
  searchParams: Promise<{ saved?: string }>
}) {
  const { id: seasonId, matchId } = await params
  const supabase = await createClient()

  const { data: match } = await supabase
    .from('matches').select('*, seasons(*, teams(*))').eq('id', matchId).single()
  if (!match) notFound()

  const season = match.seasons as { id: string; name: string; teams: { id: string; name: string; gender?: string | null } }
  const team = season.teams

  const [{ data: players }, { data: appearances }, { data: convocatoria }, { data: allMatches }] = await Promise.all([
    supabase.from('players').select('*').eq('team_id', team.id).eq('active', true)
      .order('number', { ascending: true, nullsFirst: false }),
    supabase.from('appearances').select('*').eq('match_id', matchId),
    supabase.from('convocatorias')
      .select('id, convocatoria_players(player_id, status)')
      .eq('match_id', matchId)
      .maybeSingle(),
    supabase.from('matches')
      .select('id, opponent, played_at')
      .eq('season_id', seasonId)
      .order('played_at', { ascending: true }),
  ])

  const matchIndex = allMatches?.findIndex(m => m.id === matchId) ?? -1
  const prevMatch  = matchIndex > 0 ? allMatches![matchIndex - 1] : null
  const nextMatch  = matchIndex < (allMatches?.length ?? 0) - 1 ? allMatches![matchIndex + 1] : null

  const convocatoriaStatuses: Record<string, 'titular' | 'convocada' | 'no_convocada'> = {}
  const convocatoriaId = (convocatoria as { id?: string } | null)?.id ?? null
  if (convocatoria) {
    const rows = convocatoria.convocatoria_players as { player_id: string; status: string }[]
    for (const r of rows ?? []) {
      convocatoriaStatuses[r.player_id] = r.status as 'titular' | 'convocada' | 'no_convocada'
    }
  }

  // Si hay convocatoria, reordenar: titulares → convocadas → no_convocadas → sin asignar
  const STATUS_ORDER = { titular: 0, convocada: 1, no_convocada: 2 }
  const sortedPlayers = [...(players ?? [])].sort((a, b) => {
    const aS = STATUS_ORDER[convocatoriaStatuses[a.id] ?? 'no_convocada'] ?? 2
    const bS = STATUS_ORDER[convocatoriaStatuses[b.id] ?? 'no_convocada'] ?? 2
    if (aS !== bS) return aS - bS
    return (a.number ?? 99) - (b.number ?? 99)
  })

  const sp = await searchParams

  const dateStr = new Date(match.played_at).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <PageTransition>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/dashboard/season/${seasonId}`}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span> {season.name}
            </Link>
            {allMatches && allMatches.length > 1 && (
              <div className="flex items-center gap-1">
                {prevMatch ? (
                  <Link href={`/dashboard/season/${seasonId}/match/${prevMatch.id}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors hover:bg-slate-800"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}
                    title={`Anterior: ${prevMatch.opponent}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                    <span className="hidden sm:inline max-w-[80px] truncate">{prevMatch.opponent}</span>
                  </Link>
                ) : (
                  <span className="flex items-center px-2.5 py-1 rounded-lg border opacity-25 text-[11px]"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
                  </span>
                )}
                <span className="text-[10px] px-1.5 tabular-nums" style={{ color: '#475569' }}>
                  {matchIndex + 1}/{allMatches.length}
                </span>
                {nextMatch ? (
                  <Link href={`/dashboard/season/${seasonId}/match/${nextMatch.id}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors hover:bg-slate-800"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}
                    title={`Siguiente: ${nextMatch.opponent}`}>
                    <span className="hidden sm:inline max-w-[80px] truncate">{nextMatch.opponent}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                  </Link>
                ) : (
                  <span className="flex items-center px-2.5 py-1 rounded-lg border opacity-25 text-[11px]"
                    style={{ borderColor: '#2e3447', color: '#adb4ce' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white truncate">
                {match.home ? 'vs' : '@'} {match.opponent}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {dateStr}{match.competition ? ` · ${match.competition}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RivalLogoUpload
                matchId={matchId}
                currentUrl={(match as { rival_logo_url?: string | null }).rival_logo_url}
                opponentName={match.opponent}
              />
              {convocatoriaId && (
                <Link
                  href={`/dashboard/season/${seasonId}/convocatorias/${convocatoriaId}`}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                  title="Ver convocatoria"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>groups</span>
                </Link>
              )}
              <div className="flex h-10 items-center justify-center rounded-xl border border-slate-700 px-3 font-[family-name:var(--font-heading)] text-lg font-bold text-white">
                {match.goals_for}–{match.goals_against}
              </div>
            </div>
          </div>
        </div>

        <MatchForm
          match={match}
          players={sortedPlayers}
          appearances={appearances ?? []}
          seasonId={seasonId}
          teamName={team.name}
          teamGender={team.gender}
          saved={!!sp.saved}
          convocatoriaStatuses={Object.keys(convocatoriaStatuses).length > 0 ? convocatoriaStatuses : undefined}
        />
      </main>
    </PageTransition>
  )
}
