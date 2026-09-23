import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { TacticsTemplateEditor } from '@/components/tactics/tactics-template-editor'
import { DEFAULT_TEMPLATE } from '@/lib/tactics'
import type { TacticsTemplate } from '@/lib/tactics'
import Link from 'next/link'

export default async function SeasonTacticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: seasonId } = await params
  const supabase = await createClient()

  const { data: season } = await supabase
    .from('seasons')
    .select('*, teams(*)')
    .eq('id', seasonId)
    .single()

  if (!season) notFound()

  const team = season.teams as { id: string; name: string }
  const template: TacticsTemplate = (season as { tactics_template?: TacticsTemplate | null }).tactics_template ?? DEFAULT_TEMPLATE

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'var(--tx-3)' }}>
          <Link href={`/dashboard/season/${seasonId}`} className="hover:underline" style={{ color: 'var(--tx-2)' }}>
            {team.name} · {season.name}
          </Link>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
          <span>Plantilla táctica</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: 'var(--tx)', fontFamily: 'var(--font-heading)' }}>
            Plantilla táctica
          </h1>
          <p className="text-sm" style={{ color: 'var(--tx-3)' }}>
            Define las secciones y roles que usarás en cada partido. Luego, en cada partido solo tendrás que rellenar los nombres.
          </p>
        </div>

        <TacticsTemplateEditor seasonId={seasonId} initial={template} />
      </div>
    </div>
  )
}
