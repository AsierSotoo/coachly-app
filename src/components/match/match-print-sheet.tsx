'use client'

import { FORMATIONS } from '@/lib/formations'

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
  formation?: string | null
  pitchPositions?: Record<string, string>
}

function posLine(pos: string | null): 'gk' | 'def' | 'mid' | 'fwd' {
  const p = (pos ?? '').toLowerCase()
  if (p.includes('port') || p === 'po') return 'gk'
  if (p.includes('def') || p.includes('dfc') || p.includes('ld') || p.includes('li')) return 'def'
  if (p.includes('centro') || p.includes('medio') || p.includes('campist') || p.includes('mc') || p.includes('mid') || p.includes('md') || p.includes('mi') || p.includes('mcd')) return 'mid'
  return 'fwd'
}

const POS_NUMS: Record<string, number[]> = {
  gk:  [1, 13, 25],
  def: [2, 3, 4, 5],
  mid: [6, 8, 10],
  fwd: [7, 9, 11],
}

// Número posicional fijo por slot de formación (siempre el mismo, independiente del jugador)
const SLOT_NUM: Record<string, number> = {
  PO: 1,
  LD: 2,  LI: 3,
  DFC1: 4, DFC2: 5, DFC3: 3,
  MCD: 6,  MCD1: 6, MCD2: 8,
  MC1: 8,  MC2: 10, MC3: 6,
  MCO: 10, MCO1: 10, MCO2: 8,
  MD: 7,   MI: 11,
  ED: 7,   EI: 11,
  DC: 9,   DC1: 9, DC2: 11,
}

function lineFromSlot(slotId: string): 'gk' | 'def' | 'mid' | 'fwd' {
  if (slotId === 'PO') return 'gk'
  if (['LD','LI','DFC1','DFC2','DFC3'].includes(slotId)) return 'def'
  if (['MCD','MCD1','MCD2','MC1','MC2','MC3','MCO','MCO1','MCO2','MD','MI'].includes(slotId)) return 'mid'
  return 'fwd'
}

function assignSeq(starters: Player[]): PlayerWithSeq[] {
  const byLine: Record<string, Player[]> = { gk: [], def: [], mid: [], fwd: [] }
  for (const p of starters) byLine[posLine(p.position)].push(p)
  for (const k of Object.keys(byLine)) byLine[k].sort((a, b) => (a.number ?? 99) - (b.number ?? 99))

  // Primera pasada: asignar números posicionales de POS_NUMS
  const used = new Set<number>()
  const out: PlayerWithSeq[] = []
  const overflow: Array<{ p: Player; line: 'gk' | 'def' | 'mid' | 'fwd' }> = []

  for (const line of ['gk', 'def', 'mid', 'fwd'] as const) {
    const nums = POS_NUMS[line]
    byLine[line].forEach((p, i) => {
      if (i < nums.length) {
        used.add(nums[i])
        out.push({ ...p, seqNum: nums[i], line })
      } else {
        overflow.push({ p, line })
      }
    })
  }

  // Segunda pasada: overflow usa el primer número 1-11 libre
  const pool = [1,2,3,4,5,6,7,8,9,10,11].filter(n => !used.has(n))
  overflow.forEach(({ p, line }, i) => {
    out.push({ ...p, seqNum: pool[i] ?? (i + 12), line })
  })

  return out.sort((a, b) => a.seqNum - b.seqNum)
}

