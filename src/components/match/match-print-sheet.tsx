'use client'

interface Player {
  id: string
  name: string
  number: number | null
  position: string | null
  status?: 'titular' | 'convocada' | 'no_convocada' | null
}

interface PlayerWithSeq extends Player {
  seqNum: number
  line: 'gk' | 'def' | 'mid' | 'fwd'
}

interface Props {
  teamName: string
  teamLogo?: string | null
  opponent: string
  rivalLogo?: string | null
  dateStr: string
  playedAt: string
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

function assignSequentialNumbers(titulares: Player[]): PlayerWithSeq[] {
  const byLine: Record<string, Player[]> = { gk: [], def: [], mid: [], fwd: [] }
  for (const p of titulares) byLine[posLine(p.position)].push(p)
  for (const key of Object.keys(byLine)) byLine[key].sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  let num = 1
  const result: PlayerWithSeq[] = []
  for (const line of ['gk', 'def', 'mid', 'fwd'] as const) {
    for (const p of byLine[line]) result.push({ ...p, seqNum: num++, line })
  }
  return result
}

function PitchRow({ players }: { players: PlayerWithSeq[] }) {
  if (players.length === 0) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid #111', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 900, color: '#111', flexShrink: 0,
          }}>
            {p.seqNum}
          </div>
          <span style={{
            fontSize: 6.5, fontWeight: 700, textAlign: 'center',
            maxWidth: 36, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            color: '#111',
          }}>
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MatchPrintSheet({
  teamName, teamLogo, opponent,
  playedAt, matchTime, matchIndex, seasonName, players,
}: Props) {

  const titulares  = players.filter(p => p.status === 'titular').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const convocadas = players.filter(p => p.status === 'convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const hasConvocatoria = titulares.length > 0 || convocadas.length > 0
  const allAvailable = hasConvocatoria
    ? [...titulares, ...convocadas]
    : players.filter(p => p.status !== 'no_convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))

  const startingEleven = hasConvocatoria ? titulares : allAvailable.slice(0, 11)
  const numbered = assignSequentialNumbers(startingEleven)
  const subs = hasConvocatoria ? convocadas : allAvailable.slice(11)
  const subsWithNum = subs.map((p, i) => ({ ...p, seqNum: startingEleven.length + 1 + i }))

  const gkRow  = numbered.filter(p => p.line === 'gk')
  const defRow = numbered.filter(p => p.line === 'def')
  const midRow = numbered.filter(p => p.line === 'mid')
  const fwdRow = numbered.filter(p => p.line === 'fwd')

  // Fecha real del partido
  const d = new Date(playedAt + 'T12:00:00')
  const dateShort = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`

  const FIELD_COLOR = '#111'
  const FIELD_BG    = '#f9fafb'
  const MARK_OP     = 1

  return (
    <>
      {/* Botón pantalla */}
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer"
        style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)', backgroundColor: 'var(--bg-elevated)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>print</span>
        Imprimir hoja del partido
      </button>

      {/* Contenido impresión */}
      <div className="match-print-sheet" style={{ display: 'none' }}>
        <style>{`
          @media print {
            html { height: auto; }
            body { height: 0 !important; overflow: hidden !important; margin: 0 !important; }
            .match-print-sheet {
              display: block !important;
              position: fixed !important;
              inset: 0 !important;
              background: white !important;
              padding: 14px 18px !important;
              font-family: Arial, Helvetica, sans-serif !important;
              overflow: hidden !important;
              visibility: visible !important;
              z-index: 99999 !important;
            }
            .match-print-sheet * { visibility: visible !important; }
            @page { margin: 0; size: A4 portrait; }
          }
        `}</style>

        {/* ── CABECERA ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase', color: '#111' }}>
            PLANTILLA PARTIDOS
          </div>
          {teamLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teamLogo} alt={teamName} style={{ width: 48, height: 48, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 48, height: 48, border: '2px solid #111', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 900, color: '#111' }}>
              {teamName.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
          )}
        </div>

        {/* ── TABLA INFO ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {[{ label: 'JORNADA', w: '26%' }, { label: 'FECHA', w: '28%' }, { label: 'CONTRARIO', w: '46%' }].map(col => (
                <th key={col.label} style={{
                  border: '1px solid #aaa', padding: '3px 7px',
                  fontSize: 8, fontWeight: 800, textAlign: 'left',
                  width: col.w, backgroundColor: '#e8e8e8', color: '#111',
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #aaa', padding: '4px 7px', fontSize: 11, fontWeight: 700, color: '#111' }}>
                {seasonName} J{matchIndex + 1}
              </td>
              <td style={{ border: '1px solid #aaa', padding: '4px 7px', fontSize: 11, fontWeight: 700, color: '#111' }}>
                {dateShort}{matchTime ? ` · ${matchTime}h` : ''}
              </td>
              <td style={{ border: '1px solid #aaa', padding: '4px 7px', fontSize: 11, fontWeight: 800, color: '#111' }}>
                {opponent}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── CUERPO ── */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>

          {/* Campo */}
          <div style={{ width: 188, flexShrink: 0 }}>
            <div style={{
              position: 'relative', width: 188, height: 298,
              backgroundColor: FIELD_BG,
              border: `2px solid ${FIELD_COLOR}`,
              overflow: 'visible',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', padding: '12px 4px',
            }}>
              {/* Marcas */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: MARK_OP }}>
                {/* Portería arriba */}
                <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                  width: '32%', height: 9, border: `2px solid ${FIELD_COLOR}`, borderTop: 'none',
                  backgroundColor: FIELD_BG }} />
                {/* Portería abajo */}
                <div style={{ position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                  width: '32%', height: 9, border: `2px solid ${FIELD_COLOR}`, borderBottom: 'none',
                  backgroundColor: FIELD_BG }} />
                {/* Área grande arriba */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '65%', height: '18%', borderBottom: `1.5px solid ${FIELD_COLOR}`,
                  borderLeft: `1.5px solid ${FIELD_COLOR}`, borderRight: `1.5px solid ${FIELD_COLOR}` }} />
                {/* Área pequeña arriba */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '36%', height: '9%', borderBottom: `1.5px solid ${FIELD_COLOR}`,
                  borderLeft: `1.5px solid ${FIELD_COLOR}`, borderRight: `1.5px solid ${FIELD_COLOR}` }} />
                {/* Punto penal arriba */}
                <div style={{ position: 'absolute', top: '12%', left: '50%',
                  transform: 'translate(-50%, -50%)', width: 3, height: 3,
                  borderRadius: '50%', backgroundColor: FIELD_COLOR }} />
                {/* Línea medio */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, backgroundColor: FIELD_COLOR }} />
                {/* Círculo central */}
                <div style={{ position: 'absolute', left: '50%', top: '50%',
                  transform: 'translate(-50%,-50%)', width: 52, height: 52,
                  borderRadius: '50%', border: `1.5px solid ${FIELD_COLOR}` }} />
                {/* Punto central */}
                <div style={{ position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)', width: 3, height: 3,
                  borderRadius: '50%', backgroundColor: FIELD_COLOR }} />
                {/* Área grande abajo */}
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '65%', height: '18%', borderTop: `1.5px solid ${FIELD_COLOR}`,
                  borderLeft: `1.5px solid ${FIELD_COLOR}`, borderRight: `1.5px solid ${FIELD_COLOR}` }} />
                {/* Área pequeña abajo */}
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: '36%', height: '9%', borderTop: `1.5px solid ${FIELD_COLOR}`,
                  borderLeft: `1.5px solid ${FIELD_COLOR}`, borderRight: `1.5px solid ${FIELD_COLOR}` }} />
                {/* Punto penal abajo */}
                <div style={{ position: 'absolute', bottom: '12%', left: '50%',
                  transform: 'translate(-50%, 50%)', width: 3, height: 3,
                  borderRadius: '50%', backgroundColor: FIELD_COLOR }} />
                {/* Arco esquina sup-izq */}
                <div style={{ position: 'absolute', top: -6, left: -6, width: 12, height: 12,
                  borderRadius: '50%', border: `1px solid ${FIELD_COLOR}` }} />
                {/* Arco esquina sup-der */}
                <div style={{ position: 'absolute', top: -6, right: -6, width: 12, height: 12,
                  borderRadius: '50%', border: `1px solid ${FIELD_COLOR}` }} />
                {/* Arco esquina inf-izq */}
                <div style={{ position: 'absolute', bottom: -6, left: -6, width: 12, height: 12,
                  borderRadius: '50%', border: `1px solid ${FIELD_COLOR}` }} />
                {/* Arco esquina inf-der */}
                <div style={{ position: 'absolute', bottom: -6, right: -6, width: 12, height: 12,
                  borderRadius: '50%', border: `1px solid ${FIELD_COLOR}` }} />
              </div>

              <PitchRow players={gkRow} />
              <PitchRow players={defRow} />
              <PitchRow players={midRow} />
              <PitchRow players={fwdRow} />
              {fwdRow.length === 0 && <div />}
            </div>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {numbered.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{
                      border: '1px solid #aaa',
                      borderBottom: i === numbered.length - 1 && subsWithNum.length > 0 ? '3px solid #111' : '1px solid #aaa',
                      padding: '3px 5px', width: 24, textAlign: 'center',
                      fontSize: 9, fontWeight: 900, color: '#111',
                    }}>{p.seqNum}</td>
                    <td style={{
                      border: '1px solid #aaa',
                      borderBottom: i === numbered.length - 1 && subsWithNum.length > 0 ? '3px solid #111' : '1px solid #aaa',
                      padding: '3px 7px', fontSize: 10, fontWeight: 600, color: '#111',
                    }}>{p.name}</td>
                  </tr>
                ))}

                {numbered.length > 0 && subsWithNum.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid #aaa', backgroundColor: '#111', height: 3 }} />
                  </tr>
                )}

                {subsWithNum.map(p => (
                  <tr key={p.id}>
                    <td style={{ border: '1px solid #aaa', padding: '3px 5px', width: 24, textAlign: 'center',
                      fontSize: 9, fontWeight: 900, color: '#444' }}>{p.seqNum}</td>
                    <td style={{ border: '1px solid #aaa', padding: '3px 7px', fontSize: 10, fontWeight: 500, color: '#333' }}>
                      {p.name}
                    </td>
                  </tr>
                ))}

                {Array.from({ length: Math.max(0, 16 - numbered.length - subsWithNum.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ border: '1px solid #aaa', padding: '3px 5px', width: 24, height: 20 }} />
                    <td style={{ border: '1px solid #aaa', padding: '3px 7px' }} />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notas */}
            <div style={{ marginTop: 8, borderTop: '1px solid #ccc', paddingTop: 5 }}>
              <div style={{ fontSize: 7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, color: '#555' }}>
                Notas
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 16, borderBottom: '1px solid #ccc', marginBottom: 3 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 10, paddingTop: 5, borderTop: '1px solid #ddd',
          fontSize: 7, color: '#999', textAlign: 'center' }}>
          Generado con Coachly · {teamName} · {opponent}
        </div>
      </div>
    </>
  )
}
