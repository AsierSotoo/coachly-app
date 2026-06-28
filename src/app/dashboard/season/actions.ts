'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function createMatch(formData: FormData) {
  const supabase = await createClient()
  const seasonId = formData.get('season_id') as string

  const { data: match, error } = await supabase
    .from('matches')
    .insert({
      season_id: seasonId,
      opponent: formData.get('opponent') as string,
      played_at: formData.get('played_at') as string,
      home: formData.get('home') === 'true',
      competition: formData.get('competition') as string || null,
      goals_for: Number(formData.get('goals_for') ?? 0),
      goals_against: Number(formData.get('goals_against') ?? 0),
    })
    .select()
    .single()

  if (error) redirect(`/dashboard/season/${seasonId}?error=${encodeURIComponent(error.message)}`)

  revalidatePath(`/dashboard/season/${seasonId}`)
  redirect(`/dashboard/season/${seasonId}/match/${match.id}`)
}

export async function saveAppearances(formData: FormData) {
  const supabase = await createClient()
  const matchId = formData.get('match_id') as string
  const seasonId = formData.get('season_id') as string
  const playerIds = (formData.get('player_ids') as string).split(',').filter(Boolean)

  // Actualizar datos del partido
  await supabase
    .from('matches')
    .update({
      opponent: formData.get('opponent') as string,
      played_at: formData.get('played_at') as string,
      home: formData.get('home') === 'true',
      competition: (formData.get('competition') as string) || null,
      goals_for: Number(formData.get('goals_for') ?? 0),
      goals_against: Number(formData.get('goals_against') ?? 0),
    })
    .eq('id', matchId)

  // Upsert appearances por cada jugadora
  type Appearance = {
    match_id: string; player_id: string; starter: boolean
    minutes: number; goals: number; assists: number
    yellow_cards: number; red_cards: number
  }
  const appearances: Appearance[] = playerIds.flatMap(playerId => {
    const status = formData.get(`status_${playerId}`) as string
    if (status === 'no_convocada') return []
    return [{
      match_id: matchId,
      player_id: playerId,
      starter: status === 'titular',
      minutes: Number(formData.get(`minutes_${playerId}`) ?? 0),
      goals: Number(formData.get(`goals_${playerId}`) ?? 0),
      assists: Number(formData.get(`assists_${playerId}`) ?? 0),
      yellow_cards: Number(formData.get(`yellow_${playerId}`) ?? 0),
      red_cards: Number(formData.get(`red_${playerId}`) ?? 0),
    }]
  })

  if (appearances.length > 0) {
    await supabase
      .from('appearances')
      .upsert(appearances, { onConflict: 'match_id,player_id' })
  }

  // Borrar apariciones de jugadoras marcadas como no convocadas
  const notCalled = playerIds.filter(id => formData.get(`status_${id}`) === 'no_convocada')
  if (notCalled.length > 0) {
    await supabase
      .from('appearances')
      .delete()
      .eq('match_id', matchId)
      .in('player_id', notCalled)
  }

  revalidatePath(`/dashboard/season/${seasonId}`)
  revalidatePath(`/dashboard/season/${seasonId}/stats`)
  redirect(`/dashboard/season/${seasonId}/match/${matchId}?saved=1`)
}

export async function deleteMatch(formData: FormData) {
  const supabase = await createClient()
  const matchId = formData.get('match_id') as string
  const seasonId = formData.get('season_id') as string

  await supabase.from('matches').delete().eq('id', matchId)

  revalidatePath(`/dashboard/season/${seasonId}`)
  revalidatePath(`/dashboard/season/${seasonId}/stats`)
  redirect(`/dashboard/season/${seasonId}`)
}