function FieldRow({ players, topPct, circleSize = 28 }: {
  players: PlayerWithSeq[]
  topPct: string
  circleSize?: number
}) {
  if (players.length === 0) return null
  const nameW = circleSize <= 24 ? 28 : 38
  const numFs = circleSize <= 24 ? 9 : 11
  return (
    <div style={{
      position: 'absolute', top: topPct, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-evenly', alignItems: 'center',
      transform: 'translateY(-50%)',
    }}>
      {players.map(p => (
        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: circleSize, height: circleSize, borderRadius: '50%',
            border: '2.5px solid #111', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: numFs, fontWeight: 900, color: '#111', flexShrink: 0,
          }}>
            {p.seqNum}
          </div>
          <span style={{
            fontSize: 6, fontWeight: 700, textAlign: 'center',
            maxWidth: nameW, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            color: '#111', lineHeight: 1,
          }}>
            {p.name.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  )
}

const C = '#111'
const FW = 315
const FH = 575

export function MatchPrintSheet({
  teamName, teamLogo, opponent,
  playedAt, matchTime, matchIndex, seasonName, players,
  formation, pitchPositions,
}: Props) {

  const titulares = players.filter(p => p.status === 'titular').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const convocadas = players.filter(p => p.status === 'convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const hasConv = titulares.length > 0 || convocadas.length > 0
  const allAvail = players.filter(p => p.status !== 'no_convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))

  // Prioridad: 1) pitchPositions (slots reales guardados) 2) convocatoria 3) primeros 11 por dorsal
  const assignedIds = pitchPositions && Object.keys(pitchPositions).length > 0
    ? new Set(Object.keys(pitchPositions))
    : null

  const eleven = assignedIds
    ? players.filter(p => assignedIds.has(p.id)).sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
    : hasConv
      ? titulares
      : allAvail.slice(0, 11)

  const subs = assignedIds
    ? players.filter(p => !assignedIds.has(p.id) && p.status !== 'no_convocada').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
    : hasConv
      ? convocadas
      : allAvail.slice(11)
  // Construir filas del campo
  const formationDef = formation ? FORMATIONS.find(f => f.id === formation) ?? null : null
  const hasPitch = formationDef && pitchPositions && Object.keys(pitchPositions).length > 0

  // Cuando hay slots reales, cada slot tiene su número fijo (no depende del dorsal del jugador)
  const numbered: PlayerWithSeq[] = hasPitch
    ? eleven.map(p => {
        const slot = pitchPositions![p.id] ?? ''
        return { ...p, seqNum: SLOT_NUM[slot] ?? 99, line: lineFromSlot(slot) }
      }).sort((a, b) => a.seqNum - b.seqNum)
    : assignSeq(eleven)
  const subsNum  = subs.map(p => ({ ...p, seqNum: p.number ?? 0 }))

  const seqById = new Map(numbered.map(p => [p.id, p]))

  let fieldRows: PlayerWithSeq[][]
  if (hasPitch) {
    const slotToPlayer = new Map(
      Object.entries(pitchPositions).map(([pid, slot]) => [slot, pid])
    )
    // lines[0]=ataque → abajo del campo; lines[last]=GK → arriba
    fieldRows = [...formationDef.lines].reverse()
      .map(line =>
        line
          .map(slot => {
            const pid = slotToPlayer.get(slot.id)
            return pid ? seqById.get(pid) ?? null : null
          })
          .filter((x): x is PlayerWithSeq => x !== null)
      )
      .filter(row => row.length > 0)
  } else {
    const gkRow  = numbered.filter(p => p.line === 'gk')
    const defRow = numbered.filter(p => p.line === 'def')
    const midRow = numbered.filter(p => p.line === 'mid')
    const fwdRow = numbered.filter(p => p.line === 'fwd')
    fieldRows = [gkRow, defRow, midRow, fwdRow].filter(r => r.length > 0)
  }

  const d = new Date(playedAt + 'T12:00:00')
  const dateShort = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(2)}`

  const ROW_H = 15

  return (
    <>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer"
        style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-2)', backgroundColor: 'var(--bg-elevated)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>print</span>
        Imprimir hoja del partido
      </button>

      <div className="match-print-sheet" style={{ display: 'none' }}>
        <style>{`
          @media print {
            html, body {
              height: 297mm !important; max-height: 297mm !important;
              overflow: hidden !important; margin: 0 !important; padding: 0 !important;
            }
            body * { visibility: hidden !important; }
            .match-print-sheet {
              visibility: visible !important; display: block !important;
              position: absolute !important; top: 0 !important; left: 0 !important;
              width: 210mm !important; height: 297mm !important;
              overflow: hidden !important; background: white !important;
              padding: 9mm 10mm !important;
              font-family: Arial, Helvetica, sans-serif !important;
              box-sizing: border-box !important;
            }
            .match-print-sheet * { visibility: visible !important; }
            @page { margin: 0; size: A4 portrait; }
          }
        `}</style>

        {/* CABECERA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: '#111' }}>
            {teamName}
          </div>
          {teamLogo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={teamLogo} alt={teamName} style={{ width: 42, height: 42, objectFit: 'contain', filter: 'grayscale(100%)' }} />
            : <div style={{ width: 42, height: 42, border: '2px solid #111', borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: '#111' }}>
                {teamName.trim().split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
              </div>
          }
        </div>

        {/* INFO */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 9, tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {[{ l: 'JORNADA', w: '24%' }, { l: 'FECHA', w: '27%' }, { l: 'CONTRARIO', w: '49%' }].map(col => (
                <th key={col.l} style={{ border: '1px solid #999', padding: '2px 6px', fontSize: 7,
                  fontWeight: 800, textAlign: 'left', width: col.w, backgroundColor: '#ddd', color: '#111' }}>
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

        {/* CUERPO */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>

          {/* CAMPO */}
          <div style={{
            position: 'relative', flex: 1, height: FH, minWidth: 0,
            background: 'white', border: `2.5px solid ${C}`, overflow: 'hidden',
          }}>
            {/* Portería arriba */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '30%', height: 10, borderLeft: `2px solid ${C}`, borderRight: `2px solid ${C}`, borderBottom: `2px solid ${C}` }} />
            {/* Área pequeña arriba */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '38%', height: '8%', borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}`, borderBottom: `1.5px solid ${C}` }} />
            {/* Área grande arriba */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: '66%', height: '17%', borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}`, borderBottom: `1.5px solid ${C}` }} />
            {/* Punto penal arriba */}
            <div style={{ position: 'absolute', top: '12%', left: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: C }} />
            {/* Línea medio */}
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1.5, background: C }} />
            {/* Círculo central */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 72, height: 72, borderRadius: '50%', border: `1.5px solid ${C}` }} />
            {/* Punto central */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 4, height: 4, borderRadius: '50%', background: C }} />
            {/* Área grande abajo */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '66%', height: '17%', borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}`, borderTop: `1.5px solid ${C}` }} />
            {/* Área pequeña abajo */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '38%', height: '8%', borderLeft: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}`, borderTop: `1.5px solid ${C}` }} />
            {/* Punto penal abajo */}
            <div style={{ position: 'absolute', bottom: '12%', left: '50%', transform: 'translate(-50%,50%)', width: 4, height: 4, borderRadius: '50%', background: C }} />
            {/* Portería abajo */}
            <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '30%', height: 10, borderLeft: `2px solid ${C}`, borderRight: `2px solid ${C}`, borderTop: `2px solid ${C}` }} />
            {/* Arcos de esquina */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderBottom: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}`, borderRadius: '0 0 100% 0' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, borderBottom: `1.5px solid ${C}`, borderLeft: `1.5px solid ${C}`, borderRadius: '0 0 0 100%' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 10, height: 10, borderTop: `1.5px solid ${C}`, borderRight: `1.5px solid ${C}`, borderRadius: '0 100% 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderTop: `1.5px solid ${C}`, borderLeft: `1.5px solid ${C}`, borderRadius: '100% 0 0 0' }} />

            {/* Jugadoras */}
            {fieldRows.map((row, i) => {
              const n = fieldRows.length
              const topPct = n === 1 ? '50%' : `${8 + (i / (n - 1)) * 74}%`
              const circleSize = row.length >= 5 ? 24 : 28
              return <FieldRow key={i} players={row} topPct={topPct} circleSize={circleSize} />
            })}
          </div>

          {/* LISTA */}
          <div style={{ width: 230, flexShrink: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {numbered.map((p, i) => {
                  const isLastStarter = i === numbered.length - 1 && subsNum.length > 0
                  const sepBorder = isLastStarter ? '2.5px solid #111' : '1px solid #ddd'
                  return (
                    <tr key={p.id}>
                      <td style={{ border: '1px solid #bbb',
                        borderBottom: isLastStarter ? '2.5px solid #111' : '1px solid #bbb',
                        padding: '0 4px', width: 20, textAlign: 'center', height: ROW_H,
                        fontSize: 8, fontWeight: 900, color: '#111' }}>
                        {p.seqNum}
                      </td>
                      <td style={{ borderBottom: sepBorder,
                        padding: '0 6px', height: ROW_H,
                        fontSize: 9.5, fontWeight: 600, color: '#111' }}>
                        {p.name}
                      </td>
                    </tr>
                  )
                })}
                {subsNum.map(p => (
                  <tr key={p.id}>
                    <td style={{ border: '1px solid #bbb', padding: '0 4px', width: 20,
                      textAlign: 'center', height: ROW_H, fontSize: 8, fontWeight: 900, color: '#111' }}>
                      {p.seqNum}
                    </td>
                    <td style={{ borderBottom: '1px solid #ddd', padding: '0 6px', height: ROW_H,
                      fontSize: 9.5, fontWeight: 600, color: '#111' }}>
                      {p.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 6.5, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: 1, marginBottom: 3, color: '#666' }}>Notas</div>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: 14, borderBottom: '1px solid #ccc', marginBottom: 2 }} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 8, paddingTop: 4, borderTop: '1px solid #ddd',
          fontSize: 6.5, color: '#aaa', textAlign: 'center' }}>
          Generado con Coachly · {teamName} · {opponent}{formation ? ` · ${formation}` : ''}
        </div>
      </div>
    </>
  )
}
