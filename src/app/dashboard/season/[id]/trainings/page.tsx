import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { TrainingCalendar } from '@/components/training/training-calendar'

export default async function TrainingsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons').select('*, teams(id, name, logo_url)').eq('id', seasonId).single()
  if (!season) notFound()

  const team = season.teams as { id: string; name: string; logo_url?: string | null }

  const [{ data: sessions }, { data: matches }] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('id, date, title, notes, duration_min')
      .eq('season_id', seasonId)
      .order('date', { ascending: false }),
    supabase
      .from('matches')
      .select('id, opponent, played_at, goals_for, goals_against, home')
      .eq('season_id', seasonId)
      .order('played_at', { ascending: true }),
  ])

  return (
    <PageTransition>
      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
        <div className="mb-6">
          <Link href={`/dashboard/season/${seasonId}`}
            className="flex items-center gap-1 text-xs mb-3 hover:text-slate-300 transition-colors"
            style={{ color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
            {season.name}
          </Link>
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Planificación
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{team.name} · {season.name}</p>
        </div>

        <TrainingCalendar
          seasonId={seasonId}
          teamName={team.name}
          teamLogo={team.logo_url ?? null}
          seasonName={season.name}
          sessions={sessions ?? []}
          matches={matches ?? []}
        />
      </main>
    </PageTransition>
  )
}
