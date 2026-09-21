const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, mocks) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(source, { exports, process: { env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test',
  } }, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
    return mocks[name];
  } });
  return exports;
}

test('server client awaits Next cookies and writes every refreshed cookie', async () => {
  const written = [];
  const original = [{ name: 'session.0', value: 'old' }];
  let cookieAdapter;
  const { createClient } = load('utils/supabase/server.ts', {
    'next/headers': { cookies: async () => ({ getAll: () => original, set: (...args) => written.push(args) }) },
    '@supabase/ssr': { createServerClient: (_url, _key, { cookies }) => { cookieAdapter = cookies; return {}; } },
  });
  await createClient();
  assert.equal(cookieAdapter.getAll(), original);
  cookieAdapter.setAll([
    { name: 'session.0', value: 'new', options: { httpOnly: true } },
    { name: 'session.1', value: 'part2', options: {} },
  ]);
  assert.deepEqual(written.map(([name, value]) => [name, value]), [['session.0', 'new'], ['session.1', 'part2']]);
});

test('read-only Server Components tolerate cookie writes', async () => {
  let adapter;
  const { createClient } = load('utils/supabase/server.ts', {
    'next/headers': { cookies: async () => ({ getAll: () => [], set() { throw new Error('Read only'); } }) },
    '@supabase/ssr': { createServerClient: (_url, _key, { cookies }) => { adapter = cookies; return {}; } },
  });
  await createClient();
  assert.doesNotThrow(() => adapter.setAll([{ name: 'session', value: 'new', options: {} }]));
});

test('middleware returns all refreshed cookie chunks and no-cache headers', async () => {
  const requestCookies = new Map();
  const request = { cookies: { getAll: () => [], set: (name, value) => requestCookies.set(name, value) } };
  const { updateSession } = load('utils/supabase/middleware.ts', {
    'next/server': { NextResponse: { next: () => ({
      cookies: { values: new Map(), set(name, value) { this.values.set(name, value); } },
      headers: new Map(),
    }) } },
    '@supabase/ssr': { createServerClient: (_url, _key, { cookies }) => ({ auth: { getUser: async () => {
      cookies.setAll([
        { name: 'session.0', value: 'a', options: {} },
        { name: 'session.1', value: 'b', options: {} },
      ], { 'Cache-Control': 'private, no-store', Pragma: 'no-cache' });
    } } }) },
  });
  const response = await updateSession(request);
  assert.deepEqual([...requestCookies], [['session.0', 'a'], ['session.1', 'b']]);
  assert.deepEqual([...response.cookies.values], [...requestCookies]);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(response.headers.get('Pragma'), 'no-cache');
});
