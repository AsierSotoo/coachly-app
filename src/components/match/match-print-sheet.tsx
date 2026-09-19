'use client'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
  status?: 'titular' | 'convocada' | 'no_convocada' | null
}

interface Props {
  teamName: string
  teamLogo?: string | null
  opponent: string
  rivalLogo?: string | null
  dateStr: string
  matchTime?: string | null
  venue?: string | null
  matchIndex: number
  seasonName: string
  players: Player[]
}

function posLine(pos: string | null): 'gk' | 'def' | 'mid' | 'fwd' {
  const p = (pos ?? '').toLowerCase()
  if (p.includes('port')) return 'gk'
  if (p.includes('def')) return 'def'
  if (p.includes('centro') || p.includes('medio') || p.includes('campist') || p.includes('mid')) return 'mid'
  return 'fwd'
}

function initials(name: string) {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function MatchPrintSheet({
  teamName, teamLogo, opponent, rivalLogo,
  dateStr, matchTime, venue, matchIndex, seasonName, players
}: Props) {

  const titulares = players.filter(p => p.status === 'titular').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const convocadas = players.filter(p => p.status === 'convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const hasConvocatoria = titulares.length > 0 || convocadas.length > 0
  const allAvailable = hasConvocatoria
    ? [...titulares, ...convocadas]
    : players.filter(p => p.status !== 'no_convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))

  // Group titulares/all available by line for pitch display
  const pitchPlayers = hasConvocatoria ? titulares : allAvailable.slice(0, 11)
  const gkLine  = pitchPlayers.filter(p => posLine(p.position) === 'gk')
  const defLine = pitchPlayers.filter(p => posLine(p.position) === 'def')
  const midLine = pitchPlayers.filter(p => posLine(p.position) === 'mid')
  const fwdLine = pitchPlayers.filter(p => posLine(p.position) === 'fwd')

  function renderPitchRow(pts: Player[], style?: React.CSSProperties) {
    if (pts.length === 0) return null
    const spread = 100 / (pts.length + 1)
    return pts.map((p, i) => (
      <div key={p.id} style={{
        position: 'absolute',
        left: `${spread * (i + 1)}%`,
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        ...style,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2px solid black', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: 'black',
        }}>
          {p.number ?? '?'}
        </div>
        <span style={{ fontSize: 8, fontWeight: 700, textAlign: 'center', maxWidth: 40, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'white' }}>
          {p.name.split(' ')[0]}
        </span>
      </div>
    ))
  }

  return (
    <>
      {/* Print trigger button — visible only on screen */}
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer"
        style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)', backgroundColor: 'var(--bg-elevated)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>print</span>
        Imprimir hoja del partido
      </button>

      {/* Print-only content — hidden on screen */}
      <div className="match-print-sheet" style={{ display: 'none' }}>
        <style>{`
          @media print {
            body > * { visibility: hidden !important; }
            .match-print-sheet { visibility: visible !important; display: block !important; position: fixed !important; inset: 0 !important; background: white !important; padding: 24px !important; font-family: Arial, sans-serif !important; }
            .match-print-sheet * { visibility: visible !important; }
            @page { margin: 0; size: A4 portrait; }
          }
        `}</style>

        {/* Header */}
        <div style={{ borderBottom: '2px solid black', paddingBottom: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#555' }}>
              {seasonName}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#555' }}>
              Jornada {matchIndex + 1}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            {/* Team */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              {teamLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={teamLogo} alt={teamName} style={{ width: 48, height: 48, objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 48, height: 48, border: '2px solid black', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                  {initials(teamName)}
                </div>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{teamName}</span>
            </div>

            {/* VS + date */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>VS</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#444', textTransform: 'capitalize' }}>{dateStr}</div>
              {matchTime && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>{matchTime}h</div>}
              {venue && <div style={{ fontSize: 9, color: '#666', marginTop: 2 }}>{venue}</div>}
            </div>

            {/* Rival */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              {rivalLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={rivalLogo} alt={opponent} style={{ width: 48, height: 48, objectFit: 'contain' }} />
              ) : (
                <div style={{ width: 48, height: 48, border: '2px solid black', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                  {initials(opponent)}
                </div>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{opponent}</span>
            </div>
          </div>
        </div>

        {/* Body: pitch + player list side by side */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Pitch */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, color: '#555' }}>
              {hasConvocatoria ? `Once titular (${titulares.length})` : 'Plantilla'}
            </div>
            <div style={{
              position: 'relative', width: 200, height: 300,
              background: '#1a5232', borderRadius: 6,
              border: '2px solid #1a5232', overflow: 'hidden',
            }}>
              {/* Field markings */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.2 }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'white' }} />
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 56, height: 56, borderRadius: '50%', border: '1px solid white' }} />
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '22%', borderTop: '1px solid white', borderLeft: '1px solid white', borderRight: '1px solid white' }} />
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: '22%', borderBottom: '1px solid white', borderLeft: '1px solid white', borderRight: '1px solid white' }} />
              </div>

              {/* Player rows — from top (attack) to bottom (GK) */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '8px 0' }}>
                {fwdLine.length > 0 && (
                  <div style={{ position: 'relative', height: 44 }}>
                    {renderPitchRow(fwdLine)}
                  </div>
                )}
                {midLine.length > 0 && (
                  <div style={{ position: 'relative', height: 44 }}>
                    {renderPitchRow(midLine)}
                  </div>
                )}
                {defLine.length > 0 && (
                  <div style={{ position: 'relative', height: 44 }}>
                    {renderPitchRow(defLine)}
                  </div>
                )}
                {gkLine.length > 0 && (
                  <div style={{ position: 'relative', height: 44 }}>
                    {renderPitchRow(gkLine)}
                  </div>
                )}
                {fwdLine.length === 0 && midLine.length === 0 && defLine.length === 0 && gkLine.length === 0 && (
                  <div style={{ position: 'relative', height: 280 }}>
                    {pitchPlayers.map((p, i) => {
                      const cols = Math.min(pitchPlayers.length, 4)
                      const col = i % cols
                      const row = Math.floor(i / cols)
                      return (
                        <div key={p.id} style={{
                          position: 'absolute',
                          left: `${(col + 0.5) * (100 / cols)}%`,
                          top: `${row * 40 + 16}px`,
                          transform: 'translateX(-50%)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                        }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid black', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: 'black' }}>
                            {p.number ?? '?'}
                          </div>
                          <span style={{ fontSize: 8, fontWeight: 700, color: 'white', whiteSpace: 'nowrap' }}>{p.name.split(' ')[0]}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Player lists */}
          <div style={{ flex: 1 }}>
            {hasConvocatoria ? (
              <>
                {titulares.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, paddingBottom: 3, borderBottom: '1px solid #ddd', color: '#333' }}>
                      Titulares ({titulares.length})
                    </div>
                    {titulares.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, minWidth: 22, textAlign: 'right', color: '#333' }}>{p.number ?? '–'}</span>
                        <span style={{ fontSize: 11, flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: 9, color: '#888' }}>{p.position ?? ''}</span>
                        <span style={{ width: 14, height: 14, border: '1px solid #999', borderRadius: 2, flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
                {convocadas.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, paddingBottom: 3, borderBottom: '1px solid #ddd', color: '#333' }}>
                      Suplentes ({convocadas.length})
                    </div>
                    {convocadas.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ fontSize: 10, fontWeight: 900, minWidth: 22, textAlign: 'right', color: '#333' }}>{p.number ?? '–'}</span>
                        <span style={{ fontSize: 11, flex: 1 }}>{p.name}</span>
                        <span style={{ fontSize: 9, color: '#888' }}>{p.position ?? ''}</span>
                        <span style={{ width: 14, height: 14, border: '1px solid #999', borderRadius: 2, flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, paddingBottom: 3, borderBottom: '1px solid #ddd', color: '#333' }}>
                  Plantilla ({players.length})
                </div>
                {players.sort((a, b) => (a.number ?? 99) - (b.number ?? 99)).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, minWidth: 22, textAlign: 'right', color: '#333' }}>{p.number ?? '–'}</span>
                    <span style={{ fontSize: 11, flex: 1 }}>{p.name}</span>
                    <span style={{ fontSize: 9, color: '#888' }}>{p.position ?? ''}</span>
                    <span style={{ width: 14, height: 14, border: '1px solid #999', borderRadius: 2, flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginTop: 12, borderTop: '1px solid #ddd', paddingTop: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, color: '#555' }}>Notas</div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 20, borderBottom: '1px solid #ddd', marginBottom: 4 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 8, color: '#aaa', textAlign: 'center' }}>
          Generado con Coachly · coachly.app
        </div>
      </div>
    </>
  )
}
