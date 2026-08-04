'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      user_id: user.id,
      name: formData.get('name') as string,
      category: formData.get('category') as string || null,
      gender: formData.get('gender') as string || null,
    })
    .select()
    .single()

  if (error) redirect(`/dashboard/team/new?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard')
  redirect(`/dashboard/team/${team.id}/players`)
}

export async function updateTeam(formData: FormData) {
  const supabase = await createClient()
  const teamId = formData.get('team_id') as string

  const { error } = await supabase
    .from('teams')
    .update({
      name: formData.get('name') as string,
      category: formData.get('category') as string || null,
      gender: formData.get('gender') as string || null,
    })
    .eq('id', teamId)

  if (error) redirect(`/dashboard/team/${teamId}/settings?error=${encodeURIComponent(error.message)}`)

  revalidatePath('/dashboard')
  redirect(`/dashboard/team/${teamId}/settings?saved=1`)
}

export async function addPlayer(formData: FormData) {
  const supabase = await createClient()
  const teamId = formData.get('team_id') as string

  const { error } = await supabase
    .from('players')
    .insert({
      team_id: teamId,
      name: formData.get('name') as string,
      number: formData.get('number') ? Number(formData.get('number')) : null,
      position: formData.get('position') as string || null,
    })

  if (error) redirect(`/dashboard/team/${teamId}/players?error=${encodeURIComponent(error.message)}`)

  revalidatePath(`/dashboard/team/${teamId}/players`)
  redirect(`/dashboard/team/${teamId}/players`)
}

export async function updatePlayer(formData: FormData) {
  const supabase = await createClient()
  const playerId = formData.get('player_id') as string
  const teamId = formData.get('team_id') as string

  const { error } = await supabase
    .from('players')
    .update({
      name: formData.get('name') as string,
      number: formData.get('number') ? Number(formData.get('number')) : null,
      position: formData.get('position') as string || null,
      bio: formData.get('bio') as string || null,
    })
    .eq('id', playerId)

  if (error) redirect(`/dashboard/team/${teamId}/players?error=${encodeURIComponent(error.message)}`)

  revalidatePath(`/dashboard/team/${teamId}/players`)
  revalidatePath(`/dashboard/team/${teamId}/players/${playerId}`)
  redirect(`/dashboard/team/${teamId}/players/${playerId}?saved=1`)
}

export async function updatePlayerBio(formData: FormData) {
  const supabase = await createClient()
  const playerId = formData.get('player_id') as string
  const teamId   = formData.get('team_id') as string

  await supabase
    .from('players')
    .update({ bio: formData.get('bio') as string || null })
    .eq('id', playerId)

  revalidatePath(`/dashboard/team/${teamId}/players/${playerId}`)
  revalidatePath(`/dashboard/team/${teamId}/players`)
  redirect(`/dashboard/team/${teamId}/players/${playerId}?saved=1`)
}

export async function togglePlayerActive(formData: FormData) {
  const supabase = await createClient()
  const playerId = formData.get('player_id') as string
  const teamId = formData.get('team_id') as string
  const active = formData.get('active') === 'true'

  await supabase.from('players').update({ active: !active }).eq('id', playerId)

  revalidatePath(`/dashboard/team/${teamId}/players`)
  redirect(`/dashboard/team/${teamId}/players`)
}

export async function deleteTeam(formData: FormData) {
  const supabase = await createClient()
  const teamId = formData.get('team_id') as string

  await supabase.from('teams').delete().eq('id', teamId)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function deletePlayer(formData: FormData) {
  const supabase = await createClient()
  const playerId = formData.get('player_id') as string
  const teamId   = formData.get('team_id') as string

  const { count } = await supabase
    .from('appearances')
    .select('id', { count: 'exact', head: true })
    .eq('player_id', playerId)

  if (count && count > 0) {
    redirect(`/dashboard/team/${teamId}/players/${playerId}?error=has_appearances`)
  }

  await supabase.from('players').delete().eq('id', playerId)
  revalidatePath(`/dashboard/team/${teamId}/players`)
  redirect(`/dashboard/team/${teamId}/players`)
}

export async function deleteSeason(formData: FormData) {
  const supabase = await createClient()
  const seasonId = formData.get('season_id') as string
  const teamId = formData.get('team_id') as string
  await supabase.from('seasons').delete().eq('id', seasonId)
  revalidatePath(`/dashboard/team/${teamId}/seasons`)
  revalidatePath('/dashboard')
  redirect(`/dashboard/team/${teamId}/seasons`)
}

export async function createSeason(formData: FormData) {
  const supabase = await createClient()
  const teamId = formData.get('team_id') as string

  const { error } = await supabase
    .from('seasons')
    .insert({ team_id: teamId, name: formData.get('name') as string })

  if (error) redirect(`/dashboard/team/${teamId}/seasons?error=${encodeURIComponent(error.message)}`)

  revalidatePath(`/dashboard/team/${teamId}/seasons`)
  revalidatePath('/dashboard')
  redirect(`/dashboard/team/${teamId}/seasons`)
}
