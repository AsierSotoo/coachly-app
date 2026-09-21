'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import { getFormationSlots } from '@/lib/formations'

export async function createMatch(formData: FormData) {
  const supabase = await createClient()
  const seasonId = formData.get('season_id') as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insertData: any = {
    season_id: seasonId,
    opponent: formData.get('opponent') as string,
    played_at: formData.get('played_at') as string,
    match_time: (formData.get('match_time') as string) || null,
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
  const matchId = formData.get('match_id') as string
  const seasonId = formData.get('season_id') as string

  try {
    const supabase = await createClient()
    const playerIds = (formData.get('player_ids') as string).split(',').filter(Boolean)

    // Formación táctica y asignación de posiciones
    const formation = (formData.get('formation') as string) || null
    const pitchPositions: Record<string, string> = {} // playerId → slotId
    if (formation) {
      for (const slot of getFormationSlots(formation)) {
        const pid = formData.get(`pos_${slot.id}`) as string
        if (pid) pitchPositions[pid] = slot.id
      }
    }

    // IDs de porteras para auto-calcular goles_against
    const gkIds = new Set((formData.get('gk_ids') as string ?? '').split(',').filter(Boolean))

    // Upsert appearances por cada jugadora
    type Appearance = {
      match_id: string; player_id: string; starter: boolean
      minutes: number; goals: number; assists: number
      yellow_cards: number; red_cards: number; rating: number | null
      goals_conceded: number; sub_minute: number | null
      pitch_position?: string | null
    }
    const appearances: Appearance[] = playerIds.flatMap(playerId => {
      const status = formData.get(`status_${playerId}`) as string
      if (status === 'no_convocada') return []
      const minutes       = Number(formData.get(`minutes_${playerId}`) ?? 0)
      const goals         = Number(formData.get(`goals_${playerId}`) ?? 0)
      const assists       = Number(formData.get(`assists_${playerId}`) ?? 0)
      const yellowCards   = Number(formData.get(`yellow_${playerId}`) ?? 0)
      const redCards      = Number(formData.get(`red_${playerId}`) ?? 0)
      const goalsConceded = Number(formData.get(`goals_conceded_${playerId}`) ?? 0)
      const ratingVal = Number(formData.get(`rating_${playerId}`) ?? 0)
      const subMin = formData.get(`sub_minute_${playerId}`) as string
      return [{
        match_id: matchId,
        player_id: playerId,
        starter: status === 'titular',
        minutes,
        goals,
        assists,
        yellow_cards: yellowCards,
        red_cards:    redCards,
        rating: ratingVal > 0 ? ratingVal : null,
        goals_conceded: goalsConceded,
        sub_minute: subMin ? Number(subMin) : null,
        ...(formation ? { pitch_position: pitchPositions[playerId] ?? null } : {}),
      }]
    })

    const goalsFromPlayers = appearances.reduce((sum, a) => sum + a.goals, 0)
    const goals_for = appearances.length > 0 ? goalsFromPlayers : Number(formData.get('goals_for') ?? 0)

    // Auto-calcular goles_against de las porteras si alguna tiene goles recibidos registrados
    const gkGoalsConceded = appearances
      .filter(a => gkIds.has(a.player_id) && a.goals_conceded > 0)
      .reduce((sum, a) => sum + a.goals_conceded, 0)
    const goals_against = gkGoalsConceded > 0
      ? gkGoalsConceded
      : Number(formData.get('goals_against') ?? 0)

    const newStatus = formData.get('new_status') as string | null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      opponent: formData.get('opponent') as string,
      played_at: formData.get('played_at') as string,
      match_time: (formData.get('match_time') as string) || null,
      home: formData.get('home') === 'true',
      competition: (formData.get('competition') as string) || null,
      competition_type: (formData.get('competition_type') as string) || 'liga',
      goals_for,
      goals_against,
      notes: (formData.get('notes') as string) || null,
      mvp_player_id: (formData.get('mvp_player_id') as string) || null,
      ...(formation ? { formation } : {}),
      ...(newStatus === 'finished' ? { status: 'finished' } : {}),
    }
    const { error: matchError } = await supabase.from('matches').update(updateData).eq('id', matchId)
    if (matchError) {
      redirect(`/dashboard/season/${seasonId}/match/${matchId}?error=${encodeURIComponent(matchError.message)}`)
    }

    if (appearances.length > 0) {
      const { error: upsertError } = await supabase
        .from('appearances')
        .upsert(appearances, { onConflict: 'match_id,player_id' })
      if (upsertError) {
        redirect(`/dashboard/season/${seasonId}/match/${matchId}?error=${encodeURIComponent(upsertError.message)}`)
      }
    }

    // Borrar appearances de: (a) no_convocadas y (b) suplentes con todo a cero que ya existían antes de este fix
    const savedIds = new Set(appearances.map(a => a.player_id))
    const toDelete = playerIds.filter(id => !savedIds.has(id))
    if (toDelete.length > 0) {
      await supabase.from('appearances').delete().eq('match_id', matchId).in('player_id', toDelete)
    }

    revalidatePath(`/dashboard/season/${seasonId}`)
    revalidatePath(`/dashboard/season/${seasonId}/match/${matchId}`)
    revalidatePath(`/dashboard/season/${seasonId}/stats`)
    redirect(`/dashboard/season/${seasonId}/match/${matchId}?saved=1`)

  } catch (e) {
    // redirect() de Next.js lanza un error especial — hay que relanzarlo
    const err = e as { digest?: string }
    if (err?.digest?.startsWith('NEXT_REDIRECT')) throw e
    // Cualquier otro error inesperado: mostrar el mensaje en pantalla
    const msg = e instanceof Error ? e.message : String(e)
    redirect(`/dashboard/season/${seasonId}/match/${matchId}?error=${encodeURIComponent(msg)}`)
  }
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

export async function setMatchRivalLogo(matchId: string, url: string, seasonId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('matches').update({ rival_logo_url: url }).eq('id', matchId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/season/${seasonId}/match/${matchId}`)
  return {}
}

export async function ensureMatchConvocatoria(
  matchId: string,
  seasonId: string,
  opponent: string,
  playedAt: string
): Promise<string> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('convocatorias').select('id').eq('match_id', matchId).maybeSingle()
  if (existing?.id) return existing.id
  const { data, error } = await supabase
    .from('convocatorias')
    .insert({ season_id: seasonId, match_id: matchId, opponent, played_at: playedAt })
    .select('id').single()
  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/season/${seasonId}/match/${matchId}`)
  return data.id
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
