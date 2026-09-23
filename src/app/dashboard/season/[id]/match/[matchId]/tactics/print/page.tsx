import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DEFAULT_TEMPLATE, emptyMatchTactics } from '@/lib/tactics'
import type { TacticsTemplate, MatchTactics } from '@/lib/tactics'
import { PrintTrigger } from './print-trigger'

export default async function TacticsPrintPage({
  params,
}: {
  params: Promise<{ id: string; matchId: string }>
}) {
  const { id: seasonId, matchId } = await params
  const supabase = await createClient()

  const [{ data: match }, { data: season }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', matchId).single(),
    supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single(),
  ])

  if (!match || !season) notFound()

  const team = season.teams as { name: string; logo_url?: string | null }
  const template: TacticsTemplate = (season as { tactics_template?: TacticsTemplate | null }).tactics_template ?? DEFAULT_TEMPLATE
  const savedTactics = (match as { tactics?: MatchTactics | null }).tactics
  const tactics: MatchTactics = savedTactics ?? emptyMatchTactics(template)

  const allMatches = await supabase.from('matches').select('id').eq('season_id', seasonId).order('played_at')
  const matchIndex = (allMatches.data ?? []).findIndex(m => m.id === matchId)

  const playedAt = new Date(match.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          .print-sheet { box-shadow: none !important; border: none !important; }
        }
        @page { size: A4; margin: 18mm 18mm 18mm 18mm; }
        body { font-family: Arial, Helvetica, sans-serif; background: #f8f8f8; }
      `}</style>

      {/* Botón volver / imprimir — solo en pantalla */}
      <div className="no-print flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: '#e5e7eb' }}>
        <a href={`/dashboard/season/${seasonId}/match/${matchId}`}
          className="text-sm font-semibold flex items-center gap-1" style={{ color: '#6b7280' }}>
          ← Volver
        </a>
        <PrintTrigger />
      </div>

      {/* Hoja A4 */}
      <div className="print-sheet max-w-2xl mx-auto my-8 bg-white rounded-lg shadow-lg p-10 print:my-0 print:shadow-none print:rounded-none">

        {/* Cabecera */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-base font-black uppercase tracking-wide" style={{ color: '#111' }}>
              Jornada: {matchIndex >= 0 ? matchIndex + 1 : '—'}&nbsp;&nbsp;&nbsp;Rival: {match.opponent}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
              {playedAt} · {(match as { home?: boolean }).home ? 'Local' : 'Visitante'} · {team.name}
            </p>
          </div>
          {team.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logo_url} alt={team.name} className="w-14 h-14 object-contain" />
          )}
        </div>

        <hr className="mb-5" style={{ borderColor: '#d1d5db' }} />

        {/* Secciones */}
        {template.sections.map((section, sIdx) => {
          const sectionData = tactics.sections[section.id] ?? {}
          return (
            <div key={section.id} className={sIdx > 0 ? 'mt-5' : ''}>
              <p className="text-sm font-black uppercase tracking-wide mb-2" style={{ color: '#111' }}>
                {section.title}:
              </p>
              <div className="pl-2 flex flex-col gap-1.5">
                {section.rows.map(row => {
                  const entry = sectionData[row.id] ?? { players: [] }
                  const filled = entry.players.filter(Boolean)
                  return (
                    <div key={row.id} className="flex items-baseline gap-3 text-sm">
                      <span className="font-semibold w-24 shrink-0 text-xs uppercase tracking-wide" style={{ color: '#374151' }}>
                        – {row.role}:
                      </span>
                      <span className="font-black" style={{ color: '#111', letterSpacing: '0.03em' }}>
                        {filled.map((name, i) => (
                          <span key={i}>{i > 0 ? <span className="font-normal text-gray-400 mx-1">·</span> : null}{i + 1}. {name}</span>
                        ))}
                        {filled.length === 0 && <span style={{ color: '#9ca3af', fontWeight: 400 }}>—</span>}
                      </span>
                      {row.hasExtra && entry.extra && (
                        <span className="text-xs italic ml-2" style={{ color: '#4b5563' }}>
                          Jugada: {entry.extra}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {sIdx < template.sections.length - 1 && <hr className="mt-4" style={{ borderColor: '#e5e7eb' }} />}
            </div>
          )
        })}

        {/* Notas */}
        {template.notesCount > 0 && (
          <div className="mt-6">
            <hr className="mb-4" style={{ borderColor: '#e5e7eb' }} />
            <div className="flex flex-col gap-2">
              {Array.from({ length: template.notesCount }).map((_, i) => (
                <p key={i} className="text-sm" style={{ color: '#111' }}>
                  <span className="font-black">{i + 1}.&nbsp;</span>
                  {tactics.notes[i] || <span style={{ color: '#9ca3af' }}>________________________________________________________________________________</span>}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Branding disimulado */}
        <div className="flex justify-end mt-6">
          <span style={{ fontSize: 9, color: '#d1d5db', letterSpacing: '0.06em', fontWeight: 600, textTransform: 'uppercase' }}>
            Coachly
          </span>
        </div>
      </div>
    </>
  )
}
