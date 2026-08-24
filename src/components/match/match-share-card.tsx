'use client'

import { useState } from 'react'
import { toPng } from 'html-to-image'

type Scorer = { name: string; goals: number }

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
}

function teamInitials(name: string) {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function MatchShareCard({
  teamName, logoUrl, opponent, goalsFor, goalsAgainst,
  playedAt, home, scorers, mvpName, competition,
}: Props) {
  const [loading, setLoading] = useState(false)

  const result = goalsFor > goalsAgainst ? 'V' : goalsFor < goalsAgainst ? 'D' : 'E'
  const resultColor = result === 'V' ? '#4be277' : result === 'D' ? '#ffb4ab' : '#adb4ce'
  const dateLabel = new Date(playedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

  async function share() {
    const el = document.getElementById('match-share-card')
    if (!el) return
    setLoading(true)
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#0f172a' })
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
      {/* Tarjeta */}
      <div
        id="match-share-card"
        style={{
          backgroundColor: '#0f172a',
          borderRadius: 20,
          padding: 28,
          width: '100%',
          maxWidth: 480,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          border: '1px solid #1e293b',
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
              <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#23293c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#4be277' }}>
                {teamInitials(teamName)}
              </div>
            )}
            <p style={{ color: '#dce1fb', fontSize: 12, fontWeight: 700, textAlign: 'center', margin: 0, maxWidth: 80 }}>{teamName}</p>
            <p style={{ color: '#475569', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{home ? 'Local' : 'Visitante'}</p>
          </div>

          {/* Marcador */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: goalsFor > goalsAgainst ? '#4be277' : '#dce1fb', lineHeight: 1 }}>{goalsFor}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#334155', lineHeight: 1 }}>–</span>
              <span style={{ fontSize: 52, fontWeight: 900, color: goalsAgainst > goalsFor ? '#ffb4ab' : '#dce1fb', lineHeight: 1 }}>{goalsAgainst}</span>
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
            <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#23293c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#adb4ce' }}>
              {teamInitials(opponent)}
            </div>
            <p style={{ color: '#dce1fb', fontSize: 12, fontWeight: 700, textAlign: 'center', margin: 0, maxWidth: 80 }}>{opponent}</p>
            <p style={{ color: '#475569', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{home ? 'Visitante' : 'Local'}</p>
          </div>
        </div>

        {/* Divisor */}
        <div style={{ height: 1, backgroundColor: '#1e293b', marginBottom: 16 }} />

        {/* Goleadoras */}
        {scorers.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: '#475569', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, margin: '0 0 8px' }}>Goles</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {scorers.map(s => (
                <div key={s.name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                }}>
                  <span style={{ fontSize: 11 }}>⚽</span>
                  <span style={{ color: '#dce1fb', fontSize: 12, fontWeight: 600 }}>
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

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #1e293b' }}>
          <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>
            {dateLabel}{competition ? ` · ${competition}` : ''}
          </p>
          <p style={{ color: '#4be277', fontSize: 10, fontWeight: 800, margin: 0 }}>Coachly</p>
        </div>
      </div>

      {/* Botón de descarga */}
      <button
        onClick={share}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#4be277', width: 'fit-content' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {loading ? 'hourglass_empty' : 'share'}
        </span>
        {loading ? 'Generando…' : 'Compartir resultado'}
      </button>
    </div>
  )
}
