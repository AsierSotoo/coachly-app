'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('users')
    .update({ name: formData.get('name') as string })
    .eq('id', user.id)

  if (error) redirect('/dashboard/profile?error=' + encodeURIComponent(error.message))
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard/profile?saved=1')
}
