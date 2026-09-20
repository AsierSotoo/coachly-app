'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function createTrainingSession(formData: FormData) {
  const supabase = await createClient()
  const seasonId = formData.get('season_id') as string
  const teamId   = formData.get('team_id') as string

  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      season_id:    seasonId,
      team_id:      teamId,
      date:         formData.get('date') as string,
      start_time:   formData.get('start_time') as string || null,
      title:        formData.get('title') as string || null,
      notes:        formData.get('notes') as string || null,
      duration_min: formData.get('duration_min') ? Number(formData.get('duration_min')) : null,
    })
    .select()
    .single()

  if (error) redirect(`/dashboard/season/${seasonId}/trainings?error=${encodeURIComponent(error.message)}`)
  revalidatePath(`/dashboard/season/${seasonId}/trainings`)
  redirect(`/dashboard/season/${seasonId}/trainings/${data.id}?saved=1`)
}

export async function updateTrainingSession(formData: FormData) {
  const supabase = await createClient()
  const id       = formData.get('id') as string
  const seasonId = formData.get('season_id') as string

  await supabase
    .from('training_sessions')
    .update({
      date:         formData.get('date') as string,
      start_time:   formData.get('start_time') as string || null,
      title:        formData.get('title') as string || null,
      notes:        formData.get('notes') as string || null,
      duration_min: formData.get('duration_min') ? Number(formData.get('duration_min')) : null,
    })
    .eq('id', id)

  revalidatePath(`/dashboard/season/${seasonId}/trainings`)
  revalidatePath(`/dashboard/season/${seasonId}/trainings/${id}`)
  redirect(`/dashboard/season/${seasonId}/trainings/${id}?saved=1`)
}

export async function saveTrainingAttendance(
  sessionId: string,
  seasonId: string,
  entries: { playerId: string; attended: boolean; reason: string | null }[]
) {
  const supabase = await createClient()
  await supabase.from('training_attendance').upsert(
    entries.map(e => ({
      session_id:      sessionId,
      player_id:       e.playerId,
      attended:        e.attended,
      absence_reason:  e.attended ? null : (e.reason || null),
    })),
    { onConflict: 'session_id,player_id' }
  )
  revalidatePath(`/dashboard/season/${seasonId}/trainings/${sessionId}`)
}

export async function deleteTrainingSession(formData: FormData) {
  const supabase = await createClient()
  const id       = formData.get('id') as string
  const seasonId = formData.get('season_id') as string

  await supabase.from('training_sessions').delete().eq('id', id)
  revalidatePath(`/dashboard/season/${seasonId}/trainings`)
  redirect(`/dashboard/season/${seasonId}/trainings`)
}
