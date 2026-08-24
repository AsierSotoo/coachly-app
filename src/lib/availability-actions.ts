'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

type AvailStatus = 'available' | 'unavailable' | 'doubt'

export async function setPlayerAvailability(
  matchId: string,
  playerId: string,
  status: AvailStatus | null,
  seasonId: string,
) {
  const supabase = await createClient()
  if (!status) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('match_availability') as any)
      .delete()
      .eq('match_id', matchId)
      .eq('player_id', playerId)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('match_availability') as any)
      .upsert({ match_id: matchId, player_id: playerId, status }, { onConflict: 'match_id,player_id' })
  }
  revalidatePath(`/dashboard/season/${seasonId}/match/${matchId}`)
  revalidatePath(`/dashboard/season/${seasonId}`)
}
