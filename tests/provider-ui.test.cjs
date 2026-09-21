const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

function load(file, mocks = {}, globals = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, Error, console, window: { open() {} }, ...globals, require(name) {
    if (name in mocks) return mocks[name];
    if (["react", "react/jsx-runtime"].includes(name)) return require(name);
    throw new Error(`Unexpected import: ${name}`);
  } });
  return exports;
}
const responses = load("lib/provider-response.ts");

for (const [status, message] of [[401, "Sign in to continue."], [429, "You've reached the monthly limit for this feature."], [429, "Too many requests. Please wait a minute."]]) {
  test(`server ${status} feedback and status survive parsing: ${message}`, async () => {
    await assert.rejects(responses.readProviderResponse(Response.json({ error: message }, { status })), error => error.status === status && error.message === message);
  });
}
test("successful provider response remains unchanged", async () => {
  const result = await responses.readProviderResponse(Response.json({ imageUrl: "https://example.com/logo.png" }));
  assert.equal(result.imageUrl, "https://example.com/logo.png");
});
test("non-JSON authentication failure still asks for sign-in", async () => {
  await assert.rejects(responses.readProviderResponse(new Response("Unauthorized", { status: 401 })), /Sign in/);
});

function harness({ cached = true, status = 429 } = {}) {
  let cursor = 0, fetches = 0;
  const state = [], queries = [], errors = [];
  const identity = (tag) => ({ children, ...props }) => React.createElement(tag, props, children);
  const box = identity("div");
  const supabase = { from(table) {
    const query = { table };
    const builder = {
      select(columns, options) { query.count = options?.count; return this; },
      eq() { return this; }, in() { return this; }, ilike() { return this; },
      gte() { throw new Error("Saved-record quota must not block provider actions"); },
      then(resolve, reject) {
        queries.push(query);
        let data = [];
        if (cached) {
          if (table === "names") data = [{ id: "saved-id" }];
          if (table === "logos") data = [{ logo_url: "https://example.com/logo.png" }];
          if (table === "domains") data = [{ domain_name: "orbit.com", purchase_link: "https://orbit.com" }];
          if (table === "npm_names") data = [{ npm_name: "npm i orbit", purchase_link: "https://npmjs.com/orbit" }];
          if (table === "trademarks") data = [{ keyword: "Orbit", description: "record", link: "https://example.com/trademark" }];
          if (table === "one_pagers") data = [{ pdf_url: "https://example.com/one.pdf" }];
        }
        return Promise.resolve({ data, error: null, count: 100000 }).then(resolve, reject);
      },
    };
    return builder;
  } };
  const { NamesDisplay } = load("components/names-display.tsx", {
    react: { ...React, useEffect() {}, useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    } },
    "@/utils/supabase/client": { createClient: () => supabase },
    "@/lib/provider-response": responses,
    "./provider-error": { showProviderError: (error) => errors.push(error) },
    "./icons": { Icons: new Proxy({}, { get: () => box }) },
    "./ui/button": { Button: identity("button") },
    "./ui/use-toast": { toast() {} },
    "next/link": identity("a"), "next/image": identity("img"),
    "./ui/card": Object.fromEntries(["Card", "CardContent", "CardHeader", "CardTitle"].map((name) => [name, box])),
    "./ui/carousel": Object.fromEntries(["Carousel", "CarouselContent", "CarouselItem", "CarouselNext", "CarouselPrevious"].map((name) => [name, box])),
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "./ui/toast": { ToastAction: box },
  }, { fetch: async () => { fetches++; return Response.json({ error: status === 401 ? "Sign in to continue." : "You've reached the monthly limit for this feature." }, { status }); } });
  function expand(node) {
    if (Array.isArray(node)) return node.flatMap(expand);
    if (!node || typeof node !== "object") return [];
    if (typeof node.type === "function") return expand(node.type(node.props));
    return [node, ...expand(node.props?.children)];
  }
  function render() {
    cursor = 0;
    return expand(NamesDisplay({ namesList: { Orbit: "saved-id" }, showRemoveButton: false, user: { id: "owner" }, verticalLayout: true }));
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join("");
    if (node && typeof node === "object") return text(node.props?.children);
    return node == null ? "" : String(node);
  }
  function button(label) { return render().find((node) => node.type === "button" && text(node) === label); }
  return { render, button, queries, errors, fetches: () => fetches };
}

for (const label of ["Check domain availability", "Check npm availability", "Check for trademarks", "Generate a logo", "Generate a one-pager"]) {
  test(`${label} serves saved assets without provider requests or client quota checks`, async () => {
    const ui = harness();
    await ui.button(label).props.onClick();
    assert.equal(ui.fetches(), 0);
    assert.equal(ui.errors.length, 0);
    assert.ok(!ui.queries.some(query => query.count));
  });
}
for (const status of [401, 429]) {
  test(`uncached logo surfaces server ${status} and clears loading state`, async () => {
    const ui = harness({ cached: false, status });
    await ui.button("Generate a logo").props.onClick();
    assert.equal(ui.fetches(), 1);
    assert.equal(ui.errors[0].status, status);
    assert.equal(ui.button("Generate a logo").props.disabled, false);
  });
}

for (const status of [401, 429]) {
  test(`name generation asks server without saved-row gate and shows ${status}`, async () => {
    const box = () => null;
    const ui = new Proxy({}, { get: () => box });
    const errors = [], loading = [], calls = [];
    const values = { description: "Database for apps", minLength: 5, maxLength: 10 };
    const mocks = {
      react: { useEffect() {}, useMemo: (fn) => fn(), useRef: (current) => ({ current }), useState: (initial) => [initial, (value) => loading.push(value)] },
      zod: require("zod"),
      "@hookform/resolvers/zod": { zodResolver() {} },
      "react-hook-form": { useForm: () => ({ handleSubmit: (fn) => fn, watch: () => "any", getValues: () => values }) },
      uuid: { v4: () => "session" },
      "@/utils/supabase/client": { createClient: () => ({ from() { throw new Error("Should not query saved records before asking the server"); } }) },
      "@/lib/provider-response": responses,
      "./provider-error": { showProviderError: (error) => errors.push(error) },
      "next/navigation": { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
      "./ui/use-toast": { toast() {} },
      "./icons": { Icons: ui },
    };
    for (const name of ["@/components/ui/button", "@/components/ui/form", "./ui/textarea", "./ui/input", "./ui/select", "./ui/slider", "./share", "./names-display", "./ui/switch"]) mocks[name] = ui;
    const { NameGenerator } = load("components/name-generator.tsx", mocks, {
      fetch: async (url) => { calls.push(url); return Response.json({ error: status === 401 ? "Sign in to continue." : "You've reached the monthly limit for this feature." }, { status }); },
    });
    function findForm(node) {
      if (Array.isArray(node)) return node.map(findForm).find(Boolean);
      if (!node || typeof node !== "object") return null;
      return node.type === "form" ? node : findForm(node.props?.children);
    }
    const form = findForm(NameGenerator({ user: { id: "owner" }, names: null }));
    await form.props.onSubmit(values);
    assert.deepEqual(calls, ["/generate-names"]);
    assert.equal(errors[0].status, status);
    assert.equal(loading.at(-1), false);
  });
}
