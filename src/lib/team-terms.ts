/**
 * Returns gender-aware terminology and position data based on the team's gender field.
 * gender === 'masculino' → masculine forms
 * anything else (femenino, mixto, null) → feminine forms (app default)
 */
export function getTeamTerms(gender: string | null | undefined) {
  const m = gender?.toLowerCase() === 'masculino'

  const pos0 = m ? 'Portero'   : 'Portera'
  const pos3 = m ? 'Delantero' : 'Delantera'

  return {
    // Player noun
    p:  m ? 'jugador'   : 'jugadora',
    pp: m ? 'jugadores' : 'jugadoras',

    // Active adjective
    active:  m ? 'activo'   : 'activa',
    actives: m ? 'activos'  : 'activas',

    // Called-up status label
    called:  m ? 'convocado'  : 'convocada',
    calleds: m ? 'convocados' : 'convocadas',

    // Positions list for <select>
    positions: [pos0, 'Defensa', 'Centrocampista', pos3] as string[],

    // Abbreviation for a stored position value (handles both genders in DB)
    posAbbr(pos: string | null | undefined): string {
      const map: Record<string, string> = {
        Portera: 'GK', Portero: 'GK',
        Defensa: 'DF',
        Centrocampista: 'MC',
        Delantera: 'DL', Delantero: 'DL',
      }
      return map[pos ?? ''] ?? '—'
    },

    // Singular display label (normalised to current team gender)
    posLabel(pos: string | null | undefined): string {
      if (!pos) return '—'
      if (pos === 'Portera' || pos === 'Portero') return pos0
      if (pos === 'Delantera' || pos === 'Delantero') return pos3
      return pos
    },

    // Plural display label (for group headers)
    posLabelPlural(pos: string | null | undefined): string {
      if (!pos) return 'Sin posición'
      if (pos === 'Portera' || pos === 'Portero') return m ? 'Porteros' : 'Porteras'
      if (pos === 'Defensa') return 'Defensas'
      if (pos === 'Centrocampista') return 'Centrocampistas'
      if (pos === 'Delantera' || pos === 'Delantero') return m ? 'Delanteros' : 'Delanteras'
      return pos
    },

    // Order for grouping (matches current gender's position names)
    posOrder: [pos0, 'Defensa', 'Centrocampista', pos3, '__none__'] as string[],

    // Badge Tailwind classes — same color per role regardless of gender
    posBadge(pos: string | null | undefined): { bg: string; text: string; border: string } {
      const blue   = { bg: 'rgba(59,130,246,0.1)',  text: '#60a5fa', border: 'rgba(59,130,246,0.2)'  }
      const yellow = { bg: 'rgba(234,179,8,0.1)',   text: '#facc15', border: 'rgba(234,179,8,0.2)'   }
      const green  = { bg: 'rgba(34,197,94,0.1)',   text: '#72e697', border: 'rgba(34,197,94,0.2)'   }
      const red    = { bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.2)'   }
      const grey   = { bg: '#1a231d',               text: '#89968e', border: '#2a342d'               }
      const map: Record<string, typeof blue> = {
        Portera: blue, Portero: blue,
        Defensa: yellow,
        Centrocampista: green,
        Delantera: red, Delantero: red,
      }
      return map[pos ?? ''] ?? grey
    },

    // CSS class string for stats position badges
    posBadgeClass(pos: string | null | undefined): string {
      const map: Record<string, string> = {
        Portera:        'bg-amber-500/15 text-amber-400 border-amber-500/30',
        Portero:        'bg-amber-500/15 text-amber-400 border-amber-500/30',
        Defensa:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
        Centrocampista: 'bg-green-500/15 text-green-400 border-green-500/30',
        Delantera:      'bg-red-500/15 text-red-400 border-red-500/30',
        Delantero:      'bg-red-500/15 text-red-400 border-red-500/30',
      }
      return map[pos ?? ''] ?? 'bg-slate-700/50 text-slate-400 border-slate-600'
    },

    // Text color class for position in the match form
    posTextColor(pos: string | null | undefined): string {
      const map: Record<string, string> = {
        Portera: 'text-amber-400', Portero: 'text-amber-400',
        Defensa: 'text-blue-400',
        Centrocampista: 'text-green-400',
        Delantera: 'text-red-400', Delantero: 'text-red-400',
      }
      return map[pos ?? ''] ?? 'text-slate-400'
    },
  }
}

export type TeamTerms = ReturnType<typeof getTeamTerms>
