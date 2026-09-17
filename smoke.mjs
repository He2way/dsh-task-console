// Smoke test for the dsh-task-console client bundle.
// Loads lib/client.js in a stubbed browser-ish environment and renderToString()s
// the overlay root + back panel with fixture session state.
// Run: npm test   (needs `npm i` once for react/react-dom devDependencies)
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const BUNDLE = join(HERE, "lib", "client.js");

// resolve react from this package's node_modules, else the DSH harness checkout
const local = join(HERE, "node_modules");
const requireFrom = existsSync(local) ? local : "C:\\Users\\82161\\AppData\\Local\\npm-cache\\_npx\\1e7f6d9597241db0\\node_modules";
const requireAt = createRequire(join(requireFrom, "x.js"));
const React = requireAt("react");
const { jsx, jsxs, Fragment } = requireAt("react/jsx-runtime");
const { renderToString } = requireAt("react-dom/server");

// ---- stubbed browser globals ----
const styleTags = [];
globalThis.document = {
  head: { appendChild: (el) => styleTags.push(el) },
  createElement: () => ({ dataset: {}, textContent: "" }),
  querySelector: () => null,
  body: { hasAttribute: () => false, nodeType: 1 }, // nodeType satisfies createPortal's container check
};
globalThis.window = { innerWidth: 1600 };
globalThis.localStorage = undefined; // exercise the "no storage" path
globalThis.MutationObserver = class { observe() {} disconnect() {} };

let capturedFactory = null;
globalThis.window.__ModuleLoader__ = {
  load(entry) {
    if (entry && typeof entry.factory === "function") capturedFactory = entry.factory;
  },
};

// ---- execute the bundle ----
(0, eval)(readFileSync(BUNDLE, "utf8"));
const localRequire = (spec) => {
  if (spec === "react/jsx-runtime") return { jsx, jsxs, Fragment };
  if (spec === "react") return React;
  // SSR has no real DOM: a portal falls back to rendering its children inline.
  if (spec === "react-dom") return { createPortal: (children) => children };
  throw new Error("unexpected require: " + spec);
};
const moduleExports = capturedFactory(localRequire);
const tc = moduleExports.__dshTestHooks;
if (!tc || typeof tc.TaskConsoleRoot !== "function") throw new Error("test hooks missing from bundle exports");

// ---- fixture session state ----
const NOW = Date.now();
const STATE = {
  current: "s1",
  byId: {
    s1: {
      id: "s1",
      displayTitle: "测试会话 · 重构文档",
      running: true,
      cwd: "D:\\projects\\demo",
      updatedAt: NOW - 4200,
      origin: "root",
    },
  },
  jobsBySession: {
    s1: [
      { id: "j1", kind: "pwsh", label: "运行测试套件", status: "running", startedAt: NOW - 65000, detail: "42/50" },
      { id: "j2", kind: "node", label: "构建前端产物", status: "completed", startedAt: NOW - 300000, finishedAt: NOW - 120000 },
      { id: "j3", kind: "pwsh", label: "同步文件", status: "failed", startedAt: NOW - 900000, finishedAt: NOW - 880000, detail: "权限不足" },
    ],
  },
  subagentsByParent: {
    s1: {
      entries: [
        { id: "agent-aaaa1111", kind: "child", label: "研究助手", activity: "running" },
        { id: "agent-bbbb2222", kind: "fork", label: "代码审查", activity: "idle" },
      ],
      state: "ready",
      parentAvailable: true,
      error: null,
    },
  },
  phase: "ready",
};
const useSessions = (selector) => selector(STATE);

let failed = 0;
const check = (name, ok) => {
  console.log((ok ? "PASS " : "FAIL ") + name);
  if (!ok) failed++;
};

// ---- root occupant, closed state ----
const rootHtml = renderToString(jsx(tc.TaskConsoleRoot, { useSessions }));
check("toggle rendered when closed", rootHtml.includes("任务台") && !rootHtml.includes("dsh-tc-panel"));

// ---- back panel with live fixture data ----
const panelHtml = renderToString(jsx(tc.TaskBackPanel, { useSessions, onClose: () => {} }));
for (const [name, needle] of [
  ["board title", "任务控制台"],
  ["session card", "会话概览"],
  ["jobs card", "后台任务"],
  ["subagents card", "子代理"],
  ["workspace card", "工作区"],
  ["plugins card", "插件管理"],
  ["plugins unavailable fallback", "插件管理服务不可用"],
  ["session title", "测试会话 · 重构文档"],
  ["cwd path", "D:\\projects\\demo"],
  ["live job row", "运行测试套件"],
  ["failed job status", "权限不足"],
  ["job duration ticks", "分"],
  ["subagent row", "研究助手"],
  ["reset button", "复位卡片"],
  ["new card button", "新建卡片"],
  ["back button", "返回会话"],
]) check("panel: " + name, panelHtml.includes(needle));

// ---- empty-state path ----
const emptyHtml = renderToString(
  jsx(tc.TaskBackPanel, {
    useSessions: (s) => s({ ...STATE, current: undefined, byId: {}, jobsBySession: {}, subagentsByParent: {}, phase: "loading" }),
    onClose: () => {},
  })
);
check(
  "empty state",
  emptyHtml.includes("未选择会话") && emptyHtml.includes("当前会话暂无后台任务") && emptyHtml.includes("当前会话暂无子代理")
);

// ---- helpers ----
check("duration formatting", tc.fmtTaskDuration(90000) === "1分30秒" && tc.fmtTaskDuration(3600_000) === "1小时0分");
check("dot states", tc.taskJobDot("running") === "ongoing" && tc.taskJobDot("killed") === "warn" && tc.taskJobDot("failed") === "error");
check("style injected", styleTags.length > 0 && styleTags[0].textContent.includes("dsh-tc-panel"));
check(
  "interaction perf rules injected",
  styleTags[0].textContent.includes(".dsh-tc-cardBusy{transition:none!important;will-change:transform;backdrop-filter:none!important") &&
    styleTags[0].textContent.includes(".dsh-tc-card{contain:layout style}") &&
    styleTags[0].textContent.includes(".dsh-tc-interacting .dsh-tc-panel::after{animation-play-state:paused}") &&
    styleTags[0].textContent.includes(".dsh-tc-panel{contain:paint}") &&
    !styleTags[0].textContent.includes("dsh-tc-lite") &&
    !styleTags[0].textContent.includes("body.dsh-tc-interacting .dsh-tc-card{")
);

// ---- card chrome honors declarative style ----
const styledCardHtml = renderToString(
  jsx(tc.TaskCard, {
    id: "u1",
    title: "看板",
    layout: { x: 10, y: 10, collapsed: false, hidden: false, pinned: false, style: { width: "wide", accent: "blue", density: "cozy", icon: "📊" } },
    dragging: false,
    zIndex: 1,
    boardRef: { current: null },
    actions: [],
    onDragStart: () => {},
    onDragMove: () => {},
    onDragEnd: () => {},
    children: null,
  })
);
check(
  "card chrome applies declarative style",
  styledCardHtml.includes('data-width="wide"') &&
    styledCardHtml.includes('data-acc="1"') &&
    styledCardHtml.includes("📊") &&
    styledCardHtml.includes("--dsh-tc-acc:#3b82f6")
);

