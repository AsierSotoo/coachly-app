import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { MatchForm } from '@/components/match/match-form'
import { PageTransition } from '@/components/ui/page-transition'
import { ChevronLeft } from 'lucide-react'
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

  const season = match.seasons as { id: string; name: string; teams: { id: string; name: string } }
  const team = season.teams

  const [{ data: players }, { data: appearances }] = await Promise.all([
    supabase.from('players').select('*').eq('team_id', team.id).eq('active', true)
      .order('number', { ascending: true, nullsFirst: false }),
    supabase.from('appearances').select('*').eq('match_id', matchId),
  ])

  const sp = await searchParams

  const dateStr = new Date(match.played_at).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/season/${seasonId}`}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-3"
          >
            <ChevronLeft className="h-3 w-3" /> {season.name}
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-white">
                {match.home ? 'vs' : '@'} {match.opponent}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {dateStr}{match.competition ? ` · ${match.competition}` : ''}
              </p>
            </div>
            <div className="flex h-10 items-center justify-center rounded-xl border border-slate-700 px-3 font-[family-name:var(--font-heading)] text-lg font-bold text-white">
              {match.goals_for}–{match.goals_against}
            </div>
          </div>
        </div>

        <MatchForm
          match={match}
          players={players ?? []}
          appearances={appearances ?? []}
          seasonId={seasonId}
          teamName={team.name}
          saved={!!sp.saved}
        />
      </main>
    </PageTransition>
  )
}
