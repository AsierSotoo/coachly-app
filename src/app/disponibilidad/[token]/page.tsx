import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { setPublicAvailabilityForm } from '@/lib/public-availability-actions'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function PublicAvailabilityPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  // Buscar el partido por token (público, sin auth)
  const { data: match } = await (supabase.from('matches') as any)
    .select('id, opponent, rival_logo_url, played_at, venue, availability_token, seasons(team_id, name, teams(id, name, logo_url, availability_enabled))')
    .eq('availability_token', token)
    .maybeSingle()

  if (!match) notFound()

  const season = match.seasons as { team_id: string; name: string; teams: { id: string; name: string; logo_url: string | null; availability_enabled: boolean } }
  const team = season.teams

  if (!team.availability_enabled) notFound()

  // Jugadoras activas del equipo
  const { data: players } = await supabase
    .from('players')
    .select('id, name, number, position, photo_url')
    .eq('team_id', team.id)
    .eq('active', true)
    .order('number', { ascending: true, nullsFirst: false })

  // Disponibilidad actual para este partido
  const { data: availRows } = await (supabase.from('match_availability') as any)
    .select('player_id, status')
    .eq('match_id', match.id)

  const availMap = new Map<string, string>()
  for (const r of availRows ?? []) availMap.set(r.player_id, r.status)

  const matchDate = new Date(match.played_at)
  const dateStr = matchDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const statusConfig = {
    available:   { label: 'Voy', icon: 'check_circle', color: '#4be277', bg: 'rgba(75,226,119,0.15)', border: 'rgba(75,226,119,0.4)' },
    doubt:       { label: 'Duda', icon: 'help',         color: '#fbbf24', bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)' },
    unavailable: { label: 'No puedo', icon: 'cancel',   color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)' },
  } as const

  // Resumen de confirmaciones
  const nAvail   = (availRows ?? []).filter((r: any) => r.status === 'available').length
  const nDoubt   = (availRows ?? []).filter((r: any) => r.status === 'doubt').length
  const nUnavail = (availRows ?? []).filter((r: any) => r.status === 'unavailable').length

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080d1e', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header equipo */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b flex items-center gap-3"
        style={{ backgroundColor: '#0c1324', borderColor: '#1e293b' }}>
        {team.logo_url
          ? <Image src={team.logo_url} alt={team.name} width={32} height={32} className="rounded-lg object-contain" unoptimized />
          : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ backgroundColor: '#1e293b', color: '#4be277' }}>
              {team.name.charAt(0)}
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: '#adb4ce' }}>{team.name}</p>
          <p className="text-[10px]" style={{ color: '#475569' }}>Confirma tu disponibilidad</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span style={{ color: '#4be277' }}>{nAvail}✓</span>
          <span style={{ color: '#fbbf24' }}>{nDoubt}?</span>
          <span style={{ color: '#f87171' }}>{nUnavail}✗</span>
        </div>
      </div>

      {/* Cabecera del partido */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-center gap-6">
          {/* Logo equipo */}
          <div className="flex flex-col items-center gap-1.5">
            {team.logo_url
              ? <Image src={team.logo_url} alt={team.name} width={56} height={56} className="rounded-xl object-contain" unoptimized />
              : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black"
                  style={{ backgroundColor: '#1e293b', color: '#4be277' }}>{team.name.charAt(0)}</div>
            }
            <p className="text-[11px] font-semibold text-center max-w-[80px] leading-tight" style={{ color: '#adb4ce' }}>{team.name}</p>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[13px] font-black" style={{ color: '#475569' }}>VS</span>
          </div>

          {/* Logo rival */}
          <div className="flex flex-col items-center gap-1.5">
            {match.rival_logo_url
              ? <Image src={match.rival_logo_url} alt={match.opponent} width={56} height={56} className="rounded-xl object-contain" unoptimized />
              : <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black"
                  style={{ backgroundColor: '#1e293b', color: '#adb4ce' }}>{match.opponent.charAt(0)}</div>
            }
            <p className="text-[11px] font-semibold text-center max-w-[80px] leading-tight" style={{ color: '#adb4ce' }}>{match.opponent}</p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm font-semibold capitalize" style={{ color: '#dce1fb' }}>{dateStr}</p>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
            {timeStr}{match.venue ? ` · ${match.venue}` : ''}
          </p>
        </div>
      </div>

      {/* Instrucción */}
      <div className="px-4 pb-3">
        <p className="text-center text-sm" style={{ color: '#64748b' }}>
          Pulsa tu nombre y luego tu disponibilidad
        </p>
      </div>

      {/* Lista de jugadoras */}
      <div className="px-3 pb-8 flex flex-col gap-2">
        {(players ?? []).map(p => {
          const currentStatus = availMap.get(p.id) as keyof typeof statusConfig | undefined
          return (
            <div key={p.id} className="rounded-2xl border overflow-hidden"
              style={{ backgroundColor: '#0f172a', borderColor: currentStatus ? statusConfig[currentStatus].border : '#1e293b' }}>
              {/* Fila del jugador */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ backgroundColor: '#1e293b', color: '#adb4ce' }}>
                  {p.number ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#dce1fb' }}>{p.name}</p>
                  {p.position && <p className="text-[10px]" style={{ color: '#475569' }}>{p.position}</p>}
                </div>
                {currentStatus && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ color: statusConfig[currentStatus].color, backgroundColor: statusConfig[currentStatus].bg }}>
                    {statusConfig[currentStatus].label}
                  </span>
                )}
              </div>
              {/* Botones de estado */}
              <div className="grid grid-cols-3 border-t" style={{ borderColor: '#1e293b' }}>
                {(Object.entries(statusConfig) as [keyof typeof statusConfig, typeof statusConfig[keyof typeof statusConfig]][]).map(([key, cfg]) => {
                  const isActive = currentStatus === key
                  return (
                    <form key={key} action={setPublicAvailabilityForm}>
                      <input type="hidden" name="match_id"  value={match.id} />
                      <input type="hidden" name="player_id" value={p.id} />
                      <input type="hidden" name="status"    value={key} />
                      <input type="hidden" name="token"     value={token} />
                      <button type="submit"
                        className="w-full flex flex-col items-center gap-0.5 py-2.5 transition-all active:scale-95"
                        style={{
                          backgroundColor: isActive ? cfg.bg : 'transparent',
                          color: isActive ? cfg.color : '#475569',
                        }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                          {cfg.icon}
                        </span>
                        <span className="text-[10px] font-semibold">{cfg.label}</span>
                      </button>
                    </form>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="text-center pb-8 pt-2">
        <p className="text-[10px]" style={{ color: '#334155' }}>Gestión de equipos con Coachly</p>
      </div>
    </div>
  )
}