// ---- mouse-resizable cards ----
const cardProps = (layout) => ({
  id: "u2",
  title: "尺寸卡片",
  layout,
  dragging: false,
  zIndex: 1,
  boardRef: { current: null },
  actions: [],
  onDragStart: () => {},
  onDragCommit: () => {},
  onDragEnd: () => {},
  onResizeStart: () => {},
  onResizeCommit: () => {},
  onResizeEnd: () => {},
  children: null,
});
const sizedCardHtml = renderToString(jsx(tc.TaskCard, cardProps({ x: 10, y: 10, collapsed: false, hidden: false, pinned: false, w: 420, h: 300 })));
check(
  "sized card carries width/height and the resize handle",
  sizedCardHtml.includes('data-sized="true"') &&
    sizedCardHtml.includes("width:420px") &&
    sizedCardHtml.includes("height:300px") &&
    sizedCardHtml.includes("dsh-tc-cardResize")
);
const sizedWithPresetHtml = renderToString(
  jsx(tc.TaskCard, cardProps({ x: 10, y: 10, collapsed: false, hidden: false, pinned: false, w: 500, style: { width: "wide" } }))
);
check("manual size suppresses the width preset attribute", !sizedWithPresetHtml.includes('data-width="wide"') && sizedWithPresetHtml.includes("width:500px"));
const collapsedCardHtml = renderToString(jsx(tc.TaskCard, cardProps({ x: 10, y: 10, collapsed: true, hidden: false, pinned: false, w: 420, h: 300 })));
check("collapsed card hides the resize handle", !collapsedCardHtml.includes("dsh-tc-cardResize"));

// ---- declarative control blocks render ----
const userCardHtml = renderToString(
  jsx(tc.TaskUserBody, {
    card: {
      title: "示例",
      blocks: [
        { kind: "heading", text: "进度看板" },
        { kind: "text", text: "第一行" },
        { kind: "checklist", key: "todo", items: [{ id: "a", label: "跑测试" }] },
        { kind: "counter", key: "cnt", label: "轮次", step: 1 },
        { kind: "stats", items: [{ label: "通过", value: "9" }] },
        { kind: "progress", label: "完成", value: 2, max: 3 },
        { kind: "kv", rows: [["分支", "main"]] },
        { kind: "links", items: [{ label: "DSH", url: "https://github.com/deepseek-ai/deepseek-harness" }] },
        { kind: "chips", items: ["进行中"] },
        { kind: "button", action: "copy", label: "复制", value: "v" },
        { kind: "trend", label: "近 7 日", unit: "次", values: [3, 5, 2, 8, 6] },
        { kind: "table", columns: ["阶段", "状态"], rows: [["构建", "通过"]] },
        { kind: "code", language: "bash", text: "npm test" },
        { kind: "toggle", key: "auto", label: "自动刷新", value: true },
        { kind: "countdown", label: "距离发布", until: Date.now() + 3600_000 },
        { kind: "bars", label: "占用", items: [{ label: "CPU", value: 42 }, { label: "内存", value: 68 }] },
        { kind: "unknown", requested: "weird", raw: { note: "kept" } },
      ],
    },
    onWidget: () => {},
  })
);
check(
  "user card control blocks render",
  userCardHtml.includes("进度看板") &&
    userCardHtml.includes("第一行") &&
    userCardHtml.includes("跑测试") &&
    userCardHtml.includes("轮次") &&
    userCardHtml.includes("通过") &&
    userCardHtml.includes("分支") &&
    userCardHtml.includes("DSH") &&
    userCardHtml.includes("进行中") &&
    userCardHtml.includes("复制") &&
    userCardHtml.includes("近 7 日") &&
    userCardHtml.includes("dsh-tc-trendSvg") &&
    userCardHtml.includes("dsh-tc-table") &&
    userCardHtml.includes("构建") &&
    userCardHtml.includes("npm test") &&
    userCardHtml.includes("自动刷新") &&
    userCardHtml.includes("dsh-tc-switch") &&
    userCardHtml.includes("距离发布") &&
    userCardHtml.includes("dsh-tc-countdownValue") &&
    userCardHtml.includes("dsh-tc-barFill") &&
    userCardHtml.includes("未支持的控件") &&
    userCardHtml.includes("dsh-tc-check")
);
check(
  "unsupported control keeps its raw payload",
  userCardHtml.includes("weird") && userCardHtml.includes("dsh-tc-wRaw") && userCardHtml.includes("kept")
);
const countdownDoneHtml = renderToString(
  jsx(tc.TaskBlockView, {
    block: { kind: "countdown", label: "已过期", until: Date.now() - 1000, done: "已发布" },
    scope: "c",
    value: {},
    onWidget: () => {},
    onRun: () => {},
    feedbackText: null,
  })
);
check("countdown shows done text after deadline", countdownDoneHtml.includes("已发布"));

// ---- card chat popup renders ----
const chatHtml = renderToString(
  jsx(tc.TaskCardChat, { card: { id: "usr-demo", title: "示例卡", blocks: [] }, onClose: () => {} })
);
check(
  "card chat popup renders",
  chatHtml.includes("对话重构") && chatHtml.includes("示例卡") && chatHtml.includes("发送")
);

// ---- chat-row kinds that may carry a [taskcard] block ----
check(
  "chat row kinds: user + settled assistant-step, never the turn-process row",
  tc.isTaskChatTextKind("user") === true &&
    tc.isTaskChatTextKind("assistant-step") === true &&
    tc.isTaskChatTextKind("assistant") === true &&
    tc.isTaskChatTextKind("turn-process") === false &&
    tc.isTaskChatTextKind("tool-call") === false &&
    tc.isTaskChatTextKind(null) === false
);

// ---- agent reply extraction (temporary-agent refactor pipeline) ----
check(
  "assistant text extraction joins text blocks",
  tc.assistantTextOfBlocks([{ type: "text", text: "A" }, { type: "reasoning", text: "x" }, { type: "text", text: "B" }]) === "A\nB"
);
check(
  "live chunk text extraction",
  tc.assistantTextOfChunk({ type: "text-delta", text: "x" }) === "x" &&
    tc.assistantTextOfChunk({ type: "finish" }) === "" &&
    tc.assistantTextOfChunk(null) === ""
);
const eventSourceOf = (entries) => ({ getSnapshot: () => ({ entries }) });
const durableEntry = (seq, text) => ({ type: "event", event: { type: "assistant/message", seq, data: { message: { content: [{ type: "text", text }] } } } });
const liveEntry = (seq, text, index = 0) => ({ type: "transient", event: { type: "assistant/live-chunk", seq, data: { chunk: { type: "text-delta", index, text } } } });
const liveEndEntry = (seq, text, index = 0) => ({ type: "transient", event: { type: "assistant/live-chunk", seq, data: { chunk: { type: "block-end", index, block: { type: "text", text } } } } });
const turnEndEntry = (seq) => ({ type: "event", event: { type: "turn/end", seq, data: { turn: 1, reason: { kind: "completed" } } } });
const turnStartEntry = (seq) => ({ type: "event", event: { type: "turn/start", seq, data: { turn: 1 } } });
const inboxEntry = (seq, target, count) => ({ type: "event", event: { type: "agent/inbox/spliced", seq, data: { target, start: 0, inserted: Array.from({ length: count }, (_, index) => ({ id: "m" + String(index) })) } } });
const userEntry = (seq, text) => ({ type: "event", event: { type: "user/message", seq, data: { role: "user", content: [{ type: "text", text }] } } });
const inheritedEvents = [durableEntry(3, "inherited reply"), { type: "event", event: { type: "user/message", seq: 4, data: { content: [] } } }];
check(
  "event window reader respects the fork baseline",
  tc.latestTaskEventSeq(eventSourceOf(inheritedEvents)) === 4 &&
    tc.latestTaskAssistantText(eventSourceOf(inheritedEvents), 4) === "" &&
    tc.latestTaskAssistantText(eventSourceOf(inheritedEvents), 3) === "" &&
    tc.latestTaskAssistantText(eventSourceOf(inheritedEvents), 2) === "inherited reply" &&
    tc.latestTaskAssistantText(eventSourceOf([]), -1) === ""
);
check(
  "event window reader prefers the longer durable reply",
  tc.latestTaskAssistantText(eventSourceOf([...inheritedEvents, liveEntry(6, "[taskcard] {"), durableEntry(9, '[taskcard] { "title": "T" } [/taskcard]')]), 4).includes('"title": "T"')
);
check(
  "event window reader streams live text before settlement",
  tc.latestTaskAssistantText(eventSourceOf([...inheritedEvents, liveEntry(6, "正在"), liveEntry(7, "重构…")]), 4) === "正在重构…"
);
check(
  "event window reader replaces a streamed block with its block-end text",
  tc.latestTaskAssistantText(eventSourceOf([...inheritedEvents, liveEntry(6, "partial"), liveEndEntry(7, "完整文本")]), 4) === "完整文本" &&
    tc.latestTaskAssistantText(eventSourceOf([liveEntry(1, "A", 0), liveEntry(2, "B", 1)]), -1) === "A\nB"
);

