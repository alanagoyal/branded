const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function load(file, mocks = {}, env = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, process: { env }, require(name) {
    if (name in mocks) return mocks[name];
    if (["react", "react/jsx-runtime"].includes(name)) return require(name);
    throw new Error(`Unexpected import: ${name}`);
  } });
  return exports;
}
const support = load("lib/support.ts");
const element = (tag) => ({ children, ...props }) => React.createElement(tag, props, children);
const box = element("div");

test("escalation preserves the transcript without calling a provider", () => {
  const draft = support.createSupportDraft([
    { role: "user", content: "Can't sign in" },
    { role: "assistant", content: "Try a reset" },
    { role: "assistant", tool_calls: [{}], content: "internal tool call" },
    { role: "assistant", content: null },
  ]);
  assert.match(draft.description, /user: Can't sign in/);
  assert.match(draft.description, /assistant: Try a reset/);
  assert.doesNotMatch(draft.description, /internal tool call/);
  assert.equal(support.createSupportDraft([]).description, "");
});

test("email draft encodes text and prevents subject header injection", () => {
  const href = new URL(support.supportMailto("help\r\nBcc: stranger", "a&b\n+é?"));
  assert.equal(href.pathname, "hi@basecase.vc");
  assert.equal(href.searchParams.get("subject"), "help Bcc: stranger");
  assert.equal(href.searchParams.get("body"), "a&b\n+é?");
  assert.equal(href.searchParams.has("bcc"), false);
});

function renderMessage(message, user = null) {
  const { Message } = load("components/message.tsx", {
    "@markprompt/core": { isToolCalls: () => false },
    "@markprompt/react": { useChatStore: (selector) => selector({ toolCallsByToolCallId: {}, submitToolCalls() {} }) },
    "remark-gfm": {}, "remark-math": {},
    "@/components/codeblock": { CodeBlock: box },
    "@/components/message-actions": { MessageActions: box },
    "@/lib/utils": { cn: () => "" },
    "@/lib/support": support,
    "./icons": { Icons: { logo: box } },
    "./tool-calls-confirmation": { ToolCallsConfirmation: box },
    "./markdown": { MemoizedReactMarkdown: ({ children }) => React.createElement("p", {}, children) },
    "./ui/avatar": { Avatar: box, AvatarFallback: box },
  });
  return renderToStaticMarkup(React.createElement(Message, { user, message, isLoading: false, chatOptions: {} }));
}

test("logged-out users can render their chat messages", () => {
  assert.match(renderMessage({ role: "user", content: "hello", state: "done" }), /hello/);
});

test("SDK cancelled state with a real failure shows error details and email fallback", () => {
  const html = renderMessage({ role: "assistant", state: "cancelled", error: new Error("Quota exceeded") });
  assert.match(html, /could not reply/);
  assert.match(html, /Quota exceeded/);
  assert.match(html, /mailto:hi@basecase.vc/);
  assert.doesNotMatch(html, /was cancelled/);
});

test("actual aborts and stopped messages do not claim a service error", () => {
  for (const error of [undefined, { name: "AbortError", message: "aborted" }]) {
    const html = renderMessage({ role: "assistant", state: "cancelled", error });
    assert.match(html, /Response stopped/);
    assert.doesNotMatch(html, /could not reply/);
  }
});

test("unknown provider errors still have a visible explanation", () => {
  assert.equal(support.chatFailure({ code: 503 }), "The support service returned an error.");
  assert.equal(support.chatFailure("Unauthorized"), "Unauthorized");
});

test("email form gives real address and requires the user to send, with no fake submission", () => {
  const { CaseForm } = load("components/case-form.tsx", {
    "@/components/ui/button": { Button: ({ children }) => children },
    "@/components/ui/card": Object.fromEntries(["Card", "CardContent", "CardFooter", "CardHeader", "CardTitle"].map((key) => [key, box])),
    "@/components/ui/input": { Input: element("input") },
    "@/components/ui/label": { Label: element("label") },
    "@/components/ui/textarea": { Textarea: element("textarea") },
    "@/lib/support": support,
  });
  const html = renderToStaticMarkup(React.createElement(CaseForm, { subject: "Test", description: "My issue" }));
  assert.match(html, /nothing is submitted here/);
  assert.match(html, /Open email draft/);
  assert.match(html, /subject=Test&amp;body=My%20issue/);
  assert.doesNotMatch(html, /acme|globex|Case has been submitted/i);
});

function caseChat({ projectKey, fail = false } = {}) {
  const busy = [];
  const states = [];
  const { CaseChat } = load("components/case-chat.tsx", {
    react: { useCallback: (fn) => fn, useState: (initial) => [initial, (value) => states.push(value)] },
    "@markprompt/react": { ChatProvider: box },
    "@/components/case-form": { CaseForm: () => React.createElement("p", {}, "Email draft available") },
    "@/components/chat": { Chat: box },
    "@/lib/support": { ...support, createSupportDraft: (messages) => {
      if (fail) throw new Error("Could not prepare draft");
      return support.createSupportDraft(messages);
    } },
    "./chat-form-context": { useChatForm: () => ({ setIsCreatingCase: (value) => busy.push(value) }) },
    "./ui/button": { Button: box },
  }, { NEXT_PUBLIC_PROJECT_KEY: projectKey });
  return { tree: CaseChat({ user: null }), busy, states };
}

test("support remains available when no chat key is configured", () => {
  const html = renderToStaticMarkup(caseChat().tree);
  assert.match(html, /Chat is unavailable/);
  assert.match(html, /Email draft available/);
});

for (const fail of [false, true]) {
  test(`tool waits for draft result and clears busy state (${fail ? "failure" : "success"})`, async () => {
    // During render the fallback draft must be available; inject failure only
    // when the tool callback runs by changing the shared helper afterwards.
    let shouldFail = false;
    const original = support.createSupportDraft;
    support.createSupportDraft = (...args) => {
      if (shouldFail) throw new Error("Draft failed");
      return original(...args);
    };
    try {
      const { tree, busy } = caseChat({ projectKey: "test" });
      shouldFail = fail;
      const result = await tree.props.children[0].props.chatOptions.tools[0].call();
      assert.deepEqual(busy, [true, false]);
      assert.match(result, fail ? /Could not prepare/ : /draft is ready/);
    } finally {
      support.createSupportDraft = original;
    }
  });
}
