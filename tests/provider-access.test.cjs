const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const zod = require('zod');
const next = { NextResponse: Object.assign(class extends Response {}, { json: (body, options) => new Response(JSON.stringify(body), options) }) };
function load(file, mocks, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import ${name}`); return mocks[name];
  }, process: { env: {} }, Uint8Array, TextDecoder, URL, Response, AbortSignal, Buffer, console, ...globals });
  return exports;
}
function setup({ user = { id: 'owner' }, billing = null, billingError = null, quota = 'ok', usageError = null } = {}) {
  const calls = [];
  const access = load('lib/provider-access.ts', {
    'next/server': next, zod, 'server-only': {},
    '@/utils/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user } }) } }) },
    '@supabase/supabase-js': { createClient: () => ({
      from: table => ({ select: fields => ({ eq: (column, value) => ({ maybeSingle: async () => {
        calls.push({ table, fields, column, value }); return { data: billing, error: billingError };
      } }) }) }),
      rpc: async (name, args) => { calls.push({ name, ...args }); return { data: quota, error: usageError }; },
    }) },
  });
  return { access, calls };
}
function request(body = {}, path = 'generate-names') {
  return new Request(`https://branded.ai/${path}`, { method: 'POST', body: JSON.stringify(body), headers: { origin: 'https://branded.ai' } });
}
test('auth rejects signed out, anonymous-auth and cross-origin callers', async () => {
  for (const user of [null, { id: 'anon', is_anonymous: true }]) {
    const { access, calls } = setup({ user });
    await assert.rejects(access.requireUser(request()), e => e.status === 401);
    assert.equal(calls.length, 0);
  }
  const { access } = setup();
  await assert.rejects(access.requireUser(new Request('https://branded.ai/generate-logo', { headers: { origin: 'https://evil.example' } })), e => e.status === 403);
});
test('untrusted profile fields never enter entitlement lookup; expired paid accounts get free caps', async () => {
  for (const billing of [null, { plan_tier: 'business', subscription_status: 'active', current_period_end: '2000-01-01' }, { plan_tier: 'business', subscription_status: 'past_due', current_period_end: '2100-01-01' }]) {
    const { access, calls } = setup({ billing }); await access.reserveUsage('owner', 'logos');
    assert.equal(calls[0].table, 'billing_accounts'); assert.equal(calls[0].value, 'owner');
    assert.equal(calls[1].p_limit, 1);
  }
});
test('scheduled cancellation preserves paid quota through the paid period', async () => {
  const { access, calls } = setup({ billing: { plan_tier: 'pro', subscription_status: 'active', current_period_end: '2100-01-01', cancel_at_period_end: true } });
  await access.reserveUsage('owner', 'logos'); assert.equal(calls[1].p_limit, 5);
});
test('billing/usage failures fail closed; exhaustion returns 429', async () => {
  for (const args of [{ billingError: new Error() }, { usageError: new Error() }]) {
    await assert.rejects(setup(args).access.reserveUsage('owner', 'logos'), e => e.status === 503);
  }
  for (const quota of ['monthly', 'rate']) await assert.rejects(setup({ quota }).access.reserveUsage('owner', 'logos'), e => e.status === 429);
});
test('body cap applies without Content-Length; malformed and oversized bodies never parse', async () => {
  const { access } = setup();
  await assert.rejects(access.readBody(request({ name: 'a'.repeat(17000) }), zod.z.object({ name: zod.z.string() })), e => e.status === 413);
  await assert.rejects(access.readBody(request({ name: 123 }), zod.z.object({ name: zod.z.string() })));
});
function routeHarness(route, options = {}) {
  const { access, calls } = setup(options); let providerCalls = 0;
  class OpenAI { constructor() {
    this.chat = { completions: { create: async () => { providerCalls++; return { choices: [{ message: { content: '1. Alpha\n2. Beta\n3. Gamma' } }] }; } } };
    this.images = { generate: async () => { providerCalls++; return { data: [{ url: 'https://image.example' }] }; } };
  } }
  const routeModule = load(`app/${route}/route.ts`, {
    '@/lib/provider-access': access, zod, 'next/server': next, openai: { OpenAI },
    braintrust: { initLogger() {}, wrapOpenAI: x => x, traced: async fn => fn({ log() {} }) },
  }, { fetch: async url => { providerCalls++; return { ok: true, json: async () => ({ domain_registered: String(url).includes('Alpha') ? 'no' : 'yes' }) }; } });
  return { routeModule, calls, providerCalls: () => providerCalls };
}
for (const route of ['generate-logo', 'generate-names', 'find-npm-names', 'generate-one-pager-content', 'find-domain-availability', 'find-trademarks', 'find-npm-availability']) {
  test(`${route}: direct signed-out requests never reach providers`, async () => {
    const { routeModule, calls, providerCalls } = routeHarness(route, { user: null });
    const response = routeModule.POST ? await routeModule.POST(request()) : await routeModule.GET({ url: `https://branded.ai/${route}`, headers: new Headers(), nextUrl: new URL(`https://branded.ai/${route}?query=alpha&searchTerm=alpha`) });
    assert.equal(response.status, 401); assert.equal(calls.length, 0); assert.equal(providerCalls(), 0);
  });
}
test('invalid generation requests and exhausted quota never reach OpenAI', async () => {
  const invalid = routeHarness('generate-names');
  assert.equal((await invalid.routeModule.POST(request({}))).status, 400);
  assert.equal(invalid.providerCalls(), 0); assert.equal(invalid.calls.length, 0);
  const limited = routeHarness('generate-logo', { quota: 'monthly' });
  assert.equal((await limited.routeModule.POST(request({ name: 'Alpha' }))).status, 429);
  assert.equal(limited.providerCalls(), 0);
});
test('domain filter keeps the one verified result and warns about shortage', async () => {
  const route = routeHarness('generate-names');
  const response = await route.routeModule.POST(request({ description: 'Dev tools', minLength: 3, maxLength: 10, style: 'any', wordPlacement: 'any', tld: true }));
  assert.equal(response.status, 200);
  const data = await response.json(); assert.deepEqual(data.response, ['Alpha']); assert.match(data.fallbackMessage, /Only 1/);
  assert.equal(route.providerCalls(), 4);
});
test('PDF logos reject arbitrary/credential URLs before any fetch and disable redirects', async () => {
  const { access } = setup(); let fetches = 0;
  const logo = load('lib/one-pager-logo.ts', { './provider-access': access }, { fetch: async (url, options) => {
    fetches++; assert.equal(options.redirect, 'error');
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } });
  } });
  for (const url of ['http://127.0.0.1/logo', 'https://evil.example/logo', 'https://user@oaidalleapiprodscus.blob.core.windows.net/logo']) {
    await assert.rejects(logo.onePagerLogo(url), e => e.status === 400);
  }
  assert.equal(fetches, 0);
  assert.equal(await logo.onePagerLogo('https://oaidalleapiprodscus.blob.core.windows.net/logo.png'), 'data:image/png;base64,AQID');
});
test('PDF signed-out requests never render or fetch a logo', async () => {
  const { access } = setup({ user: null }); let providerCalls = 0;
  const route = load('app/one-pager/route.tsx', {
    'next/server': next, zod, '@/lib/provider-access': access,
    '@/lib/one-pager-logo': { onePagerLogo: () => { providerCalls++; } },
    '@onedoc/react-print': { compile: () => { providerCalls++; } },
    '@onedoc/client': { Onedoc: class { render() { providerCalls++; } } },
    '../documents/one-pager': { OnePager() {} }, react: {},
  });
  const response = await route.GET(new Request('https://branded.ai/one-pager'));
  assert.equal(response.status, 401); assert.equal(providerCalls, 0);
});
test('share creation rejects another owner’s name and creates no public token', async () => {
  const { access } = setup(); let writes = 0;
  const route = load('app/api/name-shares/route.ts', {
    'next/server': next, zod,
    '@/lib/provider-access': { ...access,
      requireUser: async () => ({ user: { id: 'owner' }, client: { from: () => ({ select: () => ({ in: () => ({ eq: async () => ({ data: [] }) }) }) }) } }),
      adminClient: () => { writes++; throw new Error('Should not write'); },
    },
  });
  const response = await route.POST(request({ ids: ['20000000-0000-4000-8000-000000000001'] }));
  assert.equal(response.status, 403); assert.equal(writes, 0);
});
