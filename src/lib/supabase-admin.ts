import { createClient } from '@supabase/supabase-js'

// Cliente con service_role — solo usar en Server Components/API routes, nunca en el browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