// ---- temporary-agent bridge: blank temporary session first (no fork) ----
const tempEntries = [];
const tempEvents = eventSourceOf(tempEntries);
const tempSession = {
  open: async () => { openedTemp = true; },
  getSnapshot: () => ({ running: true }),
  prompt: async (content) => {
    promptedText = content[0].text;
    tempEntries.push(userEntry(11, "【任务台卡片重构】卡片 id：usr-bridge"));
    tempEntries.push(durableEntry(12, '[taskcard] { "id": "usr-bridge", "title": "桥接卡", "blocks": [{ "kind": "heading", "text": "桥接" }] } [/taskcard]'));
    return { ok: true, value: { accepted: true } };
  },
};
let openedTemp = false;
let promptedText = "";
let archivedTemp = null;
let createdWith = null;
let forkAttempted = false;
const noTurnCtx = {
  get(name) {
    if (name === "sessions") {
      return {
        list: { getSnapshot: () => ({ current: "s1", byId: { s1: { cwd: "D:\\demo" } } }) },
        fork: async () => { forkAttempted = true; throw new Error("session/fork-unavailable: session has no completed turn to fork from"); },
        create: async (opts) => { createdWith = opts; return "session-temp-1"; },
        binding: (id) => (id === "session-temp-1" ? { sessionId: id, eventSource: tempEvents, session: tempSession } : undefined),
      };
    }
    // A registered workspace owning the source cwd is the create target.
    if (name === "workspaces") return {
      list: { getSnapshot: () => ({ items: [{ id: "ws-demo", path: "D:\\demo" }] }) },
      archiveSession: async (id) => { archivedTemp = id; },
    };
    return undefined;
  },
};
const noTurnPhases = [];
const noTurnResult = await tc.createTaskCardAgentBridge(noTurnCtx)(
  { id: "usr-bridge", title: "旧标题", blocks: [], instruction: "重构成一张小卡" },
  (event) => noTurnPhases.push(event)
);
check(
  "temp-agent bridge: blank session first (workspace target, no fork), open, prompt, apply, archive",
  noTurnResult.ok === true &&
    forkAttempted === false &&
    createdWith !== null && createdWith.workspaceId === "ws-demo" && createdWith.cwd === undefined &&
    openedTemp === true &&
    promptedText.includes("【任务台卡片重构】") && promptedText.includes("usr-bridge") && promptedText.includes("重构成一张小卡") &&
    noTurnPhases.some((event) => event.phase === "started" && event.mode === "create") &&
    noTurnPhases.some((event) => event.phase === "assistant" && event.text.includes("桥接卡")) &&
    noTurnPhases.some((event) => event.phase === "applied" && event.id === "usr-bridge") &&
    archivedTemp === "session-temp-1"
);

// ---- temporary-agent bridge: fork fallback (create unavailable) ignores inherited history ----
const forkEntries = [durableEntry(3, '[taskcard] { "id": "usr-bridge", "title": "继承的旧卡" } [/taskcard]'), durableEntry(4, "inherited reply")];
const forkEvents = eventSourceOf(forkEntries);
let forked = false;
let forkOpts = null;
const forkCtx = {
  get(name) {
    if (name === "sessions") {
      return {
        list: { getSnapshot: () => ({ current: "s1", byId: {} }) },
        fork: async (opts) => { forked = true; forkOpts = opts; return "session-fork-1"; },
        create: async () => { throw new Error("session/create-unavailable"); },
        binding: (id) => (id === "session-fork-1" ? {
          sessionId: id,
          eventSource: forkEvents,
          session: {
            open: async () => {},
            getSnapshot: () => ({ running: false }),
            prompt: async () => {
              forkEntries.push(userEntry(19, "【任务台卡片重构】卡片 id：usr-bridge"));
              forkEntries.push(durableEntry(20, '[taskcard] { "id": "usr-bridge", "title": "派生结果卡", "blocks": [{ "kind": "text", "text": "新" }] } [/taskcard]'));
              return { ok: true, value: { accepted: true } };
            },
          },
        } : undefined),
      };
    }
    if (name === "workspaces") return { archiveSession: async () => {} };
    return undefined;
  },
};
const forkTexts = [];
const forkPhases = [];
const forkResult = await tc.createTaskCardAgentBridge(forkCtx)(
  { id: "usr-bridge", title: "旧标题", blocks: [], instruction: "重构成派生结果卡" },
  (event) => { forkPhases.push(event); if (event.phase === "assistant") forkTexts.push(event.text); }
);
check(
  "temp-agent bridge: fork fallback reads only its own reply",
  forkResult.ok === true &&
    forked === true &&
    forkOpts !== null && forkOpts.sessionId === "s1" && forkOpts.atSeq === undefined &&
    forkPhases.some((event) => event.phase === "started" && event.mode === "fork" && event.note !== undefined) &&
    forkTexts.length > 0 &&
    forkTexts.some((text) => text.includes("派生结果卡")) &&
    forkTexts.every((text) => text.includes("继承的旧卡") === false)
);

// ---- seeded-tail classifier: inherited pending work ----
check(
  "seed tail classifier: unconsumed inbox insert or open turn is pending work",
  tc.taskSeedCarriesPendingWork([durableEntry(1, "x"), turnEndEntry(2)]) === false &&
    tc.taskSeedCarriesPendingWork([durableEntry(1, "x"), inboxEntry(2, "next-turn", 1)]) === true &&
    tc.taskSeedCarriesPendingWork([durableEntry(1, "x"), turnEndEntry(2), turnStartEntry(3)]) === true &&
    tc.taskSeedCarriesPendingWork([inboxEntry(1, "next-step", 1), turnEndEntry(2)]) === false &&
    tc.taskSeedCarriesPendingWork([]) === false
);

