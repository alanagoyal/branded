const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

function load(file, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, console, window: { open() {} }, require(name) {
    if (name in mocks) return mocks[name];
    if (["react", "react/jsx-runtime"].includes(name)) return require(name);
    throw new Error(`Unexpected import: ${name}`);
  } });
  return exports;
}
const records = load("lib/name-records.ts");
const duplicates = [{ id: "first", name: "Orbit" }, { id: "second", name: "Orbit" }];
const plain = (value) => JSON.parse(JSON.stringify(value));

test("loading and merging duplicate names preserves distinct IDs and deduplicates only identical records", () => {
  const result = records.mergeNameRecords(duplicates, [duplicates[0]]);
  assert.deepEqual(plain(result), duplicates);
  assert.deepEqual(plain(records.removeNameRecord(result, "first")), [duplicates[1]]);
  assert.deepEqual(plain(records.removeNameRecord(result, "first").map(({ id }) => id)), ["second"]);
});

function harness({ verticalLayout = true } = {}) {
  let cursor = 0;
  const state = [];
  const queries = [];
  const removed = [];
  const identity = (tag) => ({ children, ...props }) => React.createElement(tag, props, children);
  const box = identity("div");
  const supabase = { from(table) {
    const query = { table, filters: [], update: null, columns: null };
    const builder = {
      select(columns, options) { query.columns = columns; query.count = options?.count; return this; },
      eq(column, value) { query.filters.push([column, value]); return this; },
      in(column, value) { query.filters.push([column, value]); return this; },
      gte() { return this; },
      update(value) { query.update = value; return this; },
      then(resolve, reject) {
        queries.push(query);
        const id = query.filters.find(([column]) => column === "name_id")?.[1];
        let data = [];
        if (table === "logos") data = [{ logo_url: `https://example.com/${id}.png` }];
        if (table === "domains") data = [{ domain_name: `${id}.com`, purchase_link: `https://${id}.com` }];
        if (table === "npm_names") data = [{ npm_name: `npm i ${id}`, purchase_link: `https://npmjs.com/${id}` }];
        if (table === "trademarks") data = [{ keyword: id, description: "record", link: `https://example.com/${id}` }];
        if (table === "one_pagers") data = [{ pdf_url: `https://example.com/${id}.pdf` }];
        return Promise.resolve({ data, error: null, count: 0 }).then(resolve, reject);
      },
    };
    return builder;
  } };
  const mocks = {
    react: { ...React, useEffect() {}, useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = index === 11 ? ["first", "second"] : initial;
      return [state[index], (value) => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    } },
    "@/utils/supabase/client": { createClient: () => supabase },
    "@/lib/provider-response": load("lib/provider-response.ts"),
    "./provider-error": { showProviderError(error) { throw error; } },
    "./icons": { Icons: new Proxy({}, { get: () => box }) },
    "./ui/button": { Button: identity("button") },
    "./ui/use-toast": { toast() {} },
    "next/link": identity("a"), "next/image": identity("img"),
    "./ui/card": Object.fromEntries(["Card", "CardContent", "CardHeader", "CardTitle"].map((name) => [name, box])),
    "./ui/carousel": Object.fromEntries(["Carousel", "CarouselContent", "CarouselItem", "CarouselNext", "CarouselPrevious"].map((name) => [name, box])),
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "./ui/toast": { ToastAction: box },
    "@/lib/plans": { FreePlanEntitlements: {}, ProPlanEntitlements: {}, BusinessPlanEntitlements: {} },
  };
  const { NamesDisplay } = load("components/names-display.tsx", mocks);
  function expand(node) {
    if (Array.isArray(node)) return node.flatMap(expand);
    if (!node || typeof node !== "object") return [];
    if (typeof node.type === "function") return expand(node.type(node.props));
    return [node, ...expand(node.props?.children)];
  }
  function render() {
    cursor = 0;
    return expand(NamesDisplay({ namesList: duplicates, showRemoveButton: true, onRemoveName: (id) => removed.push(id), user: { id: "owner" }, verticalLayout }));
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join("");
    if (node && typeof node === "object") return text(node.props?.children);
    return node == null ? "" : String(node);
  }
  function buttons(label) { return render().filter((node) => node.type === "button" && text(node) === label); }
  return { render, buttons, queries, removed };
}

for (const verticalLayout of [true, false]) {
  test(`duplicate name cards render independently (${verticalLayout ? "list" : "carousel"})`, () => {
    const ui = harness({ verticalLayout });
    assert.equal(ui.buttons("Generate a logo").length, 2);
    assert.equal(ui.buttons("Add to favorites").length, 2);
  });
}

test("remove and favorite actions target the selected record ID", async () => {
  const ui = harness();
  ui.buttons("X")[1].props.onClick();
  assert.deepEqual(ui.removed, ["second"]);
  await ui.buttons("Add to favorites")[1].props.onClick();
  const update = ui.queries.find((query) => query.update);
  assert.deepEqual(plain(update.filters), [["id", "second"]]);
  assert.equal(ui.buttons("Add to favorites").length, 1);
  assert.equal(ui.buttons("Remove from favorites").length, 1);
});

for (const [label, table] of [
  ["Check domain availability", "domains"], ["Check npm availability", "npm_names"],
  ["Check for trademarks", "trademarks"], ["Generate a logo", "logos"],
  ["Generate a one-pager", "one_pagers"],
]) {
  test(`${label} reads the clicked duplicate record's saved assets`, async () => {
    const ui = harness();
    await ui.buttons(label)[1].props.onClick();
    const query = ui.queries.find((entry) => entry.table === table && !entry.count);
    assert.deepEqual(plain(query.filters), [["name_id", "second"]]);
    assert.ok(!ui.queries.some((entry) => entry.filters.some(([column]) => column === "name")));
    if (table === "logos") {
      const images = ui.render().filter((node) => node.type === "img");
      assert.equal(images.length, 1);
      assert.equal(images[0].props.src, "https://example.com/second.png");
      await ui.buttons(label)[0].props.onClick();
      assert.deepEqual(ui.render().filter((node) => node.type === "img").map((node) => node.props.src), ["https://example.com/first.png", "https://example.com/second.png"]);
    }
  });
}
