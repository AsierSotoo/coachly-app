'use client'

import { useState, useTransition } from 'react'
import { saveMatchTactics } from '@/app/dashboard/season/[id]/tactics/actions'
import type { TacticsTemplate, MatchTactics } from '@/lib/tactics'
import { emptyMatchTactics } from '@/lib/tactics'

interface Player { id: string; name: string; number: number | null }

interface Props {
  matchId: string
  seasonId: string
  opponent: string
  matchIndex: number
  teamName: string
  template: TacticsTemplate
  saved: MatchTactics | null
  players: Player[]
  printUrl: string
}

export function MatchTacticsSection({
  matchId, seasonId, opponent, matchIndex, teamName, template, saved, players, printUrl,
}: Props) {
  const [tactics, setTactics] = useState<MatchTactics>(() => {
    if (saved) return saved
    return emptyMatchTactics(template)
  })
  const [dirty, setDirty] = useState(false)
  const [saveOk, setSaveOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function setPlayer(sectionId: string, rowId: string, slotIdx: number, value: string) {
    setTactics(t => {
      const sections = { ...t.sections }
      const section = { ...sections[sectionId] }
      const entry = { ...section[rowId], players: [...(section[rowId]?.players ?? [])] }
      entry.players[slotIdx] = value
      section[rowId] = entry
      sections[sectionId] = section
      return { ...t, sections }
    })
    setDirty(true)
    setSaveOk(false)
  }

  function setExtra(sectionId: string, rowId: string, value: string) {
    setTactics(t => {
      const sections = { ...t.sections }
      const section = { ...sections[sectionId] }
      section[rowId] = { ...section[rowId], extra: value }
      sections[sectionId] = section
      return { ...t, sections }
    })
    setDirty(true)
    setSaveOk(false)
  }

  function setNote(idx: number, value: string) {
    setTactics(t => {
      const notes = [...t.notes]
      notes[idx] = value
      return { ...t, notes }
    })
    setDirty(true)
    setSaveOk(false)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveMatchTactics(matchId, seasonId, tactics)
      if (res.error) { setError(res.error); return }
      setSaveOk(true)
      setDirty(false)
      setError(null)
    })
  }

  const playerNames = players.map(p => p.name)
  const listId = `players-datalist-${matchId}`

  const inputCls = 'rounded-lg border px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[var(--accent)] transition-colors w-full'
  const inputStyle = { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr)', color: 'var(--tx)' }

  return (
    <div className="rounded-2xl border" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>
      {/* Datalist para autocomplete */}
      <datalist id={listId}>
        {playerNames.map(n => <option key={n} value={n} />)}
      </datalist>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b flex-wrap" style={{ borderColor: 'var(--bdr)' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }}>strategy</span>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--tx-3)' }}>Hoja táctica</p>
        </div>
        <div className="flex items-center gap-2">
          {saveOk && !dirty && <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>✓ Guardado</span>}
          {error && <span className="text-xs" style={{ color: '#f87171' }}>{error}</span>}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !dirty}
            className="px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-40 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            {pending ? 'Guardando…' : 'Guardar'}
          </button>
          <a
            href={printUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr)', border: '1px solid', color: 'var(--tx)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>print</span>
            Imprimir
          </a>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5">
        {/* Info partido */}
        <div className="text-xs" style={{ color: 'var(--tx-3)' }}>
          <span className="font-bold uppercase tracking-wide" style={{ color: 'var(--tx-2)' }}>Jornada {matchIndex + 1}</span>
          {' · '}vs {opponent} · {teamName}
        </div>

        {/* Secciones */}
        {template.sections.map(section => (
          <div key={section.id} className="flex flex-col gap-2">
            <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {section.title}
            </p>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--bdr)' }}>
              {section.rows.map((row, rIdx) => {
                const entry = tactics.sections[section.id]?.[row.id] ?? { players: Array(row.slots).fill('') }
                return (
                  <div key={row.id} className={`flex items-start gap-3 px-3 py-2 ${rIdx > 0 ? 'border-t' : ''}`}
                    style={{ borderColor: 'var(--bdr)', backgroundColor: rIdx % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-elevated)' }}>
                    <span className="text-xs font-bold w-20 shrink-0 pt-1.5" style={{ color: 'var(--tx-2)' }}>
                      {row.role}
                    </span>
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {Array.from({ length: row.slots }).map((_, i) => (
                        <input
                          key={i}
                          list={listId}
                          value={entry.players[i] ?? ''}
                          onChange={e => setPlayer(section.id, row.id, i, e.target.value)}
                          placeholder={`${i + 1}.`}
                          className={inputCls}
                          style={{ ...inputStyle, maxWidth: 130 }}
                        />
                      ))}
                      {row.hasExtra && (
                        <input
                          value={entry.extra ?? ''}
                          onChange={e => setExtra(section.id, row.id, e.target.value)}
                          placeholder="Jugada…"
                          className={inputCls}
                          style={{ ...inputStyle, maxWidth: 160, fontStyle: 'italic' }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Notas */}
        {template.notesCount > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--tx-3)' }}>Notas tácticas</p>
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: template.notesCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-5 text-right shrink-0" style={{ color: 'var(--accent)' }}>{i + 1}.</span>
                  <input
                    value={tactics.notes[i] ?? ''}
                    onChange={e => setNote(i, e.target.value)}
                    placeholder="Nota táctica…"
                    className={`${inputCls} flex-1`}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
