import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { DEFAULT_TEMPLATE, emptyMatchTactics } from '@/lib/tactics'
import type { TacticsTemplate, MatchTactics } from '@/lib/tactics'
import { PrintTrigger } from './print-trigger'

export default async function TacticsPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>
  searchParams: Promise<{ seasonId?: string }>
}) {
  const { matchId } = await params
  const { seasonId } = await searchParams
  if (!seasonId) notFound()

  const supabase = await createClient()

  const [{ data: match }, { data: season }, { data: allMatches }] = await Promise.all([
    supabase.from('matches').select('*').eq('id', matchId).single(),
    supabase.from('seasons').select('*, teams(*)').eq('id', seasonId).single(),
    supabase.from('matches').select('id').eq('season_id', seasonId).order('played_at'),
  ])

  if (!match || !season) notFound()

  const team = season.teams as { name: string; logo_url?: string | null }
  const template: TacticsTemplate =
    (season as { tactics_template?: TacticsTemplate | null }).tactics_template ?? DEFAULT_TEMPLATE
  const savedTactics = (match as { tactics?: MatchTactics | null }).tactics
  const tactics: MatchTactics = savedTactics ?? emptyMatchTactics(template)
  const matchIndex = (allMatches ?? []).findIndex(m => m.id === matchId)

  const playedAt = new Date(match.played_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <style>{`
        @media print {
          html, body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          .print-sheet { margin: 0 !important; box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        }
        @page { size: A4; margin: 18mm; }
      `}</style>

      {/* Botón volver / imprimir — oculto al imprimir */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        <a
          href={`/dashboard/season/${seasonId}/match/${matchId}`}
          style={{ fontSize: 14, color: '#6b7280', textDecoration: 'none', fontWeight: 600 }}
        >
          ← Volver
        </a>
        <PrintTrigger />
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
          💡 En el diálogo de impresión, desactiva <strong>Encabezados y pies de página</strong> para ocultar la URL
        </span>
      </div>

      {/* Hoja A4 */}
      <div className="print-sheet" style={{
        maxWidth: 640, margin: '32px auto', backgroundColor: '#fff',
        borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '40px 44px',
      }}>
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 900, fontSize: 15, color: '#111', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Jornada: {matchIndex >= 0 ? matchIndex + 1 : '—'}&nbsp;&nbsp;&nbsp;Rival: {match.opponent}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280' }}>
              {playedAt} · {(match as { home?: boolean }).home ? 'Local' : 'Visitante'} · {team.name}
            </p>
          </div>
          {team.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={team.logo_url} alt={team.name} style={{ width: 52, height: 52, objectFit: 'contain' }} />
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1.5px solid #d1d5db', margin: '14px 0 20px' }} />

        {/* Secciones */}
        {template.sections.map((section, sIdx) => {
          const sectionData = tactics.sections[section.id] ?? {}
          return (
            <div key={section.id} style={{ marginTop: sIdx > 0 ? 20 : 0 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 900, fontSize: 13, color: '#111', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {section.title}:
              </p>
              <div style={{ paddingLeft: 8 }}>
                {section.rows.map(row => {
                  const entry = sectionData[row.id] ?? { players: [] }
                  const filled = entry.players.filter(Boolean)
                  return (
                    <div key={row.id} style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 5, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, width: 90, flexShrink: 0, fontSize: 11, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        – {row.role}:
                      </span>
                      <span style={{ fontWeight: 900, color: '#111', letterSpacing: '0.03em' }}>
                        {filled.length > 0
                          ? filled.map((name, i) => (
                              <span key={i}>
                                {i > 0 && <span style={{ fontWeight: 400, color: '#9ca3af', margin: '0 6px' }}>·</span>}
                                {i + 1}. {name}
                              </span>
                            ))
                          : <span style={{ fontWeight: 400, color: '#9ca3af' }}>—</span>
                        }
                      </span>
                      {row.hasExtra && entry.extra && (
                        <span style={{ fontSize: 11, fontStyle: 'italic', color: '#4b5563', marginLeft: 8 }}>
                          Jugada: {entry.extra}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              {sIdx < template.sections.length - 1 && (
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '16px 0 0' }} />
              )}
            </div>
          )
        })}

        {/* Notas */}
        {template.notesCount > 0 && (
          <div style={{ marginTop: 24 }}>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: 16 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: template.notesCount }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontWeight: 900, fontSize: 13, color: '#111', flexShrink: 0 }}>{i + 1}.</span>
                  {tactics.notes[i] ? (
                    <span style={{ fontSize: 13, color: '#111', flex: 1 }}>{tactics.notes[i]}</span>
                  ) : (
                    <span style={{ flex: 1, borderBottom: '1px solid #374151', display: 'block', minHeight: 18 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branding disimulado */}
        <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 9, color: '#d1d5db', letterSpacing: '0.06em', fontWeight: 600, textTransform: 'uppercase' }}>
            Coachly
          </span>
        </div>
      </div>
    </div>
  )
}