// ---- temporary-agent bridge: fork fallback seeded with the source's queued message ----
const staleEntries = [inboxEntry(2, "next-turn", 1)];
let staleSnapshot = { running: true, queue: [{ id: "q1", placement: "queued" }] };
const staleRemoved = [];
let staleCancelled = false;
let stalePrompted = false;
const staleArchived = [];
const staleCtx = {
  get(name) {
    if (name === "sessions") {
      return {
        list: { getSnapshot: () => ({ current: "s1", byId: { s1: { cwd: "D:\\demo" } } }) },
        fork: async () => "session-stale-1",
        create: async () => { throw new Error("session/create-unavailable"); },
        binding: (id) => (id === "session-stale-1" ? {
          sessionId: id,
          eventSource: eventSourceOf(staleEntries),
          session: {
            open: async () => {},
            getSnapshot: () => staleSnapshot,
            updateQueue: async (itemId, action) => {
              staleRemoved.push([itemId, action && action.kind]);
              staleSnapshot = { running: staleSnapshot.running, queue: [] };
              return { ok: true, value: { accepted: true } };
            },
            cancel: async () => {
              staleCancelled = true;
              staleSnapshot = { running: false, queue: [] };
              return { ok: true, value: { accepted: true } };
            },
            prompt: async () => {
              stalePrompted = true;
              staleEntries.push(userEntry(11, "【任务台卡片重构】卡片 id：usr-bridge"));
              staleEntries.push(durableEntry(12, '[taskcard] { "id": "usr-bridge", "title": "清理后结果卡", "blocks": [{ "kind": "heading", "text": "新" }] } [/taskcard]'));
              return { ok: true, value: { accepted: true } };
            },
          },
        } : undefined),
      };
    }
    if (name === "workspaces") return { archiveSession: async (id) => { staleArchived.push(id); } };
    return undefined;
  },
};
const stalePhases = [];
const staleResult = await tc.createTaskCardAgentBridge(staleCtx)(
  { id: "usr-bridge", title: "旧标题", blocks: [], instruction: "重构成清理后结果卡" },
  (event) => stalePhases.push(event)
);
check(
  "temp-agent bridge: fork fallback purges inherited queue + stops stale turn, then applies",
  staleResult.ok === true &&
    staleCancelled === true &&
    staleRemoved.length === 1 && staleRemoved[0][0] === "q1" && staleRemoved[0][1] === "remove" &&
    stalePrompted === true &&
    stalePhases.some((event) => event.phase === "started" && typeof event.note === "string" && event.note.includes("排队消息")) &&
    stalePhases.some((event) => event.phase === "applied" && event.id === "usr-bridge") &&
    staleArchived.includes("session-stale-1")
);

// ---- temporary-agent bridge: child answers inherited work → main-session fallback ----
const foreignEntries = [durableEntry(2, "inherited reply"), turnEndEntry(3)];
let foreignArchived = null;
const foreignCtx = {
  get(name) {
    if (name === "sessions") {
      return {
        list: { getSnapshot: () => ({ current: "s1", byId: {} }) },
        fork: async () => "session-foreign-1",
        create: async () => { throw new Error("session/create-unavailable"); },
        binding: (id) => (id === "session-foreign-1" ? {
          sessionId: id,
          eventSource: eventSourceOf(foreignEntries),
          session: {
            open: async () => {},
            getSnapshot: () => ({ running: true }),
            prompt: async () => {
              foreignEntries.push(turnStartEntry(5));
              foreignEntries.push(durableEntry(6, "我先回答源会话遗留的那条消息"));
              return { ok: true, value: { accepted: true } };
            },
          },
        } : undefined),
      };
    }
    if (name === "workspaces") return { archiveSession: async (id) => { foreignArchived = id; } };
    return undefined;
  },
};
const foreignResult = await tc.createTaskCardAgentBridge(foreignCtx)(
  { id: "usr-bridge", title: "旧标题", blocks: [], instruction: "重构成趋势卡" },
  () => {}
);
check(
  "temp-agent bridge: reply without our own prompt → fast main-session fallback",
  foreignResult.ok !== true &&
    foreignResult.fallback === true &&
    foreignArchived === "session-foreign-1" &&
    typeof foreignResult.message === "string" && foreignResult.message.includes("主会话")
);

// ---- [taskcard] spec protocol ----
const specUp = tc.parseTaskCardSpec('[taskcard] { "title": "路线图", "body": "第一行\\n第二行", "buttons": [{ "label": "复制", "action": "copy", "value": "x" }] } [/taskcard]');
check(
  "spec parse upsert (legacy body/buttons map to blocks)",
  specUp !== null &&
    specUp.op === "upsert" &&
    specUp.title === "路线图" &&
    specUp.blocks.length === 2 &&
    specUp.blocks[0].kind === "text" &&
    specUp.blocks[0].text === "第一行\n第二行" &&
    specUp.blocks[1].kind === "button" &&
    specUp.blocks[1].action === "copy" &&
    specUp.blocks[1].value === "x"
);
const specBlocks = tc.parseTaskCardSpec('[taskcard] { "title": "看板", "blocks": [' +
  '{ "kind": "heading", "text": "进度" },' +
  '{ "kind": "checklist", "key": "todo", "items": [{ "id": "a", "label": "A" }, { "id": "b", "label": "B" }] },' +
  '{ "kind": "counter", "key": "cnt", "label": "轮次", "step": 1 },' +
  '{ "kind": "progress", "label": "完成", "value": 3, "max": 10 },' +
  '{ "kind": "unknownish", "anything": true }' +
  '] } [/taskcard]');
check(
  "spec parse control blocks",
  specBlocks !== null &&
    specBlocks.blocks.length === 5 &&
    specBlocks.blocks[0].kind === "heading" &&
    specBlocks.blocks[1].kind === "checklist" &&
    specBlocks.blocks[1].items.length === 2 &&
    specBlocks.blocks[2].kind === "counter" &&
    specBlocks.blocks[3].kind === "progress" &&
    specBlocks.blocks[4].kind === "unknown"
);
const specStyle = tc.parseTaskCardSpec('[taskcard] { "title": "看板", "style": { "accent": "blue", "width": "wide", "density": "cozy", "icon": "📊", "bad": "x" }, "blocks": [{ "kind": "text", "text": "hi" }] } [/taskcard]');
check(
  "spec style parse allowlist",
  specStyle !== null &&
    specStyle.style !== void 0 &&
    specStyle.style.accent === "blue" &&
    specStyle.style.width === "wide" &&
    specStyle.style.density === "cozy" &&
    specStyle.style.icon === "📊" &&
    Object.hasOwn(specStyle.style, "bad") === false
);
const specStyleBad = tc.parseTaskCardSpec('[taskcard] { "title": "卡", "style": { "accent": "nope", "width": "huge" } } [/taskcard]');
check("spec style drops invalid values", specStyleBad !== null && specStyleBad.style === void 0);
const specTrend = tc.parseTaskCardSpec('[taskcard] { "title": "看板", "blocks": [{ "kind": "trend", "label": "访问量", "unit": "次", "values": [3, 5, 2, 8, 6, 9] }, { "kind": "trend", "values": [1] }] } [/taskcard]');
check(
  "spec trend parse (>=2 points kept, single point dropped)",
  specTrend !== null &&
    specTrend.blocks.length === 1 &&
    specTrend.blocks[0].kind === "trend" &&
    specTrend.blocks[0].items.length === 6 &&
    specTrend.blocks[0].items[5].value === 9
);
const specDel = tc.parseTaskCardSpec('[taskcard] { "op": "delete", "title": "路线图" } [/taskcard]');
check("spec parse delete", specDel !== null && specDel.op === "delete" && specDel.title === "路线图");
const specNewKinds = tc.parseTaskCardSpec('[taskcard] { "title": "混合", "blocks": [' +
  '{ "kind": "table", "columns": ["A", "B"], "rows": [["1", "2"], ["3"]] },' +
  '{ "kind": "code", "language": "ts", "text": "const a = 1;" },' +
  '{ "kind": "toggle", "key": "sw", "label": "开关" },' +
  '{ "kind": "countdown", "label": "截止", "until": "2030-01-01T00:00:00Z" },' +
  '{ "kind": "bars", "items": [{ "label": "x", "value": 3 }] },' +
  '{ "kind": "table" }' +
  '] } [/taskcard]');
