'use server'

import { redirect } from 'next/navigation'
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
    })
    .select()
    .single()

  if (error) redirect(`/dashboard/team/new?error=${encodeURIComponent(error.message)}`)

  redirect(`/dashboard/team/${team.id}/players`)
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

  redirect(`/dashboard/team/${teamId}/players`)
}

export async function togglePlayerActive(formData: FormData) {
  const supabase = await createClient()
  const playerId = formData.get('player_id') as string
  const teamId = formData.get('team_id') as string
  const active = formData.get('active') === 'true'

  await supabase.from('players').update({ active: !active }).eq('id', playerId)

  redirect(`/dashboard/team/${teamId}/players`)
}

export async function createSeason(formData: FormData) {
  const supabase = await createClient()
  const teamId = formData.get('team_id') as string

  const { error } = await supabase
    .from('seasons')
    .insert({
      team_id: teamId,
      name: formData.get('name') as string,
    })

  if (error) redirect(`/dashboard/team/${teamId}/seasons?error=${encodeURIComponent(error.message)}`)

  redirect(`/dashboard/team/${teamId}/seasons`)
}
