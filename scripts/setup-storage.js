const { Client } = require('pg')

const client = new Client({
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.zvywhzezcejtcwdvoevv',
  password: process.env.DB_PASSWORD || 'Reisa1001++',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})

async function run() {
  await client.connect()

  // 1. Columna logo_url en teams
  await client.query(`ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS logo_url text`)
  console.log('✓ logo_url añadida')

  // 2. Bucket público
  await client.query(`
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('team-logos', 'team-logos', true)
    ON CONFLICT (id) DO NOTHING
  `)
  console.log('✓ Bucket team-logos creado')

  // 3. Políticas de storage
  const policies = [
    { name: 'team-logos: public read',  sql: `CREATE POLICY "team-logos: public read" ON storage.objects FOR SELECT USING (bucket_id = 'team-logos')` },
    { name: 'team-logos: auth upload',  sql: `CREATE POLICY "team-logos: auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'team-logos')` },
    { name: 'team-logos: auth update',  sql: `CREATE POLICY "team-logos: auth update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'team-logos')` },
    { name: 'team-logos: auth delete',  sql: `CREATE POLICY "team-logos: auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'team-logos')` },
  ]

  for (const { name, sql } of policies) {
    const exists = await client.query(
      `SELECT 1 FROM pg_policies WHERE tablename='objects' AND schemaname='storage' AND policyname=$1`,
      [name]
    )
    if (exists.rowCount === 0) await client.query(sql)
  }
  console.log('✓ Políticas de storage configuradas')

  await client.query("NOTIFY pgrst, 'reload schema'")
  console.log('✓ Schema recargado')

  await client.end()
}

run().catch(async e => {
  console.error('ERROR:', e.message)
  await client.end()
  process.exit(1)
})
