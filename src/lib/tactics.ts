export type TacticsRow = {
  id: string
  role: string
  slots: number       // número de jugadoras (1-5)
  hasExtra?: boolean  // campo texto adicional (ej: "Jugada: NEREA")
}

export type TacticsSection = {
  id: string
  title: string
  rows: TacticsRow[]
}

export type TacticsTemplate = {
  sections: TacticsSection[]
  notesCount: number
}

export type MatchTacticEntry = {
  players: string[]
  extra?: string
}

// Record<sectionId, Record<rowId, entry>>
export type MatchTactics = {
  sections: Record<string, Record<string, MatchTacticEntry>>
  notes: string[]
}

export const DEFAULT_TEMPLATE: TacticsTemplate = {
  sections: [
    {
      id: 'corner_favor',
      title: 'Córner a favor',
      rows: [
        { id: 'centra',  role: 'Centra',  slots: 1, hasExtra: true },
        { id: 'portera', role: 'Portera', slots: 1 },
        { id: 'remate',  role: 'Remate',  slots: 3 },
        { id: 'rechace', role: 'Rechace', slots: 2 },
        { id: 'atras',   role: 'Atrás',   slots: 2 },
      ],
    },
    {
      id: 'corner_contra',
      title: 'Córner en contra',
      rows: [
        { id: 'palo',    role: 'Palo',    slots: 1 },
        { id: 'corta',   role: 'Corta',   slots: 1 },
        { id: 'marcan',  role: 'Marcan',  slots: 5 },
        { id: 'rechace', role: 'Rechace', slots: 2 },
        { id: 'arriba',  role: 'Arriba',  slots: 1 },
      ],
    },
    {
      id: 'barrera',
      title: 'Barrera',
      rows: [
        { id: 'barrera', role: 'Barrera', slots: 4 },
        { id: 'sale',    role: 'Sale',    slots: 1 },
      ],
    },
  ],
  notesCount: 3,
}

export function emptyMatchTactics(template: TacticsTemplate): MatchTactics {
  const sections: MatchTactics['sections'] = {}
  for (const s of template.sections) {
    sections[s.id] = {}
    for (const r of s.rows) {
      sections[s.id][r.id] = { players: Array(r.slots).fill('') }
    }
  }
  return { sections, notes: Array(template.notesCount).fill('') }
}
