'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

// Cliente anónimo — para validar el token antes de escribir
function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function setPublicAvailabilityForm(formData: FormData) {
  const eventType = formData.get('event_type') as string
  const eventId   = formData.get('event_id')   as string
  const playerId  = formData.get('player_id')  as string
  const status    = formData.get('status')     as string
  const token     = formData.get('token')      as string

  // Validación básica de tipos
  if (!eventId || !playerId || !token) return
  if (!['match', 'training'].includes(eventType)) return
  if (!['available', 'unavailable', 'doubt'].includes(status)) return

  const anon = createPublicClient()
  let teamId: string | null = null

  // Verificar que el token pertenece al evento indicado y que el feature está activo
  if (eventType === 'match') {
    const { data: match } = await (anon.from('matches') as any)
      .select('id, seasons(team_id, teams(id, availability_enabled))')
      .eq('id', eventId)
      .eq('availability_token', token)
      .maybeSingle()

    if (!match) return // token no coincide con el evento → rechazar
    const team = (match.seasons as any).teams as { id: string; availability_enabled: boolean } | null
    if (!team?.availability_enabled) return
    teamId = team.id

  } else {
    const { data: session } = await (anon.from('training_sessions') as any)
      .select('id, teams(id, availability_enabled)')
      .eq('id', eventId)
      .eq('availability_token', token)
      .maybeSingle()

    if (!session) return
    const team = session.teams as { id: string; availability_enabled: boolean } | null
    if (!team?.availability_enabled) return
    teamId = team.id
  }

  // Verificar que la jugadora pertenece a este equipo y está activa
  const { data: player } = await anon
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('team_id', teamId!)
    .eq('active', true)
    .maybeSingle()

  if (!player) return // jugadora no pertenece a este equipo → rechazar

  // Todo validado → escribir con admin client (bypasea RLS)
  const admin = createAdminClient()

  if (eventType === 'match') {
    await (admin.from('match_availability') as any).upsert(
      { match_id: eventId, player_id: playerId, status },
      { onConflict: 'match_id,player_id' },
    )
  } else {
    await (admin.from('training_availability') as any).upsert(
      { session_id: eventId, player_id: playerId, status },
      { onConflict: 'session_id,player_id' },
    )
  }

  revalidatePath(`/disponibilidad/${token}`)
}
