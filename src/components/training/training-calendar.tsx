'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { DownloadImageButton } from '@/components/convocatoria/download-image-button'

interface Session {
  id: string; date: string; title: string | null
  notes: string | null; duration_min: number | null
}
interface Match {
  id: string; opponent: string; played_at: string
  goals_for: number | null; goals_against: number | null; home: boolean
  status?: string
}
interface Props {
  seasonId: string; teamName: string; teamLogo: string | null
  seasonName: string; sessions: Session[]; matches: Match[]
}

const DAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function isoDate(s: string) {
  const [y, m, d] = s.split('T')[0].split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function TrainingCalendar({ seasonId, teamName, teamLogo, sessions, matches }: Props) {
  const today = new Date()
  const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const monthSessions = sessions.filter(s => {
    const d = isoDate(s.date)
    return d.getFullYear() === cur.year && d.getMonth() === cur.month
  })
  const monthMatches = matches.filter(m => {
    const d = isoDate(m.played_at)
    return d.getFullYear() === cur.year && d.getMonth() === cur.month
  })

  const firstDay    = new Date(cur.year, cur.month, 1)
  const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7

  const sessionDays: Record<number, Session[]> = {}
  const matchDays: Record<number, Match[]> = {}
  for (const s of monthSessions) { const d = isoDate(s.date).getDate(); (sessionDays[d] ??= []).push(s) }
  for (const m of monthMatches)  { const d = isoDate(m.played_at).getDate(); (matchDays[d] ??= []).push(m) }

  const prev = () => setCur(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 })
  const next = () => setCur(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 })

  const isThisMonth = today.getFullYear() === cur.year && today.getMonth() === cur.month
  const todayDay    = today.getDate()
  const monthLabel  = `${MONTHS_ES[cur.month]} ${cur.year}`

  const totalMin    = sessions.reduce((a, s) => a + (s.duration_min ?? 0), 0)
  const totalHours  = totalMin > 0 ? `${Math.floor(totalMin / 60)}h${totalMin % 60 > 0 ? ` ${totalMin % 60}m` : ''}` : '—'

  const sortedS = [...monthSessions].sort((a, b) => a.date.localeCompare(b.date))
  const sortedM = [...monthMatches].sort((a, b) => a.played_at.localeCompare(b.played_at))

  const handleCopy = async () => {
    const fmtDate = (iso: string) => {
      const d = isoDate(iso)
      const s = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      return s.charAt(0).toUpperCase() + s.slice(1)
    }
    const lines = [`📅 PLANIFICACIÓN — ${MONTHS_ES[cur.month].toUpperCase()} ${cur.year}`, teamName, '']
    if (sortedM.length) {
      lines.push('⚽ PARTIDOS:')
      sortedM.forEach(m => {
        const res = m.goals_for !== null ? ` (${m.goals_for}-${m.goals_against})` : ''
        lines.push(`· ${fmtDate(m.played_at)} — ${m.home ? 'vs' : '@'} ${m.opponent}${res}`)
      })
      lines.push('')
    }
    if (sortedS.length) {
      lines.push('🏋 ENTRENAMIENTOS:')
      sortedS.forEach(s => {
        const dur = s.duration_min ? ` (${s.duration_min} min)` : ''
        lines.push(`· ${fmtDate(s.date)}${s.title ? ` — ${s.title}` : ''}${dur}`)
      })
      lines.push('')
    }
    lines.push(`Total: ${sortedM.length} partido${sortedM.length !== 1 ? 's' : ''} · ${sortedS.length} entrenamiento${sortedS.length !== 1 ? 's' : ''}`)
    lines.push('📱 Coachly')
    await navigator.clipboard.writeText(lines.join('\n'))
    toast.success('Copiado', { description: 'Pégalo en el grupo.' })
  }

  const defaultDate = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}-${String(isThisMonth ? todayDay : 1).padStart(2, '0')}`

  return (
    <>
    <div className="flex flex-col gap-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Temporada', value: sessions.length, sub: `entreno${sessions.length !== 1 ? 's' : ''}` },
          { label: 'Este mes', value: monthSessions.length + monthMatches.length, sub: 'actividades' },
          { label: 'Tiempo total', value: totalHours, sub: totalMin > 0 ? 'entrenado' : 'sin duración' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border p-4 text-center" style={{ backgroundColor: '#151b2d', borderColor: '#2e3447' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#adb4ce' }}>{label}</p>
            <p className="text-xl font-black text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{value}</p>
            <p className="text-[10px]" style={{ color: '#adb4ce' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Calendario ── */}
      <div className="rounded-3xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>

        {/* Navegación mes */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
          <button onClick={prev} type="button" className="p-3 rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer" style={{ color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_left</span>
          </button>
          <div className="text-center">
            <p className="text-base font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{monthLabel}</p>
            <div className="flex items-center justify-center gap-4 mt-1">
              <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: '#f59e0b' }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} />
                {monthMatches.length} partido{monthMatches.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: '#4be277' }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#22c55e' }} />
                {monthSessions.length} entreno{monthSessions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button onClick={next} type="button" className="p-3 rounded-xl hover:bg-[#1e293b] transition-colors cursor-pointer" style={{ color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>chevron_right</span>
          </button>
        </div>

        {/* Cabecera días */}
        <div className="grid grid-cols-7">
          {DAYS_ES.map((d, i) => (
            <div key={d} className={`py-2.5 text-center text-[11px] font-bold uppercase border-b ${i < 6 ? 'border-r' : ''}`}
              style={{ color: i >= 5 ? '#d97706' : '#475569', borderColor: '#1e293b' }}>{d}</div>
          ))}
        </div>

        {/* Cuadrícula */}
        <div className="grid grid-cols-7">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`e${i}`} className={`border-b ${i < 6 ? 'border-r' : ''}`} style={{ borderColor: '#1e293b', minHeight: 72 }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const col = (startOffset + i) % 7
            const daySessions = sessionDays[day] ?? []
            const dayMatches  = matchDays[day] ?? []
            const hasS = daySessions.length > 0
            const hasM = dayMatches.length > 0
            const isToday    = isThisMonth && day === todayDay
            const isWeekend  = col === 5 || col === 6
            const bgColor = hasS && hasM ? 'rgba(34,197,94,0.06)' : hasS ? 'rgba(34,197,94,0.06)' : hasM ? 'rgba(245,158,11,0.06)' : 'transparent'

            return (
              <div key={day}
                className={`border-b flex flex-col items-center pt-2.5 pb-2 gap-1 ${col < 6 ? 'border-r' : ''}`}
                style={{ borderColor: '#1e293b', minHeight: 72, backgroundColor: bgColor }}>

                <span className="text-sm flex items-center justify-center w-7 h-7 rounded-full transition-all"
                  style={{
                    backgroundColor: isToday ? '#22c55e' : 'transparent',
                    color: isToday ? '#003915' : hasS || hasM ? '#f1f5f9' : isWeekend ? '#b45309' : '#475569',
                    fontWeight: isToday || hasS || hasM ? 700 : 400,
                  }}>
                  {day}
                </span>

                <div className="flex gap-1 items-center">
                  {hasS && (
                    <Link href={`/dashboard/season/${seasonId}/trainings/${daySessions[0].id}`}
                      title={daySessions[0].title ?? 'Entrenamiento'}
                      className="flex items-center justify-center w-5 h-5">
                      <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: '#22c55e' }} />
                    </Link>
                  )}
                  {hasM && (
                    <span className="flex items-center justify-center w-5 h-5">
                      <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: '#f59e0b' }} title={`vs ${dayMatches[0].opponent}`} />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center justify-center gap-6 px-5 py-3 border-t" style={{ borderColor: '#1e293b', backgroundColor: '#070d1f' }}>
          <span className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: '#4be277' }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#22c55e' }} /> Entrenamiento
          </span>
          <span className="flex items-center gap-2 text-[11px] font-semibold" style={{ color: '#f59e0b' }}>
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#f59e0b' }} /> Partido
          </span>
        </div>
      </div>

      {/* ── Lista del mes ── */}
      <div className="rounded-3xl border overflow-hidden" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: '#1e293b' }}>
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            {monthLabel} &mdash; {sortedM.length + sortedS.length} actividad{(sortedM.length + sortedS.length) !== 1 ? 'es' : ''}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {(sortedS.length > 0 || sortedM.length > 0) && (
              <>
                <DownloadImageButton
                  targetClass="print-training-month"
                  filename={`plan-${MONTHS_ES[cur.month].toLowerCase()}-${cur.year}`}
                />
                <button type="button" onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold border cursor-pointer transition-all active:scale-95 min-h-[44px]"
                  style={{ backgroundColor: '#151b2d', borderColor: '#2e3447', color: '#dce1fb' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>content_copy</span>
                  WhatsApp
                </button>
              </>
            )}
            <Link
              href={`/dashboard/season/${seasonId}/trainings/new?date=${defaultDate}`}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 min-h-[44px]"
              style={{ backgroundColor: '#22c55e', color: '#003915' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
              Sesión
            </Link>
          </div>
        </div>

        {sortedM.length === 0 && sortedS.length === 0 ? (
          <div className="py-14 text-center">
            <span className="material-symbols-outlined text-5xl block mb-2" style={{ color: '#1e293b' }}>calendar_month</span>
            <p className="text-sm" style={{ color: '#475569' }}>Sin actividades este mes</p>
          </div>
        ) : (
          <div>
            {/* Partidos */}
            {sortedM.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-5 py-2.5 border-b" style={{ borderColor: '#1e293b', backgroundColor: 'rgba(245,158,11,0.06)' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#f59e0b' }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#f59e0b' }}>Partidos</p>
                </div>
                <ul className="divide-y" style={{ borderColor: '#1e293b' }}>
                  {sortedM.map(m => {
                    const d = isoDate(m.played_at)
                    const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                    const isScheduled = m.status === 'scheduled'
                    const played = !isScheduled
                    const won    = played && (m.goals_for ?? 0) > (m.goals_against ?? 0)
                    const lost   = played && (m.goals_for ?? 0) < (m.goals_against ?? 0)
                    return (
                      <li key={m.id}>
                        <Link href={`/dashboard/season/${seasonId}/match/${m.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#151b2d] transition-colors group">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: isScheduled ? '#f59e0b' : won ? '#4be277' : lost ? '#f87171' : '#94a3b8' }} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-white">{m.home ? 'vs' : '@'} {m.opponent}</p>
                              {isScheduled ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                                  Programado
                                </span>
                              ) : (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: won ? 'rgba(34,197,94,0.15)' : lost ? 'rgba(248,113,113,0.15)' : 'rgba(148,163,184,0.15)',
                                    color: won ? '#4be277' : lost ? '#f87171' : '#94a3b8',
                                  }}>
                                  {m.goals_for}-{m.goals_against}
                                </span>
                              )}
                            </div>
                            <p className="text-xs capitalize mt-0.5" style={{ color: '#475569' }}>{dayStr}</p>
                          </div>
                          <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#475569', fontSize: 16 }}>chevron_right</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </>
            )}

            {/* Entrenamientos */}
            {sortedS.length > 0 && (
              <div className={sortedM.length > 0 ? 'border-t' : ''} style={{ borderColor: '#1e293b' }}>
                <div className="flex items-center gap-2 px-5 py-2.5 border-b" style={{ borderColor: '#1e293b', backgroundColor: 'rgba(34,197,94,0.06)' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#22c55e' }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#4be277' }}>Entrenamientos</p>
                </div>
                <ul className="divide-y" style={{ borderColor: '#1e293b' }}>
                  {sortedS.map(s => {
                    const d = isoDate(s.date)
                    const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                    return (
                      <li key={s.id}>
                        <Link href={`/dashboard/season/${seasonId}/trainings/${s.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#151b2d] transition-colors group">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#22c55e' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-white capitalize">
                                {dayStr}{s.title ? ` — ${s.title}` : ''}
                              </p>
                              {s.duration_min && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ backgroundColor: 'rgba(75,226,119,0.1)', color: '#4be277' }}>
                                  {s.duration_min} min
                                </span>
                              )}
                            </div>
                            {s.notes && <p className="text-xs mt-0.5 truncate" style={{ color: '#334155' }}>{s.notes}</p>}
                          </div>
                          <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#475569', fontSize: 16 }}>chevron_right</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* ── IMAGEN PNG ───────────────────────────────────────────────────────── */}
    <div className="print-training-month" style={{
      width: 580,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#ffffff',
      overflow: 'hidden',
    }}>
      {/* Cabecera verde oscuro */}
      <div style={{ backgroundColor: '#052e16', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {teamLogo ? (
            <img src={teamLogo} alt={teamName} loading="eager"
              style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 8, border: '2px solid rgba(255,255,255,0.15)', backgroundColor: 'white', padding: 4 }} />
          ) : (
            <div style={{ width: 52, height: 52, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>{teamName.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
          <div>
            <p style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>{teamName}</p>
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>Planificación mensual</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#4ade80', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em' }}>{MONTHS_ES[cur.month]}</p>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>{cur.year}</p>
        </div>
      </div>

      {/* Calendartio */}
      <div style={{ padding: '18px 24px 14px', backgroundColor: '#f8fafc' }}>
        {/* Días semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {DAYS_ES.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: i >= 5 ? '#d97706' : '#94a3b8', paddingBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
          ))}
        </div>
        {/* Días */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {Array.from({ length: startOffset }).map((_, i) => <div key={`pe${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const col = (startOffset + i) % 7
            const hasS = !!(sessionDays[day]?.length)
            const hasM = !!(matchDays[day]?.length)
            const isToday   = isThisMonth && day === todayDay
            const isWeekend = col === 5 || col === 6
            return (
              <div key={day} style={{
                textAlign: 'center', padding: '5px 2px', borderRadius: 6,
                backgroundColor: isToday ? '#16a34a' : hasS && hasM ? '#f0fdf4' : hasS ? '#f0fdf4' : hasM ? '#fffbeb' : 'transparent',
              }}>
                <span style={{
                  display: 'block', fontSize: 12, lineHeight: '20px',
                  fontWeight: isToday || hasS || hasM ? 700 : 400,
                  color: isToday ? 'white' : hasS ? '#16a34a' : hasM ? '#d97706' : isWeekend ? '#b45309' : '#64748b',
                }}>{day}</span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                  {hasS && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} />}
                  {hasM && <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#d97706', display: 'inline-block' }} />}
                </div>
              </div>
            )
          })}
        </div>
        {/* Leyenda */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#16a34a', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block' }} /> Entrenamiento
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#d97706', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d97706', display: 'inline-block' }} /> Partido
          </span>
        </div>
      </div>

      {/* Lista */}
      {(sortedM.length > 0 || sortedS.length > 0) && (
        <div style={{ padding: '0 24px 20px', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: sortedM.length > 0 && sortedS.length > 0 ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>

            {sortedM.length > 0 && (
              <div>
                <p style={{ margin: '16px 0 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#d97706', borderBottom: '1px solid #fef3c7', paddingBottom: 6 }}>⚽ Partidos</p>
                {sortedM.map(m => {
                  const d = isoDate(m.played_at)
                  const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                  const res = m.goals_for !== null ? ` · ${m.goals_for}-${m.goals_against}` : ''
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 7 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#d97706', display: 'inline-block', marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{m.home ? 'vs' : '@'} {m.opponent}{res}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{dayStr}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {sortedS.length > 0 && (
              <div>
                <p style={{ margin: '16px 0 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#16a34a', borderBottom: '1px solid #dcfce7', paddingBottom: 6 }}>🏋 Entrenamientos</p>
                {sortedS.map(s => {
                  const d = isoDate(s.date)
                  const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
                  const dur = s.duration_min ? ` · ${s.duration_min}m` : ''
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 7 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#16a34a', display: 'inline-block', marginTop: 4, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{s.title ?? 'Entrenamiento'}{dur}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{dayStr}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pie */}
      <div style={{ padding: '10px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
          {sortedS.length} entreno{sortedS.length !== 1 ? 's' : ''} · {sortedM.length} partido{sortedM.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>Generado con Coachly</span>
      </div>
    </div>
    </>
  )
}
