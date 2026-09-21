// Optional isolated SQL check. See README for the temporary PGlite install.
// This does not connect to Supabase or read environment credentials.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const db = new PGlite();
  try {
    // Minimal Auth fixture: the provider owns this schema, not our migrations.
    await db.exec(`
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create schema auth;
      grant usage on schema auth to anon, authenticated, service_role;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    `);
    const migrations = fs.readdirSync('supabase/migrations').filter(file => file.endsWith('.sql')).sort();
    for (const file of migrations) {
      await db.exec(fs.readFileSync(path.join('supabase/migrations', file), 'utf8'));
      console.log(`Applied ${file}`);
    }
    const permissionTest = 'supabase/tests/provider-access.sql';
    if (fs.existsSync(permissionTest)) {
      await db.exec(fs.readFileSync(permissionTest, 'utf8'));
      console.log('Provider quota and ownership SQL assertions passed');
    }
    console.log('Fresh application schema checks passed');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