check(
  "spec parse new control kinds (table/code/toggle/countdown/bars; invalid dropped)",
  specNewKinds !== null &&
    specNewKinds.blocks.length === 5 &&
    specNewKinds.blocks[0].kind === "table" &&
    specNewKinds.blocks[0].columns.length === 2 &&
    specNewKinds.blocks[0].rows[1].length === 2 &&
    specNewKinds.blocks[1].kind === "code" &&
    specNewKinds.blocks[1].language === "ts" &&
    specNewKinds.blocks[2].kind === "toggle" &&
    specNewKinds.blocks[2].value === false &&
    specNewKinds.blocks[3].kind === "countdown" &&
    typeof specNewKinds.blocks[3].until === "number" &&
    specNewKinds.blocks[4].kind === "bars" &&
    specNewKinds.blocks[4].items.length === 1
);
const specKvAlias = tc.parseTaskCardSpec('[taskcard] { "title": "键值", "blocks": [' +
  '{ "kind": "kv", "items": [{ "key": "分支", "value": "main" }, { "label": "版本", "value": "0.8.2" }] },' +
  '{ "kind": "kv", "rows": [["A", "1"]] },' +
  '{ "kind": "kv", "items": [] }' +
  '] } [/taskcard]');
check(
  "spec kv accepts rows and the items alias (empty kv dropped)",
  specKvAlias !== null &&
    specKvAlias.blocks.length === 2 &&
    specKvAlias.blocks[0].rows.length === 2 &&
    specKvAlias.blocks[0].rows[0][0] === "分支" &&
    specKvAlias.blocks[0].rows[1][1] === "0.8.2" &&
    specKvAlias.blocks[1].rows[0][1] === "1"
);
const specFence = tc.parseTaskCardSpec('~~~ preamble\n```taskcard\n{ "op": "upsert", "title": "T" }\n```\n');
check("spec parse fenced", specFence !== null && specFence.op === "upsert" && specFence.title === "T");
check("spec parse rejects plain text", tc.parseTaskCardSpec("ordinary message without markers") === null);
check("button validation drops empty value", tc.sanitizeTaskButton({ label: "x", action: "copy", value: "  " }) === null);
check("button validation keeps fill", tc.sanitizeTaskButton({ label: "", action: "fill", value: "hi" }) !== null && tc.sanitizeTaskButton({ action: "fill", value: "hi" }).action === "fill");
check("builtin id list", tc.builtinTaskCardIds().length >= 4 && tc.builtinTaskCardIds().includes("session"));
const created = tc.applyTaskCardSpec({ op: "upsert", title: "测试卡", blocks: [{ kind: "text", text: "内容" }] });
check("apply upsert creates user card", created.ok && created.created === true && created.id.startsWith("usr-"));
const updated = tc.applyTaskCardSpec({ op: "upsert", title: "测试卡", blocks: [{ kind: "checklist", key: "todo", items: [{ id: "a", label: "A" }] }] });
check("apply upsert by title updates", updated.ok && updated.created === false);
const removed = tc.applyTaskCardSpec({ op: "delete", title: "测试卡" });
check("apply delete by title", removed.ok && removed.op === "delete");

// ---- image control ----
const imageSpec = tc.parseTaskCardSpec('[taskcard] { "title": "图", "blocks": [{ "kind": "image", "src": "data:image/png;base64,AAAA", "caption": "截图" }, { "kind": "image", "src": "javascript:alert(1)" }] } [/taskcard]');
check(
  "image control parses and rejects unsafe src",
  imageSpec !== null && imageSpec.blocks.length === 1 && imageSpec.blocks[0].kind === "image" && imageSpec.blocks[0].caption === "截图"
);
const imageHtml = renderToString(jsx(tc.TaskUserBody, { card: { title: "图", blocks: [{ kind: "image", src: "data:image/png;base64,AAAA", caption: "截图" }] }, onWidget: () => {} }));
check("image control renders", imageHtml.includes("dsh-tc-img") && imageHtml.includes("截图"));

// ---- embedded web apps on cards ----
check(
  "embed url accepts http(s) and normalizes",
  tc.cleanTaskEmbedUrl("https://example.com/app") === "https://example.com/app" &&
    tc.cleanTaskEmbedUrl("  http://localhost:5173  ") === "http://localhost:5173/" &&
    tc.cleanTaskEmbedUrl("http://127.0.0.1:8080/x?y=1") === "http://127.0.0.1:8080/x?y=1"
);
check(
  "embed url rejects every non-http(s) scheme",
  tc.cleanTaskEmbedUrl("javascript:alert(1)") === null &&
    tc.cleanTaskEmbedUrl("data:text/html,<h1>x</h1>") === null &&
    tc.cleanTaskEmbedUrl("file:///C:/secret.html") === null &&
    tc.cleanTaskEmbedUrl("blob:https://example.com/abc") === null &&
    tc.cleanTaskEmbedUrl("//example.com/app") === null &&
    tc.cleanTaskEmbedUrl("example.com") === null &&
    tc.cleanTaskEmbedUrl("") === null &&
    tc.cleanTaskEmbedUrl(null) === null
);
check("embed host helper", tc.taskEmbedHost("http://localhost:5173/") === "localhost:5173");
check("embed height clamps to bounds", tc.clampTaskEmbedHeight(10) === 120 && tc.clampTaskEmbedHeight(99999) === 1200 && tc.clampTaskEmbedHeight("x") === 300);

const embedSpec = tc.parseTaskCardSpec(
  '[taskcard] { "title": "应用卡", "blocks": [{ "kind": "embed", "url": "http://localhost:5173", "title": "本地应用", "height": 420 }, { "kind": "embed", "url": "javascript:alert(1)" }] } [/taskcard]'
);
check(
  "embed control parses, normalizes and drops unsafe urls",
  embedSpec !== null &&
    embedSpec.blocks.length === 1 &&
    embedSpec.blocks[0].kind === "embed" &&
    embedSpec.blocks[0].url === "http://localhost:5173/" &&
    embedSpec.blocks[0].title === "本地应用" &&
    embedSpec.blocks[0].height === 420 &&
    embedSpec.blocks[0].fill === false
);
check("embed is an advertised control kind", tc.TASK_BLOCK_KINDS.includes("embed"));

