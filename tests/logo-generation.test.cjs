const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const zod = require('zod');
function load(file, mocks, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, require: name => {
    if (!(name in mocks)) throw new Error(`Unexpected import ${name}`); return mocks[name];
  }, process: { env: {} }, Uint8Array, TextDecoder, URL, Response, AbortSignal, Buffer, ...globals });
  return exports;
}
const next = { NextResponse: { json: (body, options) => Response.json(body, options) } };
const image = load('lib/logo-image.ts', {});
// Minimal JPEG frame fixture; tests inspect format/dimensions, not visual decoding.
function jpeg(width = 1024, height = 1024) {
  const bytes = Buffer.from([255,216,255,192,0,11,8,0,0,0,0,1,1,17,0,255,217]);
  bytes.writeUInt16BE(height, 7); bytes.writeUInt16BE(width, 9);
  return bytes.toString('base64');
}
const validJpeg = jpeg();
const dataUrl = image.JPEG_DATA_PREFIX + validJpeg;
const nameId = '20000000-0000-4000-8000-000000000001';
function request(body = { nameId }, endpoint = 'generate-logo') {
  return new Request(`https://branded.ai/${endpoint}`, { method: 'POST', body: JSON.stringify(body) });
}
function harness({ owner = true, dbError = false, output = validJpeg, saved = false, logo = dataUrl, quota = false } = {}) {
  const queries = [], operations = [], writes = [], providerRequests = [];
  const client = { from(table) {
    const query = { table, filters: [] }; queries.push(query);
    return {
      select() { return this; }, eq(column, value) { query.filters.push([column, value]); return this; }, limit() { return this; },
      async maybeSingle() {
        if (table === 'names') return { data: owner ? { name: 'Orbit' } : null };
        if (table === 'profiles') return { data: { name: 'Founder' } };
        return { data: saved || table === 'logos' && logo ? { id: 'logo-id', logo_url: logo } : null };
      },
      insert(value) { writes.push({ mode: 'insert', value }); return this; },
      update(value) { writes.push({ mode: 'update', value }); return this; },
      then(resolve, reject) { operations.push('persist'); return Promise.resolve({ error: dbError ? new Error('Database unavailable') : null }).then(resolve, reject); },
    };
  } };
  const access = load('lib/provider-access.ts', { 'server-only': {}, 'next/server': next, zod,
    '@/utils/supabase/server': { createClient: async () => ({ ...client, auth: { getUser: async () => ({ data: { user: { id: 'owner', email: 'owner@example.test' } } }) } }) },
    '@supabase/supabase-js': {},
  });
  const accessMock = { ...access, reserveUsage: async () => { operations.push('reserve'); if (quota) throw new access.AccessError(429, 'Limit reached'); } };
  const logos = load('lib/one-pager-logo.ts', { './provider-access': access, './logo-image': image }, { fetch() { throw new Error('Unexpected network call'); } });
  const route = load('app/generate-logo/route.ts', {
    '@/lib/provider-access': accessMock, '@/lib/logo-image': image, 'next/server': next, zod,
    openai: { OpenAI: class { images = { generate: async body => { operations.push('generate'); providerRequests.push(body); return { data: [{ b64_json: output }] }; } }; } },
  });
  const pdf = load('app/one-pager/route.tsx', {
    '@/lib/provider-access': accessMock, '@/lib/one-pager-logo': logos, 'next/server': next, zod,
    '@/lib/one-pager-pdf': { createOnePagerPdf: async input => { operations.push('render'); assert.equal(input.logoUrl, logo); assert.equal(input.email, 'owner@example.test'); return 'data:application/pdf;base64,JVBERi0xLjcK'; } },
  });
  return { route, pdf, queries, writes, operations, providerRequests };
}
test('JPEG parser accepts bounded image and rejects mislabeled, malformed, huge and oversized-dimension data', () => {
  assert.equal(image.jpegDataUrl(validJpeg), dataUrl);
  for (const value of ['', 'not a base64 image', Buffer.from('<svg onload="alert(1)"/>').toString('base64'), jpeg(4096, 4096), jpeg(0, 1), validJpeg.slice(0, -4), Buffer.alloc(image.MAX_LOGO_BYTES + 1).toString('base64')]) {
    assert.throws(() => image.jpegDataUrl(value));
  }
});
test('logo generation resolves owner name, reserves before provider, and persists JPEG before success', async () => {
  const h = harness({ logo: null });
  const response = await h.route.POST(request());
  assert.equal(response.status, 200); assert.equal((await response.json()).imageUrl, dataUrl);
  assert.deepEqual(h.operations, ['reserve', 'generate', 'persist']);
  assert.equal(h.providerRequests[0].model, 'gpt-image-2.5-flare');
  assert.equal(h.providerRequests[0].output_format, 'jpeg');
  assert.equal(h.providerRequests[0].n, 1); assert.ok(!('style' in h.providerRequests[0]));
  assert.equal(h.writes[0].value.created_by, 'owner'); assert.equal(h.writes[0].value.name_id, nameId);
  assert.equal(h.writes[0].value.logo_url, dataUrl);
  assert.ok(h.queries[0].filters.some(([key, value]) => key === 'created_by' && value === 'owner'));
});
test('replacing an expired saved logo updates its row instead of accumulating expired URLs', async () => {
  const h = harness({ saved: true });
  assert.equal((await h.route.POST(request())).status, 200);
  assert.equal(h.writes[0].mode, 'update');
});
test('foreign names and exhausted quota produce no generation or writes', async () => {
  for (const options of [{ owner: false }, { quota: true }]) {
    const h = harness(options);
    const response = await h.route.POST(request());
    assert.equal(response.status, options.owner === false ? 404 : 429);
    assert.equal(h.providerRequests.length, 0); assert.equal(h.writes.length, 0);
  }
});
test('invalid provider image and failed persistence never return a successful logo', async () => {
  for (const options of [{ output: Buffer.from('<svg/>').toString('base64') }, { dbError: true }]) {
    const h = harness(options);
    assert.equal((await h.route.POST(request())).status, 502);
    if (options.output) assert.equal(h.writes.length, 0);
  }
});
test('PDF retrieves owner logo internally; base64 never needs to fit in a URL or request body', async () => {
  const h = harness();
  const response = await h.pdf.POST(request({ nameId, content: 'Pitch.', logoUrl: 'https://evil.example/', userData: { email: 'forged@example.test' } }, 'one-pager'));
  assert.equal(response.status, 200);
  assert.deepEqual(h.operations, ['reserve', 'render', 'persist']);
  assert.equal(h.writes[0].value.pdf_url, 'data:application/pdf;base64,JVBERi0xLjcK');
  assert.equal(h.writes[0].value.created_by, 'owner');
  assert.ok(h.queries.filter(q => q.table === 'names' || q.table === 'logos').every(q => q.filters.some(([key,value]) => key === 'created_by' && value === 'owner')));
});
test('PDF rejects foreign names and malformed or non-raster data in directly editable logo rows', async () => {
  for (const options of [{ owner: false }, { logo: 'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64') }, { logo: image.JPEG_DATA_PREFIX + jpeg(4096,4096) }, { logo: image.JPEG_DATA_PREFIX + Buffer.from('<html/>').toString('base64') }]) {
    const h = harness(options);
    assert.equal((await h.pdf.POST(request({ nameId, content: 'Pitch.' }, 'one-pager'))).status, options.owner === false ? 404 : 400);
    assert.deepEqual(h.operations, options.owner === false ? [] : ['reserve']);
  }
});

test('PDF quota exhaustion and failed persistence never return a successful saved document', async () => {
  const exhausted = harness({ quota: true });
  assert.equal((await exhausted.pdf.POST(request({ nameId, content: 'Pitch.' }, 'one-pager'))).status, 429);
  assert.deepEqual(exhausted.operations, ['reserve']);
  assert.equal(exhausted.writes.length, 0);
  const failed = harness({ dbError: true });
  assert.equal((await failed.pdf.POST(request({ nameId, content: 'Pitch.' }, 'one-pager'))).status, 502);
  assert.deepEqual(failed.operations, ['reserve', 'render', 'persist']);
});
