/**
 * Ejecuta una migración SQL en Supabase.
 * Uso: node scripts/migrate.js supabase/migrations/001_add_team_gender.sql
 */
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const file = process.argv[2]
if (!file) {
  console.error('Uso: node scripts/migrate.js <archivo.sql>')
  process.exit(1)
}

const sql = fs.readFileSync(path.resolve(file), 'utf8')

const client = new Client({
  host: 'aws-0-eu-west-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.zvywhzezcejtcwdvoevv',
  password: process.env.DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})

async function run() {
  await client.connect()
  await client.query(sql)
  await client.query("NOTIFY pgrst, 'reload schema'")
  console.log('Migración aplicada y schema recargado.')
  await client.end()
}

run().catch(e => {
  console.error('Error:', e.message)
  client.end()
  process.exit(1)
})
