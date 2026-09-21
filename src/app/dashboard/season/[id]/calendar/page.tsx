import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { PageTransition } from '@/components/ui/page-transition'
import { TrainingCalendar } from '@/components/training/training-calendar'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('seasons').select('name, teams(name)').eq('id', id).single()
  if (!data) return { title: 'Calendario' }
  const team = Array.isArray(data.teams) ? data.teams[0] : data.teams as { name: string } | null
  return { title: `Calendario${team ? ` · ${team.name}` : ''}` }
}

export default async function CalendarPage({
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
      .select('id, opponent, played_at, goals_for, goals_against, home, status')
      .eq('season_id', seasonId)
      .order('played_at', { ascending: true }),
  ])

  return (
    <PageTransition>
      <main className="max-w-3xl mx-auto px-4 py-6 pb-32 md:pb-10">
        <div className="mb-6">
          <Link href={`/dashboard/season/${seasonId}`}
            className="flex items-center gap-1 text-xs mb-3 transition-colors"
            style={{ color: 'var(--tx-3)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
            {season.name}
          </Link>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Sora, sans-serif', color: 'var(--tx)' }}>
            Calendario
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--tx-3)' }}>{team.name} · {season.name}</p>
        </div>

        <TrainingCalendar
          seasonId={seasonId}
          teamName={team.name}
          teamLogo={team.logo_url ?? null}
          seasonName={season.name}
          sessions={sessions ?? []}
          matches={(matches ?? []) as Parameters<typeof TrainingCalendar>[0]['matches']}
        />
      </main>
    </PageTransition>
  )
}
