'use client'

import { useState, useTransition } from 'react'
import { saveTacticsTemplate } from '@/app/dashboard/season/[id]/tactics/actions'
import type { TacticsTemplate, TacticsSection, TacticsRow } from '@/lib/tactics'

function uid() { return Math.random().toString(36).slice(2, 9) }

export function TacticsTemplateEditor({
  seasonId,
  initial,
}: {
  seasonId: string
  initial: TacticsTemplate
}) {
  const [template, setTemplate] = useState<TacticsTemplate>(initial)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function updateSection(idx: number, patch: Partial<TacticsSection>) {
    setTemplate(t => {
      const sections = [...t.sections]
      sections[idx] = { ...sections[idx], ...patch }
      return { ...t, sections }
    })
    setSaved(false)
  }

  function updateRow(sIdx: number, rIdx: number, patch: Partial<TacticsRow>) {
    setTemplate(t => {
      const sections = [...t.sections]
      const rows = [...sections[sIdx].rows]
      rows[rIdx] = { ...rows[rIdx], ...patch }
      sections[sIdx] = { ...sections[sIdx], rows }
      return { ...t, sections }
    })
    setSaved(false)
  }

  function addSection() {
    setTemplate(t => ({
      ...t,
      sections: [...t.sections, { id: uid(), title: 'Nueva sección', rows: [{ id: uid(), role: 'Rol', slots: 1 }] }],
    }))
    setSaved(false)
  }

  function removeSection(idx: number) {
    setTemplate(t => ({ ...t, sections: t.sections.filter((_, i) => i !== idx) }))
    setSaved(false)
  }

  function moveSection(idx: number, dir: -1 | 1) {
    setTemplate(t => {
      const sections = [...t.sections]
      const swapIdx = idx + dir
      if (swapIdx < 0 || swapIdx >= sections.length) return t;
      [sections[idx], sections[swapIdx]] = [sections[swapIdx], sections[idx]]
      return { ...t, sections }
    })
    setSaved(false)
  }

  function addRow(sIdx: number) {
    setTemplate(t => {
      const sections = [...t.sections]
      sections[sIdx] = { ...sections[sIdx], rows: [...sections[sIdx].rows, { id: uid(), role: 'Rol', slots: 1 }] }
      return { ...t, sections }
    })
    setSaved(false)
  }

  function removeRow(sIdx: number, rIdx: number) {
    setTemplate(t => {
      const sections = [...t.sections]
      sections[sIdx] = { ...sections[sIdx], rows: sections[sIdx].rows.filter((_, i) => i !== rIdx) }
      return { ...t, sections }
    })
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveTacticsTemplate(seasonId, template)
      if (res.error) { setError(res.error); return }
      setSaved(true)
      setError(null)
    })
  }

  const inputCls = 'rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors'
  const inputStyle = { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--bdr)', color: 'var(--tx)' }

  return (
    <div className="flex flex-col gap-6">
      {/* Secciones */}
      {template.sections.map((section, sIdx) => (
        <div key={section.id} className="rounded-2xl border" style={{ borderColor: 'var(--bdr-strong)', backgroundColor: 'var(--bg-card)' }}>
          {/* Header sección */}
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--bdr)' }}>
            <input
              value={section.title}
              onChange={e => updateSection(sIdx, { title: e.target.value })}
              className={`${inputCls} flex-1 font-bold`}
              style={inputStyle}
              placeholder="Nombre de sección"
            />
            <button type="button" onClick={() => moveSection(sIdx, -1)} disabled={sIdx === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-opacity"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--tx-3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_upward</span>
            </button>
            <button type="button" onClick={() => moveSection(sIdx, 1)} disabled={sIdx === template.sections.length - 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-opacity"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--tx-3)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_downward</span>
            </button>
            <button type="button" onClick={() => removeSection(sIdx)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,80,80,0.1)', color: '#f87171' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            </button>
          </div>

          {/* Filas */}
          <div className="divide-y" style={{ borderColor: 'var(--bdr)' }}>
            {section.rows.map((row, rIdx) => (
              <div key={row.id} className="flex items-center gap-2 px-4 py-2.5 flex-wrap">
                <input
                  value={row.role}
                  onChange={e => updateRow(sIdx, rIdx, { role: e.target.value })}
                  className={`${inputCls} w-32`}
                  style={inputStyle}
                  placeholder="Rol"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: 'var(--tx-3)' }}>Huecos:</span>
                  <select
                    value={row.slots}
                    onChange={e => updateRow(sIdx, rIdx, { slots: Number(e.target.value) })}
                    className={`${inputCls} w-16`}
                    style={inputStyle}
                  >
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" style={{ color: 'var(--tx-3)' }}>
                  <input
                    type="checkbox"
                    checked={!!row.hasExtra}
                    onChange={e => updateRow(sIdx, rIdx, { hasExtra: e.target.checked })}
                    className="accent-[var(--accent)] w-3.5 h-3.5"
                  />
                  Campo extra
                </label>
                <button type="button" onClick={() => removeRow(sIdx, rIdx)}
                  className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255,80,80,0.08)', color: '#f87171' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>
            ))}
          </div>

          {/* Añadir fila */}
          <div className="px-4 py-2.5">
            <button type="button" onClick={() => addRow(sIdx)}
              className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--accent)', backgroundColor: 'var(--accent-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
              Añadir fila
            </button>
          </div>
        </div>
      ))}

      {/* Notas */}
      <div className="flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: 'var(--bdr)', backgroundColor: 'var(--bg-card)' }}>
        <span className="text-sm font-bold" style={{ color: 'var(--tx-2)' }}>Notas numeradas:</span>
        <select
          value={template.notesCount}
          onChange={e => { setTemplate(t => ({ ...t, notesCount: Number(e.target.value) })); setSaved(false) }}
          className={`${inputCls} w-20`}
          style={inputStyle}
        >
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="text-xs" style={{ color: 'var(--tx-3)' }}>líneas en blanco para notas tácticas</span>
      </div>

      {/* Añadir sección */}
      <button type="button" onClick={addSection}
        className="rounded-xl border-2 border-dashed flex items-center justify-center gap-2 py-4 font-bold text-sm transition-colors"
        style={{ borderColor: 'var(--bdr-strong)', color: 'var(--tx-3)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
        Añadir sección
      </button>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 transition-all active:scale-95"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }}
        >
          {pending ? 'Guardando…' : 'Guardar plantilla'}
        </button>
        {saved && <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>✓ Guardada</span>}
        {error && <span className="text-sm" style={{ color: '#f87171' }}>{error}</span>}
      </div>
    </div>
  )
}