const appCard = { title: "应用卡", blocks: [{ kind: "embed", url: "http://localhost:5173/", title: "本地应用", height: 420, fill: false }] };
const appHtml = renderToString(jsx(tc.TaskUserBody, { card: appCard, onWidget: () => {} }));
check(
  "embedded app renders a sandboxed frame with its own bar",
  appHtml.includes("dsh-tc-app") &&
    appHtml.includes('src="http://localhost:5173/"') &&
    appHtml.includes("sandbox=" + JSON.stringify(tc.TASK_EMBED_SANDBOX)) &&
    appHtml.includes("dsh-tc-appTitle") &&
    appHtml.includes("本地应用") &&
    appHtml.includes("localhost:5173") &&
    appHtml.includes("height:420px")
);
check(
  "embed frame never gets top navigation, and same-origin apps lose allow-same-origin",
  !tc.TASK_EMBED_SANDBOX.includes("allow-top-navigation") &&
    !tc.TASK_EMBED_SANDBOX_OPAQUE.includes("allow-same-origin") &&
    appHtml.includes("no-referrer")
);
const fillHtml = renderToString(jsx(tc.TaskUserBody, {
  card: { title: "满屏应用", blocks: [{ kind: "embed", url: "https://example.com/app", fill: true }] },
  onWidget: () => {},
}));
check(
  "fill app stretches instead of using a fixed height",
  fillHtml.includes("dsh-tc-appFill") &&
    fillHtml.includes('data-fill="1"') &&
    fillHtml.includes("height:") === false &&
    fillHtml.includes("dsh-tc-appGrip") === false
);
check(
  "fixed-height app exposes the drag grip for its own height",
  appHtml.includes("dsh-tc-appGrip") &&
    appHtml.includes("dsh-tc-appGripBar") &&
    appHtml.includes("dsh-tc-appGripLabel") &&
    appHtml.includes("上下拖动调整这个内嵌应用的高度")
);
const gripCard = { title: "应用卡", blocks: [{ kind: "text", text: "x" }, { kind: "embed", url: "https://example.com/app", title: "应用", height: 300, fill: false }, { kind: "embed", url: "https://example.com/other", title: "铺满", fill: true }] };
check(
  "drag-resizing writes the block height without mutating the card",
  tc.patchTaskEmbedHeight(gripCard, 1, 512).blocks[1].height === 512 &&
    tc.patchTaskEmbedHeight(gripCard, 1, 512).blocks[0] === gripCard.blocks[0] &&
    gripCard.blocks[1].height === 300 &&
    tc.patchTaskEmbedHeight(gripCard, 1, 4).blocks[1].height === 120 &&
    tc.patchTaskEmbedHeight(gripCard, 1, 99999).blocks[1].height === 1200
);
check(
  "drag-resizing ignores no-ops, non-embed blocks, fill apps and bad input",
  tc.patchTaskEmbedHeight(gripCard, 1, 300) === null &&
    tc.patchTaskEmbedHeight(gripCard, 0, 400) === null &&
    tc.patchTaskEmbedHeight(gripCard, 2, 400) === null &&
    tc.patchTaskEmbedHeight(gripCard, 9, 400) === null &&
    tc.patchTaskEmbedHeight(gripCard, 1, Number.NaN) === null &&
    tc.patchTaskEmbedHeight(null, 0, 400) === null
);
check(
  "the app block index used by the drag survives a card round-trip",
  tc.sanitizeTaskBlocks(gripCard.blocks)[1].height === 300 && tc.sanitizeTaskBlocks(tc.patchTaskEmbedHeight(gripCard, 1, 512).blocks)[1].height === 512
);
const editorHtml = renderToString(jsx(tc.TaskCardEditor, { initial: { id: "usr-1", title: "应用卡", pinned: false, blocks: appCard.blocks }, onSave: () => {}, onCancel: () => {} }));
check(
  "card editor edits an existing embedded app",
  editorHtml.includes("内嵌网页应用") &&
    editorHtml.includes('value="http://localhost:5173/"') &&
    editorHtml.includes("填满") &&
    editorHtml.includes("+ 内嵌网页应用")
);
const editorBlocks = tc.taskEditorBlocks({ title: "t", body: "正文", buttons: [{ action: "copy", label: "复制", value: "x" }], embeds: [{ url: "https://example.com/app", title: "应用", height: 200, fill: false }, { url: "nope", title: "", height: 100, fill: false }] });
check(
  "editor result becomes text + button + validated embeds",
  editorBlocks.length === 3 &&
    editorBlocks[0].kind === "text" &&
    editorBlocks[1].kind === "button" &&
    editorBlocks[2].kind === "embed" &&
    editorBlocks[2].url === "https://example.com/app" &&
    editorBlocks[2].height === 200
);
const embedPrompt = tc.composeTaskCardChatPrompt({ id: "usr-1", title: "应用卡", blocks: [] }, "把本地应用嵌进来");
check(
  "card refactor prompt teaches the embed control",
  embedPrompt.includes("embed：{ url, title?, height?, fill? }") && embedPrompt.includes("X-Frame-Options") && embedPrompt.includes("http://localhost:5173")
);
const appliedEmbed = tc.applyTaskCardSpec(embedSpec);
check("embed spec applies to the board store", appliedEmbed.ok === true && appliedEmbed.created === true);
if (appliedEmbed.ok) tc.applyTaskCardSpec({ op: "delete", title: "应用卡" });

// ---- infinite canvas + collaboration helpers ----
const copySource = { id: "usr-1", title: "源卡", blocks: [{ kind: "text", text: "hi" }], style: { accent: "blue" } };
const copied = tc.canvasCopyCard(copySource, 10, 20, 1000);
check(
  "publish copy is an independent canvas card",
  copied.id !== copySource.id &&
    copied.title === "源卡" &&
    copied.x === 10 &&
    copied.y === 20 &&
    copied.blocks.length === 1 &&
    copied.style.accent === "blue"
);
check(
  "last-writer-wins merge keeps the newer card",
  tc.mergeCanvasCard({ id: "c", updatedAt: 5, rev: "a" }, { id: "c", updatedAt: 9, rev: "b" }).updatedAt === 9 &&
    tc.mergeCanvasCard({ id: "c", updatedAt: 9, rev: "z" }, { id: "c", updatedAt: 9, rev: "a" }).rev === "z"
);
const shareText = tc.encodeCanvasShare({ relay: "ws://127.0.0.1:8787", canvasId: "cv1", name: "团队画布", token: "t-1" });
const shareInfo = tc.decodeCanvasShare(shareText);
check(
  "share string round-trips",
  shareInfo !== null && shareInfo.relay === "ws://127.0.0.1:8787" && shareInfo.canvasId === "cv1" && shareInfo.name === "团队画布" && shareInfo.token === "t-1"
);
check("share string rejects foreign text", tc.decodeCanvasShare("hello") === null);

