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

function PitchRow({ players, fieldH }: { players: PlayerWithSeq[]; fieldH: number }) {
  if (players.length === 0) return null
  // Ajustar tamaño de círculo según número de jugadoras en la fila
  const circleSize = players.length >= 5 ? 22 : 26
  const fontSize   = players.length >= 5 ? 8   : 9.5
  const nameSize   = players.length >= 5 ? 5.5 : 6.5
  const maxW       = players.length >= 5 ? 30  : 38
  return (
    <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <div style={{
            width: circleSize, height: circleSize, borderRadius: '50%',
            border: '2px solid #111', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize, fontWeight: 900, color: '#111', flexShrink: 0,
          }}>
            {p.seqNum}
          </div>
          <span style={{
            fontSize: nameSize, fontWeight: 700, textAlign: 'center',
            maxWidth: maxW, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            color: '#222', lineHeight: 1,
          }}>
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  )
}

const C = '#111'   // color líneas campo
const BG = '#f5f5f5' // fondo campo

export function MatchPrintSheet({
  teamName, teamLogo, opponent,
  playedAt, matchTime, matchIndex, seasonName, players,
}: Props) {

  const titulares  = players.filter(p => p.status === 'titular').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const convocadas = players.filter(p => p.status === 'convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const hasConv    = titulares.length > 0 || convocadas.length > 0
  const allAvail   = hasConv
    ? [...titulares, ...convocadas]
    : players.filter(p => p.status !== 'no_convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))

  const eleven     = hasConv ? titulares : allAvail.slice(0, 11)
  const numbered   = assignSequentialNumbers(eleven)
  const subs       = hasConv ? convocadas : allAvail.slice(11)
  const subsNum    = subs.map((p, i) => ({ ...p, seqNum: eleven.length + 1 + i }))

  const gkRow  = numbered.filter(p => p.line === 'gk')
  const defRow = numbered.filter(p => p.line === 'def')
  const midRow = numbered.filter(p => p.line === 'mid')
  const fwdRow = numbered.filter(p => p.line === 'fwd')

  const d = new Date(playedAt + 'T12:00:00')
  const dateShort = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`

  // Dimensiones del campo (en px a 96dpi)
  const FW = 230  // ancho campo
  const FH = 370  // alto campo — protagonista

  // Filas de la lista: calcular cuántas caben en la altura del campo
  const totalPlayers = numbered.length + subsNum.length
  // Filas vacías para rellenar hasta la altura del campo
  const rowH = 15  // px por fila (súper compacta)
  const listH = FH - 28 // descontar notas
  const fillerRows = Math.max(0, Math.floor(listH / rowH) - totalPlayers - 1)

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

      {/* Print-only */}
      <div className="match-print-sheet" style={{ display: 'none' }}>
        <style>{`
          @media print {
            html, body {
              height: 297mm !important;
              max-height: 297mm !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body * { visibility: hidden !important; }
            .match-print-sheet {
              visibility: visible !important;
              display: block !important;
              position: absolute !important;
              top: 0 !important; left: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              overflow: hidden !important;
              background: white !important;
              padding: 10mm 11mm !important;
              font-family: Arial, Helvetica, sans-serif !important;
              box-sizing: border-box !important;
            }
            .match-print-sheet * { visibility: visible !important; }
            @page { margin: 0; size: A4 portrait; }
          }
        `}</style>

        {/* ── CABECERA ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#111' }}>
            PLANTILLA PARTIDOS
          </div>
          {teamLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teamLogo} alt={teamName} style={{ width: 44, height: 44, objectFit: 'contain' }} />
          ) : (
            <div style={{ width: 44, height: 44, border: '2px solid #111', borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 900, color: '#111' }}>
              {teamName.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </div>
          )}
        </div>

        {/* ── INFO ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {[{ l: 'JORNADA', w: '25%' }, { l: 'FECHA', w: '27%' }, { l: 'CONTRARIO', w: '48%' }].map(col => (
                <th key={col.l} style={{ border: '1px solid #999', padding: '2px 6px',
                  fontSize: 7.5, fontWeight: 800, textAlign: 'left', width: col.w,
                  backgroundColor: '#e0e0e0', color: '#111' }}>
                  {col.l}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #999', padding: '3px 6px', fontSize: 10, fontWeight: 700, color: '#111' }}>
                {seasonName} J{matchIndex + 1}
              </td>
              <td style={{ border: '1px solid #999', padding: '3px 6px', fontSize: 10, fontWeight: 700, color: '#111' }}>
                {dateShort}{matchTime ? ` · ${matchTime}h` : ''}
              </td>
              <td style={{ border: '1px solid #999', padding: '3px 6px', fontSize: 10, fontWeight: 800, color: '#111' }}>
                {opponent}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── CUERPO: CAMPO (estrella) + LISTA ── */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

          {/* CAMPO — protagonista */}
          <div style={{
            position: 'relative', width: FW, height: FH, flexShrink: 0,
            backgroundColor: BG, border: `2.5px solid ${C}`,
            overflow: 'visible',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', padding: '14px 4px',
          }}>
            {/* Marcas del campo */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              {/* Portería arriba */}
              <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
                width: '30%', height: 10, border: `2.5px solid ${C}`, borderTop: 'none',
                backgroundColor: 'white' }} />
              {/* Portería abajo */}
              <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
                width: '30%', height: 10, border: `2.5px solid ${C}`, borderBottom: 'none',
                backgroundColor: 'white' }} />
              {/* Área grande arriba */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '65%', height: '17%',
                borderBottom: `1.5px solid ${C}`, borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}` }} />
              {/* Área pequeña arriba */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '36%', height: '8.5%',
                borderBottom: `1.5px solid ${C}`, borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}` }} />
              {/* Punto penal arriba */}
              <div style={{ position: 'absolute', top: '11.5%', left: '50%',
                transform: 'translate(-50%, -50%)', width: 3.5, height: 3.5,
                borderRadius: '50%', backgroundColor: C }} />
              {/* Línea medio */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, backgroundColor: C }} />
              {/* Círculo central */}
              <div style={{ position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%,-50%)', width: 58, height: 58,
                borderRadius: '50%', border: `1.5px solid ${C}` }} />
              {/* Punto central */}
              <div style={{ position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%,-50%)', width: 3.5, height: 3.5,
                borderRadius: '50%', backgroundColor: C }} />
              {/* Área grande abajo */}
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '65%', height: '17%',
                borderTop: `1.5px solid ${C}`, borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}` }} />
              {/* Área pequeña abajo */}
              <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: '36%', height: '8.5%',
                borderTop: `1.5px solid ${C}`, borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}` }} />
              {/* Punto penal abajo */}
              <div style={{ position: 'absolute', bottom: '11.5%', left: '50%',
                transform: 'translate(-50%, 50%)', width: 3.5, height: 3.5,
                borderRadius: '50%', backgroundColor: C }} />
              {/* Arcos de esquina */}
              {[{ top: -7, left: -7 }, { top: -7, right: -7 }, { bottom: -7, left: -7 }, { bottom: -7, right: -7 }].map((s, i) => (
                <div key={i} style={{ position: 'absolute', ...s, width: 14, height: 14,
                  borderRadius: '50%', border: `1.5px solid ${C}` }} />
              ))}
            </div>

            <PitchRow players={gkRow}  fieldH={FH} />
            <PitchRow players={defRow} fieldH={FH} />
            <PitchRow players={midRow} fieldH={FH} />
            <PitchRow players={fwdRow} fieldH={FH} />
            {fwdRow.length === 0 && <div />}
          </div>

          {/* LISTA — compacta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {numbered.map((p, i) => {
                  const isLastTitular = i === numbered.length - 1 && subsNum.length > 0
                  return (
                    <tr key={p.id}>
                      <td style={{
                        border: '1px solid #bbb',
                        borderBottom: isLastTitular ? '2.5px solid #111' : '1px solid #bbb',
                        padding: '1px 4px', width: 20, textAlign: 'center',
                        fontSize: 8, fontWeight: 900, color: '#111', lineHeight: `${rowH}px`,
                      }}>{p.seqNum}</td>
                      <td style={{
                        border: '1px solid #bbb',
                        borderBottom: isLastTitular ? '2.5px solid #111' : '1px solid #bbb',
                        padding: '1px 6px', fontSize: 9, fontWeight: 600, color: '#111', lineHeight: `${rowH}px`,
                      }}>{p.name}</td>
                    </tr>
                  )
                })}

                {numbered.length > 0 && subsNum.length === 0 && (
                  <tr><td colSpan={2} style={{ backgroundColor: '#111', height: 2.5 }} /></tr>
                )}

                {subsNum.map(p => (
                  <tr key={p.id}>
                    <td style={{ border: '1px solid #bbb', padding: '1px 4px', width: 20,
                      textAlign: 'center', fontSize: 8, fontWeight: 900, color: '#555', lineHeight: `${rowH}px` }}>
                      {p.seqNum}
                    </td>
                    <td style={{ border: '1px solid #bbb', padding: '1px 6px',
                      fontSize: 9, fontWeight: 500, color: '#333', lineHeight: `${rowH}px` }}>
                      {p.name}
                    </td>
                  </tr>
                ))}

                {/* Filas vacías ajustadas al campo */}
                {Array.from({ length: fillerRows }).map((_, i) => (
                  <tr key={`f-${i}`}>
                    <td style={{ border: '1px solid #bbb', width: 20, height: rowH }} />
                    <td style={{ border: '1px solid #bbb', height: rowH }} />
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notas */}
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 6.5, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: 1, marginBottom: 3, color: '#666' }}>Notas</div>
              {[1, 2].map(i => (
                <div key={i} style={{ height: 13, borderBottom: '1px solid #ccc', marginBottom: 2 }} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 8, paddingTop: 4, borderTop: '1px solid #ddd',
          fontSize: 6.5, color: '#aaa', textAlign: 'center' }}>
          Generado con Coachly · {teamName} · {opponent}
        </div>
      </div>
    </>
  )
}
