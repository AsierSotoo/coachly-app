'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'

type Scorer = { name: string; goals: number }

type LineupSlot = { label: string; player: { name: string; number: number | null } | null }
type LineupData = {
  formation: string
  lines: LineupSlot[][]
}

type Props = {
  teamName: string
  logoUrl?: string | null
  opponent: string
  goalsFor: number
  goalsAgainst: number
  playedAt: string
  home: boolean
  scorers: Scorer[]
  mvpName?: string | null
  competition?: string | null
  lineupData?: LineupData | null
}

function teamInitials(name: string) {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function MatchShareCard({
  teamName, logoUrl, opponent, goalsFor, goalsAgainst,
  playedAt, home, scorers, mvpName, competition, lineupData,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [showLineup, setShowLineup] = useState(false)

  const result = goalsFor > goalsAgainst ? 'V' : goalsFor < goalsAgainst ? 'D' : 'E'
  const resultColor = result === 'V' ? 'var(--accent)' : result === 'D' ? '#ffb4ab' : '#89968e'
  const dateLabel = new Date(playedAt + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  async function share() {
    const el = document.getElementById('match-share-card')
    if (!el) return
    setLoading(true)
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#111713' })
      const filename = `${teamName.replace(/\s+/g, '_')}_vs_${opponent.replace(/\s+/g, '_')}.png`
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], filename, { type: 'image/png' })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${teamName} ${goalsFor}–${goalsAgainst} ${opponent}`,
          files: [file],
        })
      } else {
        const a = document.createElement('a')
        a.download = filename
        a.href = dataUrl
        a.click()
      }
    } catch {
      alert('No se pudo generar la imagen. Usa una captura de pantalla.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle alineación — solo si hay datos */}
      {lineupData && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLineup(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95"
            style={{
              backgroundColor: showLineup ? 'rgba(75,226,119,0.1)' : 'transparent',
              borderColor: showLineup ? 'rgba(75,226,119,0.4)' : '#2a342d',
              color: showLineup ? 'var(--accent)' : '#637168',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: showLineup ? "'FILL' 1" : "'FILL' 0" }}>
              sports
            </span>
            {showLineup ? 'Alineación incluida' : 'Incluir alineación'}
          </button>
          {showLineup && (
            <span className="text-[10px]" style={{ color: '#637168' }}>
              {lineupData.formation}
            </span>
          )}
        </div>
      )}

      {/* Tarjeta */}
      <div
        id="match-share-card"
        style={{
          backgroundColor: '#111713',
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 480,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '1px solid #253028',
        }}
      >
        {/* Resultado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
          {/* Equipo local */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt={teamName} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, backgroundColor: 'white', padding: 4 }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#1a231d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
                {teamInitials(teamName)}
              </div>
            )}
            <p style={{ color: '#edf2ee', fontSize: 12, fontWeight: 700, textAlign: 'center', margin: 0, maxWidth: 80 }}>{teamName}</p>
            <p style={{ color: '#637168', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{home ? 'Local' : 'Visitante'}</p>
          </div>

          {/* Marcador */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: goalsFor > goalsAgainst ? 'var(--accent)' : '#edf2ee', lineHeight: 1 }}>{goalsFor}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#334155', lineHeight: 1 }}>–</span>
              <span style={{ fontSize: 52, fontWeight: 900, color: goalsAgainst > goalsFor ? '#ffb4ab' : '#edf2ee', lineHeight: 1 }}>{goalsAgainst}</span>
            </div>
            <div style={{
              padding: '3px 10px', borderRadius: 20,
              backgroundColor: result === 'V' ? 'rgba(34,197,94,0.15)' : result === 'D' ? 'rgba(255,180,171,0.1)' : 'rgba(148,163,184,0.1)',
              border: `1px solid ${result === 'V' ? 'rgba(34,197,94,0.3)' : result === 'D' ? 'rgba(255,180,171,0.3)' : 'rgba(148,163,184,0.3)'}`,
            }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: resultColor }}>
                {result === 'V' ? 'Victoria' : result === 'D' ? 'Derrota' : 'Empate'}
              </span>
            </div>
          </div>

          {/* Rival */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#1a231d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#89968e' }}>
              {teamInitials(opponent)}
            </div>
            <p style={{ color: '#edf2ee', fontSize: 12, fontWeight: 700, textAlign: 'center', margin: 0, maxWidth: 80 }}>{opponent}</p>
            <p style={{ color: '#637168', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{home ? 'Visitante' : 'Local'}</p>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, backgroundColor: '#253028', marginBottom: 16 }} />

        {/* Goleadoras */}
        {scorers.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: '#637168', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, margin: '0 0 8px' }}>Goles</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scorers.map(s => (
                <div key={s.name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                }}>
                  <span style={{ fontSize: 11 }}>⚽</span>
                  <span style={{ color: '#edf2ee', fontSize: 12, fontWeight: 600 }}>
                    {s.name.split(' ')[0]}{s.goals > 1 ? ` ×${s.goals}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MVP */}
        {mvpName && (
          <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>⭐</span>
            <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>MVP: {mvpName.split(' ')[0]}</span>
          </div>
        )}

        {/* Alineación (opcional) */}
        {showLineup && lineupData && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 1, backgroundColor: '#253028', marginBottom: 14 }} />
            <p style={{ color: '#637168', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
              Alineación · {lineupData.formation}
            </p>
            {/* Campo mini */}
            <div style={{
              backgroundColor: '#1a5232', borderRadius: 10, padding: '10px 8px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              {lineupData.lines.map((line, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-evenly', gap: 4 }}>
                  {line.map((slot, j) => (
                    <div key={j} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 36, maxWidth: 52, flex: 1 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: slot.player ? '1.5px solid rgba(75,226,119,0.5)' : '1.5px dashed rgba(75,226,119,0.2)',
                        backgroundColor: slot.player ? 'rgba(75,226,119,0.12)' : 'rgba(75,226,119,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: slot.player ? 'white' : 'rgba(75,226,119,0.3)',
                      }}>
                        {slot.player ? (slot.player.number ?? slot.label) : slot.label}
                      </div>
                      <span style={{
                        color: slot.player ? '#89968e' : 'rgba(255,255,255,0.15)',
                        fontSize: 8, textAlign: 'center',
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                        maxWidth: 44,
                      }}>
                        {slot.player ? slot.player.name.split(' ')[0] : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #253028' }}>
          <p style={{ color: '#637168', fontSize: 10, margin: 0 }}>
            {dateLabel}{competition ? ` · ${competition}` : ''}
          </p>
          <p style={{ color: 'var(--accent)', fontSize: 10, fontWeight: 800, margin: 0 }}>Coachly</p>
        </div>
      </div>

      {/* Botón de descarga */}
      <button
        onClick={share}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: 'var(--accent)', width: 'fit-content' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {loading ? 'hourglass_empty' : 'share'}
        </span>
        {loading ? 'Generando…' : 'Compartir resultado'}
      </button>
    </div>
  )
}
