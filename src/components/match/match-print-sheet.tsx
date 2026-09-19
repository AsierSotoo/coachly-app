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
  const byLine = { gk: [], def: [], mid: [], fwd: [] } as Record<string, Player[]>
  for (const p of titulares) byLine[posLine(p.position)].push(p)
  for (const key of Object.keys(byLine)) byLine[key].sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  let num = 1
  const result: PlayerWithSeq[] = []
  for (const line of ['gk', 'def', 'mid', 'fwd'] as const) {
    for (const p of byLine[line]) result.push({ ...p, seqNum: num++, line })
  }
  return result
}

function PitchRow({ players, style }: { players: PlayerWithSeq[]; style?: React.CSSProperties }) {
  if (players.length === 0) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-evenly', alignItems: 'center',
      ...style,
    }}>
      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            border: '2px solid black', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900, color: 'black', flexShrink: 0,
          }}>
            {p.seqNum}
          </div>
          <span style={{
            fontSize: 7, fontWeight: 700, textAlign: 'center',
            maxWidth: 38, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            color: 'white',
          }}>
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  )
}

export function MatchPrintSheet({
  teamName, teamLogo, opponent, rivalLogo,
  dateStr, matchTime, venue, matchIndex, seasonName, players,
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

  const gkRow  = numbered.filter(p => p.line === 'gk')
  const defRow = numbered.filter(p => p.line === 'def')
  const midRow = numbered.filter(p => p.line === 'mid')
  const fwdRow = numbered.filter(p => p.line === 'fwd')

  // Subs get sequential numbers from 12 onward
  const subsWithNum = subs.map((p, i) => ({ ...p, seqNum: startingEleven.length + 1 + i }))

  // Format date short: DD/MM/YY
  const dateShort = (() => {
    const today = new Date()
    const d = today.getDate().toString().padStart(2, '0')
    const m = (today.getMonth() + 1).toString().padStart(2, '0')
    const y = today.getFullYear().toString().slice(2)
    return `${d}/${m}/${y}`
  })()

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

      {/* Print-only content */}
      <div className="match-print-sheet" style={{ display: 'none' }}>
        <style>{`
          @media print {
            body > * { visibility: hidden !important; }
            .match-print-sheet {
              visibility: visible !important;
              display: block !important;
              position: fixed !important;
              inset: 0 !important;
              background: white !important;
              padding: 20px 24px !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }
            .match-print-sheet * { visibility: visible !important; }
            @page { margin: 0; size: A4 portrait; }
          }
        `}</style>

        {/* ── CABECERA ──────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' }}>
            PLANTILLA PARTIDOS
          </div>
          {teamLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teamLogo} alt={teamName} style={{ width: 52, height: 52, objectFit: 'contain' }} />
          ) : (
            <div style={{
              width: 52, height: 52, border: '2px solid black', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 900,
            }}>
              {teamName.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
          )}
        </div>

        {/* ── TABLA INFO DEL PARTIDO ──────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {[
                { label: 'JORNADA', width: '28%' },
                { label: 'FECHA',   width: '28%' },
                { label: 'CONTRARIO', width: '44%' },
              ].map(col => (
                <th key={col.label} style={{
                  border: '1px solid black', padding: '4px 8px',
                  fontSize: 9, fontWeight: 700, textAlign: 'left',
                  width: col.width, backgroundColor: '#f0f0f0',
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid black', padding: '5px 8px', fontSize: 11, fontWeight: 600 }}>
                {seasonName} J{matchIndex + 1}
              </td>
              <td style={{ border: '1px solid black', padding: '5px 8px', fontSize: 11, fontWeight: 600 }}>
                {dateShort}{matchTime ? ` · ${matchTime}h` : ''}
              </td>
              <td style={{ border: '1px solid black', padding: '5px 8px', fontSize: 11, fontWeight: 700 }}>
                {opponent}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── CUERPO: CAMPO + LISTA ────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Campo */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{
              position: 'relative', width: 200, height: 310,
              backgroundColor: '#1a5232', borderRadius: 4,
              border: '2px solid black', overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', padding: '10px 4px',
            }}>
              {/* Marcas del campo */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
                {/* Línea de medio campo */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: 'white' }} />
                {/* Círculo central */}
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 50, height: 50, borderRadius: '50%', border: '1px solid white' }} />
                {/* Área grande arriba (nuestra portería) */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '65%', height: '18%', borderBottom: '1px solid white', borderLeft: '1px solid white', borderRight: '1px solid white' }} />
                {/* Área pequeña arriba */}
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '35%', height: '9%', borderBottom: '1px solid white', borderLeft: '1px solid white', borderRight: '1px solid white' }} />
                {/* Área grande abajo (rival) */}
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '65%', height: '18%', borderTop: '1px solid white', borderLeft: '1px solid white', borderRight: '1px solid white' }} />
                {/* Área pequeña abajo */}
                <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '35%', height: '9%', borderTop: '1px solid white', borderLeft: '1px solid white', borderRight: '1px solid white' }} />
              </div>

              {/* GK (arriba, defiende) */}
              <PitchRow players={gkRow} />

              {/* Defensas */}
              <PitchRow players={defRow} />

              {/* Medios */}
              <PitchRow players={midRow} />

              {/* Delanteros */}
              <PitchRow players={fwdRow} />

              {/* Slot vacío si sólo hay 3 líneas de campo */}
              {fwdRow.length === 0 && <div />}
            </div>
          </div>

          {/* Lista de jugadoras */}
          <div style={{ flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {/* Titulares */}
                {numbered.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{
                      border: '1px solid black',
                      borderBottom: i === numbered.length - 1 && subsWithNum.length > 0 ? '3px solid black' : '1px solid black',
                      padding: '4px 6px',
                      width: 28, textAlign: 'center',
                      fontSize: 10, fontWeight: 900, color: '#222',
                    }}>
                      {p.seqNum}
                    </td>
                    <td style={{
                      border: '1px solid black',
                      borderBottom: i === numbered.length - 1 && subsWithNum.length > 0 ? '3px solid black' : '1px solid black',
                      padding: '4px 8px',
                      fontSize: 11, fontWeight: 500,
                    }}>
                      {p.name}
                    </td>
                  </tr>
                ))}

                {/* Separador visual si no hay suplentes */}
                {numbered.length > 0 && subsWithNum.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ border: '1px solid black', backgroundColor: '#000', height: 4 }} />
                  </tr>
                )}

                {/* Suplentes */}
                {subsWithNum.map(p => (
                  <tr key={p.id}>
                    <td style={{
                      border: '1px solid black', padding: '4px 6px',
                      width: 28, textAlign: 'center',
                      fontSize: 10, fontWeight: 900, color: '#555',
                    }}>
                      {p.seqNum}
                    </td>
                    <td style={{
                      border: '1px solid black', padding: '4px 8px',
                      fontSize: 11, fontWeight: 500, color: '#333',
                    }}>
                      {p.name}
                    </td>
                  </tr>
                ))}

                {/* Filas vacías para anotar a mano */}
                {Array.from({ length: Math.max(0, 16 - numbered.length - subsWithNum.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ border: '1px solid black', padding: '4px 6px', width: 28, height: 22 }} />
                    <td style={{ border: '1px solid black', padding: '4px 8px' }} />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notas */}
            <div style={{ marginTop: 10, borderTop: '1px solid #ccc', paddingTop: 6 }}>
              <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, color: '#555' }}>
                Notas
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 18, borderBottom: '1px solid #ccc', marginBottom: 3 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 12, paddingTop: 6, borderTop: '1px solid #eee', fontSize: 7, color: '#bbb', textAlign: 'center' }}>
          Generado con Coachly · {teamName} · {opponent}
        </div>
      </div>
    </>
  )
}
