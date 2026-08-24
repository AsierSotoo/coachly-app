'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function setPublicAvailabilityForm(formData: FormData) {
  const eventType = formData.get('event_type') as 'match' | 'training'
  const eventId   = formData.get('event_id') as string
  const playerId  = formData.get('player_id') as string
  const status    = formData.get('status') as 'available' | 'unavailable' | 'doubt'
  const token     = formData.get('token') as string

  const supabase = createAdminClient()

  if (eventType === 'match') {
    await (supabase.from('match_availability') as any).upsert(
      { match_id: eventId, player_id: playerId, status },
      { onConflict: 'match_id,player_id' },
    )
  } else {
    await (supabase.from('training_availability') as any).upsert(
      { session_id: eventId, player_id: playerId, status },
      { onConflict: 'session_id,player_id' },
    )
  }

  revalidatePath(`/disponibilidad/${token}`)
}
