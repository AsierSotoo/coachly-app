'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import type { TacticsTemplate, MatchTactics } from '@/lib/tactics'

export async function saveTacticsTemplate(seasonId: string, template: TacticsTemplate) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('seasons')
    .update({ tactics_template: template })
    .eq('id', seasonId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/season/${seasonId}/tactics`)
  return {}
}

export async function saveMatchTactics(matchId: string, seasonId: string, tactics: MatchTactics) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('matches')
    .update({ tactics })
    .eq('id', matchId)
  if (error) return { error: error.message }
  revalidatePath(`/dashboard/season/${seasonId}/match/${matchId}`)
  return {}
}
