export type FormationSlot = {
  id: string     // unique ID within formation (e.g. 'DFC1', 'DFC2')
  label: string  // display label in Spanish (e.g. 'DFC', 'MC')
}

export type FormationDef = {
  id: string
  lines: FormationSlot[][] // lines[0] = attack (top of pitch), lines[last] = GK (bottom)
}

export const FORMATIONS: FormationDef[] = [
  {
    id: '4-3-3',
    lines: [
      [{ id: 'ED', label: 'ED' }, { id: 'DC', label: 'DC' }, { id: 'EI', label: 'EI' }],
      [{ id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MC3', label: 'MC' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '4-4-2',
    lines: [
      [{ id: 'DC1', label: 'DC' }, { id: 'DC2', label: 'DC' }],
      [{ id: 'MD', label: 'MD' }, { id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MI', label: 'MI' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '4-2-3-1',
    lines: [
      [{ id: 'DC', label: 'DC' }],
      [{ id: 'ED', label: 'ED' }, { id: 'MCO', label: 'MCO' }, { id: 'EI', label: 'EI' }],
      [{ id: 'MCD1', label: 'MCD' }, { id: 'MCD2', label: 'MCD' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '4-1-4-1',
    lines: [
      [{ id: 'DC', label: 'DC' }],
      [{ id: 'MD', label: 'MD' }, { id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MI', label: 'MI' }],
      [{ id: 'MCD', label: 'MCD' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '3-5-2',
    lines: [
      [{ id: 'DC1', label: 'DC' }, { id: 'DC2', label: 'DC' }],
      [{ id: 'MD', label: 'MD' }, { id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MC3', label: 'MC' }, { id: 'MI', label: 'MI' }],
      [{ id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'DFC3', label: 'DFC' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '5-3-2',
    lines: [
      [{ id: 'DC1', label: 'DC' }, { id: 'DC2', label: 'DC' }],
      [{ id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MC3', label: 'MC' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'DFC3', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '4-3-2-1',
    lines: [
      [{ id: 'DC', label: 'DC' }],
      [{ id: 'MCO1', label: 'MCO' }, { id: 'MCO2', label: 'MCO' }],
      [{ id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MC3', label: 'MC' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '3-4-3',
    lines: [
      [{ id: 'ED', label: 'ED' }, { id: 'DC', label: 'DC' }, { id: 'EI', label: 'EI' }],
      [{ id: 'MD', label: 'MD' }, { id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MI', label: 'MI' }],
      [{ id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'DFC3', label: 'DFC' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '4-4-1-1',
    lines: [
      [{ id: 'DC', label: 'DC' }],
      [{ id: 'MCO', label: 'MCO' }],
      [{ id: 'MD', label: 'MD' }, { id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MI', label: 'MI' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
  {
    id: '5-4-1',
    lines: [
      [{ id: 'DC', label: 'DC' }],
      [{ id: 'MD', label: 'MD' }, { id: 'MC1', label: 'MC' }, { id: 'MC2', label: 'MC' }, { id: 'MI', label: 'MI' }],
      [{ id: 'LD', label: 'LD' }, { id: 'DFC1', label: 'DFC' }, { id: 'DFC2', label: 'DFC' }, { id: 'DFC3', label: 'DFC' }, { id: 'LI', label: 'LI' }],
      [{ id: 'PO', label: 'PO' }],
    ],
  },
]

export function getFormation(id: string): FormationDef | null {
  return FORMATIONS.find(f => f.id === id) ?? null
}

export function getFormationSlots(id: string): FormationSlot[] {
  const f = getFormation(id)
  return f ? f.lines.flat() : []
}
