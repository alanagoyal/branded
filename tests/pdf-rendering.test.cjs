const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, process, Buffer, Uint8Array, atob, btoa, Blob, require: name => name in mocks ? mocks[name] : require(name), ...globals });
  return exports;
}
const downloads = load('lib/pdf-download.ts');
const samplePdf = downloads.PDF_DATA_PREFIX + Buffer.from('%PDF-1.7\nsynthetic fixture\n%%EOF').toString('base64');
test('PDF download accepts bounded PDF bytes and rejects arbitrary URLs, mislabeled data and oversized rows', () => {
  assert.equal(Buffer.from(downloads.pdfBytes(samplePdf)).subarray(0,5).toString(), '%PDF-');
  for (const value of ['https://vendor.example/expired.pdf', 'javascript:alert(1)', 'data:text/html;base64,PGh0bWw+', downloads.PDF_DATA_PREFIX + Buffer.from('<html/>').toString('base64'), downloads.PDF_DATA_PREFIX + 'A'.repeat(4 * Math.ceil(downloads.MAX_PDF_BYTES / 3) + 4)]) assert.throws(() => downloads.pdfBytes(value));
});
test('download uses a PDF Blob and temporary object URL, with filename and cleanup', () => {
  const calls = []; const link = { click() { calls.push('click'); }, remove() { calls.push('remove'); } };
  const helper = load('lib/pdf-download.ts', {}, {
    URL: { createObjectURL(blob) { assert.equal(blob.type, 'application/pdf'); calls.push('blob'); return 'blob:local'; }, revokeObjectURL(url) { assert.equal(url, 'blob:local'); calls.push('revoke'); } },
    document: { createElement(type) { assert.equal(type, 'a'); return link; }, body: { appendChild() { calls.push('append'); } } },
    setTimeout(fn) { fn(); },
  });
  helper.downloadPdf(samplePdf, 'Café / Orbit');
  assert.equal(link.href, 'blob:local'); assert.equal(link.download, 'Café  Orbit-one-pager.pdf');
  assert.deepEqual(calls, ['blob','append','click','remove','revoke']);
});
test('real local renderer produces bounded readable-font PDFs and paginates long content offline', async () => {
  const renderer = await import('@react-pdf/renderer');
  const { createOnePagerPdf } = load('lib/one-pager-pdf.tsx', { '@react-pdf/renderer': renderer, './pdf-download': downloads });
  const base = { name: 'Café Orbit — Έλαν', founder: 'Zoë García', email: 'team@example.invalid', logoUrl: null };
  const originalFetch = global.fetch;
  global.fetch = (url, options) => {
    // Yoga loads its bundled WASM from a data URL; this is not a network request.
    if (String(url).startsWith('data:')) return originalFetch(url, options);
    throw new Error('Local PDF rendering must not access the network');
  };
  try {
  for (const content of ['A concise pitch with smart “quotes”, accents, Greek Αθήνα and Cyrillic Орбита.', 'A clear pitch for a thoughtful company. '.repeat(190)]) {
    const data = await createOnePagerPdf({ ...base, content });
    const bytes = Buffer.from(downloads.pdfBytes(data));
    assert.ok(bytes.length < downloads.MAX_PDF_BYTES);
    assert.match(bytes.toString('latin1'), /NotoSans/);
    const pages = (bytes.toString('latin1').match(/\/Type \/Page\b/g) || []).length;
    assert.ok(content.length > 1000 ? pages > 1 : pages === 1);
  }
  } finally { global.fetch = originalFetch; }
});