// ---- card maximize -> its own canvas holding the card's controls ("副本") ----
check("instance canvas id is derived from the card id", tc.canvasInstanceId("usr-9") === "cv-inst-usr-9" && tc.isCanvasInstance("cv-inst-usr-9") === true && tc.isCanvasInstance("cv1abc") === false);
const createdSpec = tc.applyTaskCardSpec({
  op: "upsert",
  title: "发布清单",
  blocks: [
    { kind: "heading", text: "发版前" },
    { kind: "checklist", key: "todo", items: [{ id: "a", label: "跑测试" }, { id: "b", label: "更新文档" }] },
    { kind: "embed", url: "http://localhost:5173/", title: "本地应用", height: 300, fill: false },
  ],
  style: { accent: "emerald", icon: "🚀" },
});
const instanceSource = { ...tc.snapshotTaskCards().cards[createdSpec.id], id: createdSpec.id };
const activeBefore = tc.canvasSnapshot().activeId;
const instanceId = tc.canvasOpenInstance(instanceSource);
const instanceCanvas = tc.canvasSnapshot().canvases[instanceId];
const seeded = Object.values(instanceCanvas.cards);
check(
  "maximizing a card unrolls its controls onto its own canvas",
  instanceId === "cv-inst-" + createdSpec.id &&
    instanceCanvas.name === "副本 · 发布清单" &&
    seeded.length === 3 &&
    seeded.every((item) => item.blocks.length === 1 && item.from !== void 0 && item.from.card === createdSpec.id) &&
    seeded.map((item) => item.blocks[0].kind).sort().join(",") === "checklist,embed,heading" &&
    seeded.some((item) => item.title.indexOf("网页应用") === 0) &&
    seeded.every((item) => typeof item.from.bid === "string" && item.from.bid.length > 0)
);
check(
  "the exploded controls are stamped onto the card itself",
  tc.snapshotTaskCards().cards[createdSpec.id].blocks.every((block) => typeof block.bid === "string") &&
    new Set(seeded.map((item) => item.from.bid)).size === 3
);
check("entering an instance does not steal the active canvas seat", tc.canvasSnapshot().activeId === activeBefore);
check(
  "re-entering the same card reuses its instance",
  tc.canvasOpenInstance(instanceSource) === instanceId && Object.keys(tc.canvasSnapshot().canvases[instanceId].cards).length === 3
);
// Dragging a control on the plane re-orders the control on the board card (thumbnail mapping).
const ordered = [...seeded].sort((left, right) => left.y - right.y || left.x - right.x);
const moved = ordered[0];
tc.canvasUpsertCard(instanceId, { ...moved, y: ordered[ordered.length - 1].y + 500 }, true);
check(
  "dragging a control on the canvas reorders it on the card",
  tc.canvasSyncBlockOrder(instanceId, createdSpec.id) === true &&
    tc.snapshotTaskCards().cards[createdSpec.id].blocks[tc.snapshotTaskCards().cards[createdSpec.id].blocks.length - 1].bid === moved.from.bid
);
// Editing a control on the plane writes that control back onto the card.
const firstBid = tc.snapshotTaskCards().cards[createdSpec.id].blocks[0].bid;
check(
  "editing a control on the canvas updates the card",
  tc.canvasWriteBackBlock(createdSpec.id, firstBid, [{ kind: "note", text: "改过的说明", bid: firstBid }]) === true &&
    tc.snapshotTaskCards().cards[createdSpec.id].blocks[0].kind === "note" &&
    tc.snapshotTaskCards().cards[createdSpec.id].blocks[0].text === "改过的说明"
);
check("no-op write-backs are ignored", tc.canvasWriteBackBlock(createdSpec.id, firstBid, [{ kind: "note", text: "改过的说明", bid: firstBid }]) === false);
check(
  "deleting a bound control removes it from the card",
  tc.canvasRemoveBoundBlock({ from: { card: createdSpec.id, bid: firstBid } }) === true &&
    tc.snapshotTaskCards().cards[createdSpec.id].blocks.length === 2
);
check(
  "re-unrolling replaces the bound control items",
  tc.canvasRebuildInstance(instanceId, createdSpec.id) === 2 &&
    Object.values(tc.canvasSnapshot().canvases[instanceId].cards).filter((item) => tc.canvasCardBinding(item) !== null).length === 2
);
// ---- a conversation refactor must land on the canvas too (same controls both places) ----
const boundNow = () => Object.values(tc.canvasSnapshot().canvases[instanceId].cards).filter((item) => tc.canvasCardBinding(item) !== null);
const survivor = boundNow().sort((left, right) => left.y - right.y || left.x - right.x)[0];
const survivorBid = survivor.from.bid;
const survivorBlock = { ...survivor.blocks[0], bid: survivorBid };
if (survivorBlock.kind === "checklist") survivorBlock.items = [...survivorBlock.items, { id: "c", label: "发公告" }];
const refactored = tc.applyTaskCardSpec({
  op: "upsert",
  id: createdSpec.id,
  title: "发布清单",
  blocks: [
    // the AI echoes the existing bid → the plane keeps that item's place
    survivorBlock,
    { kind: "progress", label: "进度", value: 1, max: 3 },
  ],
});
const afterRefactor = boundNow();
const keptItem = afterRefactor.find((item) => item.id === survivor.id);
check(
  "a conversation refactor keeps the card's canvas in step",
  refactored.ok === true &&
    afterRefactor.length === 2 &&
    keptItem !== void 0 &&
    keptItem.x === survivor.x &&
    keptItem.y === survivor.y &&
    afterRefactor.some((item) => item.blocks[0].kind === "progress") &&
    afterRefactor.every((item) => item.from.card === createdSpec.id) &&
    // one item per control, no leftovers from the controls the refactor dropped
    afterRefactor.length === tc.snapshotTaskCards().cards[createdSpec.id].blocks.length
);
check(
  "canvas item labels follow their control after a refactor",
  afterRefactor.every((item) => item.title === tc.taskBlockLabel(item.blocks[0])) &&
    afterRefactor.some((item) => item.title.indexOf("进度") === 0)
);
check(
  "every control on the card has exactly one canvas item",
  tc.snapshotTaskCards().cards[createdSpec.id].blocks.length === boundNow().length &&
    tc.snapshotTaskCards().cards[createdSpec.id].blocks.every((block) => boundNow().some((item) => item.from.bid === block.bid))
);
const relabelled = boundNow().find((item) => item.blocks[0].kind === "progress");
check(
  "editing a control on the plane relabels its item",
  tc.canvasPushBinding(instanceId, { ...relabelled, blocks: [{ kind: "note", text: "换成说明", bid: relabelled.from.bid }] }) === true &&
    tc.canvasSnapshot().canvases[instanceId].cards[relabelled.id].title.indexOf("说明") === 0 &&
    tc.snapshotTaskCards().cards[createdSpec.id].blocks.some((block) => block.text === "换成说明")
);
const beforeUnbind = boundNow().length;
tc.applyTaskCardSpec({ op: "delete", id: createdSpec.id });
check(
  "deleting the card clears its canvas items",
  beforeUnbind > 0 &&
    Object.values(tc.canvasSnapshot().canvases[instanceId].cards).filter((item) => tc.canvasCardBinding(item) !== null).length === 0
);
const duplicatedId = tc.canvasDuplicateCard(instanceId, seeded[1]);
check(
  "instance cards can be duplicated in place (a copy is unbound)",
  duplicatedId !== null &&
    duplicatedId !== seeded[1].id &&
    tc.canvasSnapshot().canvases[instanceId].cards[duplicatedId].x === seeded[1].x + 44 &&
    tc.canvasCardBinding(tc.canvasSnapshot().canvases[instanceId].cards[duplicatedId]) === null
);
const sentBack = tc.canvasSendToBoard({ title: "衍生卡", blocks: [{ kind: "text", text: "hi" }] });
check("a canvas card can be sent back to the task board", sentBack.ok === true && sentBack.created === true && sentBack.id.startsWith("usr-"));
check("sending the same card back updates the board card", tc.canvasSendToBoard({ title: "衍生卡", blocks: [{ kind: "text", text: "hi" }] }).created === false);
check(
  "control items are labelled by kind and content",
  tc.taskBlockLabel({ kind: "embed", title: "本地应用" }) === "网页应用 · 本地应用" &&
    tc.taskBlockLabel({ kind: "checklist", items: [{ id: "a", label: "跑测试" }] }) === "清单 · 跑测试" &&
    tc.taskBlockLabel({ kind: "heading", text: "发版前" }) === "小标题 · 发版前"
);
check(
  "bound links and block ids survive a sanitize round-trip",
  tc.sanitizeCanvasCard({ id: "cc-1", from: { card: "usr-1", bid: "blk-1" } }, "cc-1").from.bid === "blk-1" &&
    tc.sanitizeTaskBlocks([{ kind: "text", text: "x", bid: "blk-9" }])[0].bid === "blk-9"
);
check(
  "card body is a thumbnail of its controls",
  renderToString(jsx(tc.TaskUserBody, { card: { title: "t", blocks: [{ kind: "text", text: "x" }, { kind: "note", text: "y" }] }, onWidget: () => {}, thumbnail: true })).includes("2 个控件 · ⛶ 进画布排布") &&
    // canvas items are the controls themselves, so they do not advertise the thumbnail footer
    renderToString(jsx(tc.TaskUserBody, { card: { title: "t", blocks: [{ kind: "text", text: "x" }] }, onWidget: () => {} })).includes("个控件 · ⛶ 进画布排布") === false
);
tc.applyTaskCardSpec({ op: "delete", title: "发布清单" });
tc.applyTaskCardSpec({ op: "delete", title: "衍生卡" });

