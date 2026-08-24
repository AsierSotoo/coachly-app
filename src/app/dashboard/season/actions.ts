'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function createMatch(formData: FormData) {
  const supabase = await createClient()
  const seasonId = formData.get('season_id') as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertData: any = {
    season_id: seasonId,
    opponent: formData.get('opponent') as string,
    played_at: formData.get('played_at') as string,
    home: formData.get('home') === 'true',
    competition: formData.get('competition') as string || null,
    competition_type: formData.get('competition_type') as string || 'liga',
    goals_for: 0,
    goals_against: 0,
    status: 'scheduled',
  }
  const { error } = await supabase.from('matches').insert(insertData)

  if (error) redirect(`/dashboard/season/${seasonId}?error=${encodeURIComponent(error.message)}`)

  revalidatePath(`/dashboard/season/${seasonId}`)
  redirect(`/dashboard/season/${seasonId}`)
}

export async function saveAppearances(formData: FormData) {
  const supabase = await createClient()
  const matchId = formData.get('match_id') as string
  const seasonId = formData.get('season_id') as string
  const playerIds = (formData.get('player_ids') as string).split(',').filter(Boolean)

  // Upsert appearances por cada jugadora
  type Appearance = {
    match_id: string; player_id: string; starter: boolean
    minutes: number; goals: number; assists: number
    yellow_cards: number; red_cards: number; rating: number | null
  }
  const appearances: Appearance[] = playerIds.flatMap(playerId => {
    const status = formData.get(`status_${playerId}`) as string
    if (status === 'no_convocada') return []
    const ratingVal = Number(formData.get(`rating_${playerId}`) ?? 0)
    return [{
      match_id: matchId,
      player_id: playerId,
      starter: status === 'titular',
      minutes: Number(formData.get(`minutes_${playerId}`) ?? 0),
      goals: Number(formData.get(`goals_${playerId}`) ?? 0),
      assists: Number(formData.get(`assists_${playerId}`) ?? 0),
      yellow_cards: Number(formData.get(`yellow_${playerId}`) ?? 0),
      red_cards: Number(formData.get(`red_${playerId}`) ?? 0),
      rating: ratingVal > 0 ? ratingVal : null,
    }]
  })

  // goals_for se calcula de la suma de goles individuales cuando hay jugadoras registradas
  const goalsFromPlayers = appearances.reduce((sum, a) => sum + a.goals, 0)
  const goals_for = appearances.length > 0 ? goalsFromPlayers : Number(formData.get('goals_for') ?? 0)

  // Finalizar partido si se solicita
  const newStatus = formData.get('new_status') as string | null

  // Actualizar datos del partido
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    opponent: formData.get('opponent') as string,
    played_at: formData.get('played_at') as string,
    home: formData.get('home') === 'true',
    competition: (formData.get('competition') as string) || null,
    competition_type: (formData.get('competition_type') as string) || 'liga',
    goals_for,
    goals_against: Number(formData.get('goals_against') ?? 0),
    notes: (formData.get('notes') as string) || null,
    mvp_player_id: (formData.get('mvp_player_id') as string) || null,
    ...(newStatus === 'finished' ? { status: 'finished' } : {}),
  }
  await supabase.from('matches').update(updateData).eq('id', matchId)

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

export async function updateSeasonLeague(formData: FormData) {
  const supabase = await createClient()
  const seasonId = formData.get('season_id') as string
  const pos = formData.get('league_position') as string
  const total = formData.get('league_total_teams') as string

  await supabase
    .from('seasons')
    .update({
      league_position: pos ? Number(pos) : null,
      league_total_teams: total ? Number(total) : null,
    })
    .eq('id', seasonId)

  revalidatePath(`/dashboard/season/${seasonId}`)
  redirect(`/dashboard/season/${seasonId}`)
}
