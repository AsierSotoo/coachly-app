'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export type ConvocatoriaStatus = 'titular' | 'convocada' | 'no_convocada'

export async function createConvocatoria(formData: FormData) {
  const supabase = await createClient()
  const seasonId = formData.get('season_id') as string

  const { data, error } = await supabase
    .from('convocatorias')
    .insert({
      season_id: seasonId,
      opponent: formData.get('opponent') as string,
      played_at: formData.get('played_at') as string,
    })
    .select()
    .single()

  if (error) redirect(`/dashboard/season/${seasonId}/convocatorias?error=${encodeURIComponent(error.message)}`)
  revalidatePath(`/dashboard/season/${seasonId}/convocatorias`)
  redirect(`/dashboard/season/${seasonId}/convocatorias/${data.id}`)
}

export async function saveConvocatoriaPlayers(
  convocatoriaId: string,
  seasonId: string,
  entries: { playerId: string; status: ConvocatoriaStatus }[]
) {
  const supabase = await createClient()

  await supabase
    .from('convocatoria_players')
    .upsert(
      entries.map(e => ({ convocatoria_id: convocatoriaId, player_id: e.playerId, status: e.status })),
      { onConflict: 'convocatoria_id,player_id' }
    )

  revalidatePath(`/dashboard/season/${seasonId}/convocatorias/${convocatoriaId}`)
}

export async function linkMatchToConvocatoria(convocatoriaId: string, matchId: string, seasonId: string) {
  const supabase = await createClient()
  await supabase.from('convocatorias').update({ match_id: matchId }).eq('id', convocatoriaId)
  revalidatePath(`/dashboard/season/${seasonId}/convocatorias/${convocatoriaId}`)
}

export async function unlinkMatchFromConvocatoria(convocatoriaId: string, seasonId: string) {
  const supabase = await createClient()
  await supabase.from('convocatorias').update({ match_id: null }).eq('id', convocatoriaId)
  revalidatePath(`/dashboard/season/${seasonId}/convocatorias/${convocatoriaId}`)
}

export async function updateConvocatoriaDetails(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const seasonId = formData.get('season_id') as string

  await supabase.from('convocatorias').update({
    opponent: formData.get('opponent') as string,
    played_at: formData.get('played_at') as string,
  }).eq('id', id)

  revalidatePath(`/dashboard/season/${seasonId}/convocatorias/${id}`)
}

export async function deleteConvocatoria(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const seasonId = formData.get('season_id') as string
  await supabase.from('convocatorias').delete().eq('id', id)
  revalidatePath(`/dashboard/season/${seasonId}/convocatorias`)
  redirect(`/dashboard/season/${seasonId}/convocatorias`)
}
