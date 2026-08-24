'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function setPublicAvailabilityForm(formData: FormData) {
  const matchId  = formData.get('match_id') as string
  const playerId = formData.get('player_id') as string
  const status   = formData.get('status') as 'available' | 'unavailable' | 'doubt'
  const token    = formData.get('token') as string

  const supabase = createAdminClient()
  await (supabase.from('match_availability') as any).upsert(
    { match_id: matchId, player_id: playerId, status },
    { onConflict: 'match_id,player_id' },
  )
  revalidatePath(`/disponibilidad/${token}`)
}