const instanceHtml = renderToString(jsx(tc.TaskCanvasView, {
  instance: { canvasId: instanceId, cardId: createdSpec.id, title: "发布清单", source: instanceSource },
  onClose: () => {},
}));
check(
  "instance canvas bar is bound to the card",
  instanceHtml.includes("副本画布") &&
    instanceHtml.includes("重新展开控件") &&
    instanceHtml.includes("放入源卡副本") &&
    instanceHtml.includes("返回任务台") &&
    instanceHtml.includes("删除副本") &&
    instanceHtml.includes("副本 · 发布清单") &&
    // the normal canvas switcher/creation controls stay out of instance mode
    instanceHtml.includes("+ 新画布") === false &&
    instanceHtml.includes("删除画布") === false
);

const canvas = tc.canvasCreate("测试画布");
const published = tc.canvasPublishCard({ title: "源卡", blocks: [{ kind: "text", text: "hi" }] });
check(
  "canvas publish adds a copy into the active canvas",
  tc.canvasSnapshot().canvases[canvas.id] !== void 0 &&
    tc.canvasSnapshot().canvases[published.canvasId].cards[published.cardId] !== void 0
);
const canvasMerged = tc.mergeCanvasState(tc.canvasSnapshot(), {
  canvases: {
    [canvas.id]: { id: canvas.id, name: "远端改名", updatedAt: Date.now() + 1000, cards: { remote1: { id: "remote1", title: "远端卡", x: 5, y: 5, updatedAt: Date.now() + 1000, rev: "r1", blocks: [{ kind: "text", text: "remote" }] } } },
  },
});
check(
  "canvas state merge adopts remote cards",
  canvasMerged.canvases[canvas.id].cards.remote1 !== void 0 && canvasMerged.canvases[canvas.id].cards[published.cardId] !== void 0
);
const canvasHtml = renderToString(jsx(tc.TaskCanvasView, { onClose: () => {} }));
check(
  "canvas view renders board, card and collaboration entry",
  canvasHtml.includes("无限画布") &&
    canvasHtml.includes("源卡") &&
    canvasHtml.includes("复制分享串") &&
    canvasHtml.includes("dsh-tc-canvasScroll") &&
    canvasHtml.includes("dsh-tc-canvasCard")
);
check("canvas share string available for the active canvas", typeof tc.canvasShareString() === "string" && tc.canvasShareString().startsWith("DSHCANVAS1:"));

// ---- architecture diagram dock (embedded archify artifact) ----
const diagramHtml = await tc.taskDiagramHtml();
check(
  "embedded diagram decodes to the archify artifact",
  typeof diagramHtml === "string" &&
    diagramHtml.startsWith("<!DOCTYPE html>") &&
    diagramHtml.includes("archify") &&
    createHash("sha256").update(diagramHtml, "utf8").digest("hex") === tc.TASK_DIAGRAM_SHA256
);
const diagramSource = join(HERE, "docs", "architecture.html");
check("embedded diagram matches docs/architecture.html", !existsSync(diagramSource) || readFileSync(diagramSource, "utf8") === diagramHtml);
check("embedded diagram decode is cached", (await tc.taskDiagramHtml()) === diagramHtml);

const dockHtml = renderToString(jsx(tc.TaskDiagramDock, { onClose: () => {} }));
check(
  "diagram dock renders a sandboxed frame with the artifact",
  dockHtml.includes("dsh-tc-diagramDock") &&
    dockHtml.includes("dsh-tc-diagramGrip") &&
    dockHtml.includes("项目逻辑框图") &&
    dockHtml.includes("新标签打开") &&
    // SSR keeps the camelCase prop name; the client sets the srcdoc property itself
    (dockHtml.includes("srcdoc=") || dockHtml.includes("srcDoc=")) &&
    dockHtml.includes('sandbox="allow-scripts allow-downloads allow-modals allow-popups"') &&
    dockHtml.includes("&lt;!DOCTYPE html&gt;")
);
check("diagram dock bar reports the artifact size", dockHtml.includes(Math.round(diagramHtml.length / 1024) + "KB · archify"));
check("diagram dock width clamps to sane bounds", tc.taskDiagramWidthClamp(10) === 380 && tc.taskDiagramWidthClamp(5000) === 1440);

const panelHtmlWithDiagramButton = renderToString(jsx(tc.TaskBackPanel, { useSessions, onClose: () => {} }));
check(
  "panel: diagram dock toggle",
  panelHtmlWithDiagramButton.includes("🗺 框图") && panelHtmlWithDiagramButton.includes("在右侧显示当前项目的逻辑框图")
);

// ---- fullscreen card view ----
check(
  "panel: every card carries a fullscreen button",
  panelHtmlWithDiagramButton.includes("⛶") &&
    (panelHtmlWithDiagramButton.includes("全屏显示这张卡片（Esc 退出）") || panelHtmlWithDiagramButton.includes("最大化：进入这张卡片的副本画布"))
);
const panelUserCardHtml = renderToString(jsx(tc.TaskBackPanel, {
  useSessions: (selector) => selector(STATE),
  onClose: () => {},
}));
check(
  "panel: user cards maximize into their instance canvas",
  panelUserCardHtml.includes("最大化：进入这张卡片的副本画布") && panelUserCardHtml.includes("全屏显示这张卡片")
);
const fillAppCard = { title: "应用卡", blocks: [{ kind: "embed", url: "http://localhost:5173/", title: "本地应用", height: 300, fill: true }] };
const fullHtml = renderToString(jsx(tc.TaskCardFullscreen, {
  title: "应用卡",
  badge: "置顶",
  layout: { style: { accent: "blue", icon: "🌐" } },
  fill: true,
  actions: [{ key: "pin", icon: "📌", title: "取消置顶", onClick: () => {} }],
  onClose: () => {},
  children: jsx(tc.TaskUserBody, { card: fillAppCard, cardId: "usr-1", onWidget: () => {}, onWidgetState: () => {} }),
}));
check(
  "fullscreen card renders its shell, header, hint and the live body",
  fullHtml.includes("dsh-tc-full") &&
    fullHtml.includes("dsh-tc-fullCard") &&
    fullHtml.includes("dsh-tc-fullHead") &&
    fullHtml.includes('data-fill="1"') &&
    fullHtml.includes("应用卡") &&
    fullHtml.includes("置顶") &&
    fullHtml.includes("🌐") &&
    fullHtml.includes("Esc 或点空白处退出") &&
    fullHtml.includes("浏览器全屏") &&
    fullHtml.includes("退出全屏（Esc）") &&
    fullHtml.includes('role="dialog"') &&
    fullHtml.includes('aria-modal="true"') &&
    // the embedded app travels into the fullscreen view and fills it
    fullHtml.includes("dsh-tc-app") &&
    fullHtml.includes("dsh-tc-appFill") &&
    fullHtml.includes('src="http://localhost:5173/"')
);
const fullPlainHtml = renderToString(jsx(tc.TaskCardFullscreen, { title: "任务", layout: {}, onClose: () => {}, children: "内容" }));
check(
  "fullscreen card without a fill app scrolls instead of stretching",
  fullPlainHtml.includes("dsh-tc-fullBody") && !fullPlainHtml.includes('data-fill="1"') && fullPlainHtml.includes("内容")
);
const boardCardHtml = renderToString(jsx(tc.TaskCard, {
  id: "usr-1", title: "卡片", layout: { x: 0, y: 0 }, zIndex: 1, boardRef: { current: null },
  actions: [{ key: "full", icon: "⛶", title: "全屏显示这张卡片（Esc 退出）", onClick: () => {} }],
  onDragCommit: () => {}, onResizeCommit: () => {},
  children: "正文",
}));
check("card header renders the fullscreen button", boardCardHtml.includes("⛶") && boardCardHtml.includes("全屏显示这张卡片"));
check("canvas cards expose the fullscreen action", renderToString(jsx(tc.TaskCanvasView, { onClose: () => {} })).includes("全屏显示这张卡片"));

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
