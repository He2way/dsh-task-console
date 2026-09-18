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
  tc.TASK_CARD_AGENT_TASK,
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
  tc.TASK_CARD_AGENT_TASK,
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
  tc.TASK_CARD_AGENT_TASK,
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
  tc.TASK_CARD_AGENT_TASK,
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

// ---- 工作时序 preset card (host integration with dsh-plugin-tpt-chronicle) ----
check(
  "chronicle is a builtin card with a default slot",
  tc.builtinTaskCardIds().includes("chronicle") &&
    typeof tc.TASK_CARD_DEFAULTS.chronicle.x === "number" &&
    tc.TASK_CARD_DEFAULTS.chronicle.h > 0
);
check("chronicle card id is the plugin package name", tc.TPT_PLUGIN_ID === "dsh-plugin-tpt-chronicle");
const chronicleHtml = renderToString(jsx(tc.TaskBackPanel, { useSessions, onClose: () => {}, modules: undefined }));
check("chronicle card renders on the board", chronicleHtml.includes("工作时序") && chronicleHtml.includes("dsh-tc-tptHost"));
const noModules = await tc.loadTptBundle(undefined).then(() => null, (error) => error);
check(
  "loader asks for the DSH start manifest when rows are unavailable",
  noModules instanceof Error && noModules.message.includes("dsh-plugin-tpt-chronicle"),
  noModules instanceof Error ? noModules.message : String(noModules)
);
check("chronicle badge starts empty", tc.chronicleStatus.value === null);
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

// ---- the canvas chat may ADD controls, not just reference them ----
check(
  "instance canvases name their card, plain canvases name none",
  tc.instanceCardOf(instanceId) === createdSpec.id && tc.instanceCardOf("cv-plain") === ""
);
const adoptCanvas = tc.canvasCreate("收养画布");
check("adoption ignores a normal canvas", tc.canvasAdoptItems(adoptCanvas.id).length === 0);
const adoptId = tc.canvasAddControl(adoptCanvas.id, "counter", 40, 40);
check("adoption ignores free items on a normal canvas", tc.canvasAdoptItems(adoptCanvas.id).length === 0 && tc.canvasSnapshot().canvases[adoptCanvas.id].cards[adoptId] !== void 0);

const adoptSource = tc.applyTaskCardSpec({ op: "upsert", title: "收养目标", blocks: [{ kind: "heading", text: "已有控件" }] });
const adoptInstance = tc.canvasOpenInstance({ ...tc.snapshotTaskCards().cards[adoptSource.id], id: adoptSource.id });
const blocksBefore = tc.snapshotTaskCards().cards[adoptSource.id].blocks.length;
// The chat's `add` op lands on the plane; adoption is what makes it stick to the card.
const chatReply = '[canvas] { "ops": [ { "op": "add", "kind": "countdown", "until": ' + (Date.now() + 86400000) + ', "label": "到明天 18 点" } ] } [/canvas]';
const addedByChat = tc.applyCanvasSpec(adoptInstance, tc.parseCanvasSpec(chatReply));
const adopted = tc.canvasAdoptItems(adoptInstance);
const adoptedItem = adopted.length > 0 ? tc.canvasSnapshot().canvases[adoptInstance].cards[adopted[0]] : void 0;
const cardAfterAdopt = tc.snapshotTaskCards().cards[adoptSource.id];
check(
  "a control added by the canvas chat is created through the canvas protocol",
  addedByChat.ok === true && addedByChat.changed === 1
);
check(
  "adoption binds the new item to the card's new control",
  adopted.length === 1 &&
    adoptedItem !== void 0 &&
    adoptedItem.from !== void 0 &&
    adoptedItem.from.card === adoptSource.id &&
    typeof adoptedItem.from.bid === "string" &&
    adoptedItem.from.bid.length > 0 &&
    cardAfterAdopt.blocks.some((block) => block.kind === "countdown" && block.bid === adoptedItem.from.bid),
  JSON.stringify({ adopted: adopted.length, from: adoptedItem?.from, addedByChat })
);
check(
  "adoption grows the card by exactly the new control",
  cardAfterAdopt.blocks.length === blocksBefore + 1 &&
    cardAfterAdopt.blocks.filter((block) => block.kind === "countdown").length === 1
);
check("adoption is idempotent", tc.canvasAdoptItems(adoptInstance).length === 0);
// The adopted control already sits first on the plane, so the card's order already agrees.
// Dragging it below the older control must move it down on the card too.
const adoptedId = adopted[0];
tc.canvasUpsertCard(adoptInstance, { ...tc.canvasSnapshot().canvases[adoptInstance].cards[adoptedId], y: 900 }, true);
check(
  "adopted items take part in the canvas-order mapping",
  tc.canvasSyncBlockOrder(adoptInstance, adoptSource.id) === true &&
    tc.snapshotTaskCards().cards[adoptSource.id].blocks[0].kind === "heading" &&
    tc.snapshotTaskCards().cards[adoptSource.id].blocks[1].kind === "countdown"
);
// Multi-control cards stay plane-only: they are not "a control" to graft onto the card.
const multiId = tc.canvasAddControl(adoptInstance, "text", 700, 700);
tc.canvasUpsertCard(adoptInstance, { ...tc.canvasSnapshot().canvases[adoptInstance].cards[multiId], blocks: [{ kind: "text", text: "两行" }, { kind: "note", text: "第二行" }] }, true);
check("adoption skips multi-control items", tc.canvasAdoptItems(adoptInstance).length === 0);

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

// ---- any control can be added straight onto a canvas ----
check(
  "every offered kind can actually be created",
  tc.TASK_CANVAS_ADD_KINDS.length >= 18 &&
    tc.TASK_CANVAS_ADD_KINDS.includes("embed") &&
    tc.TASK_CANVAS_ADD_KINDS.includes("checklist") &&
    tc.TASK_CANVAS_ADD_KINDS.includes("bars") &&
    // images need real data, so they arrive by paste/drop instead of the menu
    tc.TASK_CANVAS_ADD_KINDS.includes("image") === false &&
    tc.TASK_CANVAS_ADD_KINDS.every((kind) => tc.sanitizeTaskBlocks([tc.taskBlockDefault(kind)]).length === 1) &&
    tc.canvasAddControl(tc.canvasCreate("菜单画布").id, "image", 10, 10) === null
);
const bareCanvas = tc.canvasCreate("控件画布");
const bareId = tc.canvasAddControl(bareCanvas.id, "checklist", 120, 80);
const bareItem = tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareId];
check(
  "a control can be added without a card around it",
  bareId !== null &&
    bareItem.bare === true &&
    bareItem.x === 120 &&
    bareItem.y === 80 &&
    bareItem.blocks.length === 1 &&
    bareItem.blocks[0].kind === "checklist" &&
    bareItem.blocks[0].items.length === 2 &&
    typeof bareItem.blocks[0].bid === "string" &&
    bareItem.title.indexOf("清单") === 0 &&
    bareItem.from === void 0
);
check(
  "bare controls survive persistence and can be duplicated",
  tc.sanitizeCanvasCard({ id: "cc-x", bare: true, blocks: [{ kind: "note", text: "n" }] }, "cc-x").bare === true &&
    tc.sanitizeCanvasCard({ id: "cc-y", blocks: [{ kind: "note", text: "n" }] }, "cc-y").bare === void 0
);
const bareCopyId = tc.canvasDuplicateCard(bareCanvas.id, bareItem);
check("a duplicated bare control stays bare", tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareCopyId].bare === true);
check(
  "editing a bare control replaces it in place",
  tc.canvasUpdateControl(bareCanvas.id, bareItem, { ...bareItem.blocks[0], items: [{ id: "a", label: "只剩一项" }, { id: "b", label: "第二项" }] }).ok === true &&
    tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareId].blocks[0].items.length === 2 &&
    tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareId].blocks[0].items[0].label === "只剩一项" &&
    tc.canvasUpdateControl(bareCanvas.id, bareItem, { kind: "embed", url: "javascript:alert(1)" }).ok === false
);
check(
  "a bare control can be wrapped back into a card and vice versa",
  tc.canvasSetBare(bareCanvas.id, tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareId], false) === true &&
    tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareId].bare === void 0 &&
    tc.canvasSetBare(bareCanvas.id, tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareId], true) === true &&
    tc.canvasSnapshot().canvases[bareCanvas.id].cards[bareId].bare === true
);
const bareHtml = renderToString(jsx(tc.CanvasControlView, {
  card: { id: "cc-1", title: "清单", bare: true, x: 10, y: 20, w: 340, blocks: [{ kind: "checklist", key: "k", bid: "blk-1", items: [{ id: "a", label: "A" }] }] },
  onMove: () => {}, onResize: () => {}, onEdit: () => {}, onChat: () => {}, onDelete: () => {},
  onWidgetState: () => {}, onBlockResize: () => {}, onDuplicate: () => {}, onBoard: () => {}, onToggleBare: () => {},
}));
check(
  "a bare control renders the control itself plus a hover toolbar",
  bareHtml.includes("dsh-tc-bare") &&
    bareHtml.includes("dsh-tc-bareTools") &&
    bareHtml.includes("dsh-tc-bareGrip") &&
    bareHtml.includes("清单") &&
    bareHtml.includes("dsh-tc-bareResize") &&
    // the control is rendered directly: no card header/body chrome
    bareHtml.includes("dsh-tc-cardHead") === false &&
    bareHtml.includes("dsh-tc-cardBody") === false &&
    bareHtml.includes("dsh-tc-check")
);
const quickHtml = renderToString(jsx(tc.TaskBlockQuickEdit, {
  block: { kind: "progress", label: "进度", value: 1, max: 3, bid: "blk-2" },
  onSave: () => {}, onCancel: () => {},
}));
check(
  "quick editor edits the simple field and offers raw JSON",
  quickHtml.includes("编辑控件 · 进度") &&
    quickHtml.includes("JSON 编辑") &&
    quickHtml.includes('value="进度"')
);
check("quick editor falls back to JSON for structural controls", renderToString(jsx(tc.TaskBlockQuickEdit, { block: { kind: "table", columns: ["A"], rows: [["1"]] }, onSave: () => {}, onCancel: () => {} })).includes("控件 JSON"));
const addPanelHtml = renderToString(jsx(tc.TaskCanvasView, { onClose: () => {} }));
check("canvas view offers the add-control entry", addPanelHtml.includes("+ 控件"));

// ---- canvas chat: describe a change, the [canvas] ops are applied to the plane ----
const chatSpec = tc.parseCanvasSpec('[canvas] { "ops": [ { "op": "add", "kind": "countdown", "label": "截止", "until": 4102444800000, "x": 40, "y": 30 }, { "op": "add", "kind": "embed", "url": "javascript:alert(1)" }, { "op": "note", "text": "已加上倒计时" } ] } [/canvas]');
check(
  "canvas ops parse from a [canvas] block",
  chatSpec !== null &&
    chatSpec.ops.length === 2 &&
    chatSpec.ops[0].op === "add" &&
    chatSpec.ops[0].block.kind === "countdown" &&
    chatSpec.ops[0].x === 40 &&
    // an invalid control (bad scheme) is dropped instead of reaching the plane
    chatSpec.ops[1].op === "note" &&
    chatSpec.ops[1].note === "已加上倒计时"
);
check("canvas ops parse from a fenced block", tc.parseCanvasSpec('```canvas\n{ "ops": [ { "op": "rename", "name": "新名字" } ] }\n```') !== null);
check("canvas ops reject junk", tc.parseCanvasSpec("no block here") === null && tc.parseCanvasSpec("[canvas] { not json } [/canvas]") === null && tc.parseCanvasSpec('[canvas] { "ops": [] } [/canvas]') === null);

const chatCanvas = tc.canvasCreate("对话画布");
const chatSeed = tc.canvasAddControl(chatCanvas.id, "progress", 100, 100);
const chatVictim = tc.canvasAddControl(chatCanvas.id, "note", 500, 500);
const chatSeedBlock = tc.canvasSnapshot().canvases[chatCanvas.id].cards[chatSeed].blocks[0];
const applied = tc.applyCanvasSpec(chatCanvas.id, {
  ops: [
    { op: "add", block: { kind: "checklist", key: "k", bid: "blk-chat-1", items: [{ id: "a", label: "A" }] }, x: 10, y: 20 },
    { op: "addCard", title: "对话新建卡", blocks: [{ kind: "note", text: "卡片里的说明" }], x: 400, y: 60 },
    { op: "update", id: chatSeed, block: { ...chatSeedBlock, label: "改过的进度", value: 2 } },
    { op: "move", id: chatSeed, x: 260, y: 140 },
    { op: "rename", name: "对话改过的画布" },
    { op: "remove", id: chatVictim },
    { op: "note", note: "都改好了" },
    { op: "remove", id: "cc-does-not-exist" },
  ],
});
const chatCanvasNow = tc.canvasSnapshot().canvases[chatCanvas.id];
check(
  "canvas ops are applied to the plane",
  applied.ok === true &&
    applied.changed === 6 &&
    applied.skipped === 1 &&
    chatCanvasNow.name === "对话改过的画布" &&
    chatCanvasNow.cards[chatSeed].x === 260 &&
    chatCanvasNow.cards[chatSeed].y === 140 &&
    chatCanvasNow.cards[chatSeed].blocks[0].label === "改过的进度" &&
    chatCanvasNow.cards[chatSeed].blocks[0].value === 2 &&
    chatCanvasNow.cards[chatVictim] === void 0 &&
    Object.values(chatCanvasNow.cards).some((item) => item.title === "对话新建卡") &&
    Object.values(chatCanvasNow.cards).some((item) => item.bare === true && item.blocks[0].kind === "checklist")
);
check(
  "canvas ops report what changed",
  applied.message.indexOf("新增控件 1") !== -1 &&
    applied.message.indexOf("新增卡片 1") !== -1 &&
    applied.message.indexOf("修改控件 1") !== -1 &&
    applied.message.indexOf("移动 1") !== -1 &&
    applied.message.indexOf("删除 1") !== -1 &&
    applied.message.indexOf("1 项无法应用") !== -1 &&
    applied.notes[0] === "都改好了"
);
const inventory = tc.canvasInventory(chatCanvasNow);
check(
  "the canvas prompt lists what is on the plane",
  inventory.indexOf("id=" + chatSeed) !== -1 &&
    inventory.indexOf("裸控件") !== -1 &&
    inventory.indexOf("对话新建卡") !== -1 &&
    inventory.indexOf("progress") !== -1 &&
    inventory.indexOf("x=260") !== -1
);
const chatPrompt = tc.composeCanvasChatPrompt({ canvasId: chatCanvas.id, canvas: chatCanvasNow }, "把进度挪到左上，再加一个倒计时");
check(
  "the canvas prompt teaches the operation list",
  chatPrompt.indexOf("【任务台画布编辑】") !== -1 &&
    chatPrompt.indexOf("[canvas]") !== -1 &&
    chatPrompt.indexOf("画布 id：" + chatCanvas.id) !== -1 &&
    chatPrompt.indexOf("把进度挪到左上") !== -1 &&
    chatPrompt.indexOf('"op": "addCard"') !== -1 &&
    chatPrompt.indexOf('"op": "move"') !== -1 &&
    chatPrompt.indexOf("id=" + chatSeed) !== -1
);
const chatDockHtml = renderToString(jsx(tc.CanvasChatDock, { canvas: chatCanvasNow, canvasId: chatCanvas.id, onApply: () => null }));
check(
  "the canvas chat dock is a narrow centred floating panel",
  chatDockHtml.includes("dsh-tc-canvasChat") &&
    chatDockHtml.includes("dsh-tc-canvasChatHead") &&
    chatDockHtml.includes("画布对话") &&
    chatDockHtml.includes("一句话改画布") &&
    chatDockHtml.includes("发送") &&
    // a floating overlay, centred horizontally above the bottom edge
    styleTags[0].textContent.includes(".dsh-tc-canvasChat{position:absolute;left:0;right:0;bottom:16px;margin:0 auto;z-index:40") &&
    styleTags[0].textContent.includes("width:340px") &&
    styleTags[0].textContent.includes("@keyframes dsh-tc-chat-in{from{opacity:0;transform:translateY(14px)}") &&
    styleTags[0].textContent.includes(".dsh-tc-canvasChatMini{width:auto;border-radius:999px}") &&
    styleTags[0].textContent.includes(".dsh-tc-chatPill{")
);
check(
  "the floating composer can collapse into a logo",
  styleTags[0].textContent.includes(".dsh-tc-seatMini{") &&
    styleTags[0].textContent.includes(".dsh-tc-miniToggle{") &&
    styleTags[0].textContent.includes(".dsh-tc-seatMini > .dsh-tc-miniToggle{display:flex!important") &&
    styleTags[0].textContent.includes("bottom:74px!important")
);
// A control removed through the canvas chat is removed from the card it maps.
const chatBoundCard = tc.applyTaskCardSpec({ op: "upsert", title: "对话绑定卡", blocks: [{ kind: "note", text: "会被删掉" }] });
const chatInstanceId = tc.canvasOpenInstance({ ...tc.snapshotTaskCards().cards[chatBoundCard.id], id: chatBoundCard.id });
const chatBoundItem = Object.values(tc.canvasSnapshot().canvases[chatInstanceId].cards).find((item) => tc.canvasCardBinding(item) !== null);
check(
  "removing an item through the canvas chat also removes its control",
  tc.snapshotTaskCards().cards[chatBoundCard.id].blocks.length === 1 &&
    tc.applyCanvasSpec(chatInstanceId, { ops: [{ op: "remove", id: chatBoundItem.id }] }).ok === true &&
    tc.snapshotTaskCards().cards[chatBoundCard.id].blocks.length === 0
);
tc.applyTaskCardSpec({ op: "delete", title: "对话绑定卡" });

// ---- page bridge: the agent can operate an embedded web app ----
check(
  "bridge target keys are stable and url-derived",
  tc.taskBridgeTarget("http://127.0.0.1:5199/") === tc.taskBridgeTarget("http://127.0.0.1:5199/") &&
    tc.taskBridgeTarget("http://127.0.0.1:5199/") !== tc.taskBridgeTarget("http://127.0.0.1:5200/") &&
    tc.taskBridgeTarget("http://a/").startsWith("t")
);
const bridgeSettings = tc.sanitizeTaskBridgeSettings({ url: "http://127.0.0.1:8790/", token: "abc", enabled: true });
check(
  "bridge settings sanitize",
  bridgeSettings.url === "http://127.0.0.1:8790" &&
    bridgeSettings.token === "abc" &&
    bridgeSettings.enabled === true &&
    tc.sanitizeTaskBridgeSettings({ url: "javascript:alert(1)", enabled: "yes" }).url === "http://127.0.0.1:8790" &&
    tc.sanitizeTaskBridgeSettings({ url: "javascript:alert(1)" }).enabled === false
);
const pageUrl = tc.taskBridgePageUrl("http://localhost:5199/app", { url: "http://127.0.0.1:8790", token: "tk", enabled: true });
check(
  "a controlled app is proxied through the bridge",
  pageUrl.src === "http://127.0.0.1:8790/p?url=" + encodeURIComponent("http://localhost:5199/app") + "&target=" + pageUrl.target + "&token=tk" &&
    pageUrl.target === tc.taskBridgeTarget("http://localhost:5199/app")
);
const pageSpec = tc.parsePageSpec('[page] { "actions": [ { "action": "click", "selector": "#buy" }, { "action": "type", "selector": "#q", "value": "dsh", "submit": true }, { "action": "read" }, { "action": "nope" }, { "action": "click" } ], "then": "确认订单是否出现", "summary": "下单" } [/page]');
check(
  "page actions parse and validate",
  pageSpec !== null &&
    pageSpec.actions.length === 3 &&
    pageSpec.actions[0].action === "click" &&
    pageSpec.actions[0].selector === "#buy" &&
    pageSpec.actions[1].submit === true &&
    pageSpec.actions[2].action === "read" &&
    pageSpec.actions.every((action) => tc.TASK_BRIDGE_ACTIONS.includes(action.action)) &&
    pageSpec.then === "确认订单是否出现" &&
    pageSpec.summary === "下单"
);
check(
  "page actions parse from a fence and reject junk",
  tc.parsePageSpec('```page\n{ "actions": [ { "action": "scroll", "y": 400 } ] }\n```') !== null &&
    tc.parsePageSpec('[page] { "actions": [ { "action": "click" } ] } [/page]') === null &&
    tc.parsePageSpec("no page block") === null &&
    tc.parsePageSpec('[page] { not json } [/page]') === null &&
    tc.parsePageSpec('[page] { "actions": [ { "action": "type", "value": "x" } ] } [/page]') === null
);
check(
  "action reports read like a human summary",
  tc.describeBridgeAction({ action: "click", selector: "#buy" }, { ok: true, value: { clicked: { tag: "button", text: "购买" } } }).includes("点击 #buy ✓") &&
    tc.describeBridgeAction({ action: "read" }, { ok: true, value: { title: "目标页", text: "主体文字" } }).includes("目标页") &&
    tc.describeBridgeAction({ action: "click", selector: "#x" }, { ok: false, error: "no-match" }).includes("✗ no-match") &&
    tc.describeBridgeAction({ action: "click", selector: "#x" }, { ok: false, error: "no-page" }).includes("网页未连上桥接")
);
const controlledBlocks = [
  { kind: "embed", url: "http://a.local/", control: true },
  { kind: "embed", url: "http://b.local/", control: false },
  { kind: "text", text: "x" },
];
check(
  "the controlled embed is the one that gets driven",
  tc.pickBridgeTarget(controlledBlocks, "") !== null &&
    tc.pickBridgeTarget(controlledBlocks, "").url === "http://a.local/" &&
    tc.pickBridgeTarget(controlledBlocks, "http://a.local/").url === "http://a.local/" &&
    tc.pickBridgeTarget(controlledBlocks, "http://b.local/") === null &&
    tc.pickBridgeTarget([{ kind: "embed", url: "http://c.local/" }], "") === null &&
    tc.collectBridgeTargets([controlledBlocks, [{ kind: "embed", url: "http://a.local/", control: true }]]).length === 1
);
const controlledCard = { title: "受控应用", blocks: [{ kind: "embed", url: "http://a.local/", title: "本地应用", height: 300, fill: false, control: true }] };
const controlledHtml = renderToString(jsx(tc.TaskUserBody, { card: controlledCard, onWidget: () => {} }));
check(
  "a controlled app embeds the bridge url and shows its state",
  controlledHtml.includes("http://127.0.0.1:8790/p?url=" + encodeURIComponent("http://a.local/")) &&
    controlledHtml.includes("dsh-tc-appBadge") &&
    controlledHtml.includes("受控 · ") &&
    controlledHtml.includes("target=" + tc.taskBridgeTarget("http://a.local/"))
);
check(
  "control survives a block round-trip and defaults off",
  tc.sanitizeTaskBlocks([{ kind: "embed", url: "http://a.local/", control: true }])[0].control === true &&
    tc.sanitizeTaskBlocks([{ kind: "embed", url: "http://a.local/" }])[0].control === false &&
    tc.taskEditorBlocks({ embeds: [{ url: "http://a.local/", control: true, title: "", height: 300, fill: false }] })[0].control === true
);
check(
  "the card editor exposes the control switch",
  renderToString(jsx(tc.TaskCardEditor, { initial: { id: "usr-e", title: "受控卡", pinned: false, blocks: controlledCard.blocks }, onSave: () => {}, onCancel: () => {} })).includes("受控")
);
check("the bridge panel renders its settings", renderToString(jsx(tc.TaskBridgePanel, { onClose: () => {} })).includes("网页桥接 · 让 agent 操作内嵌应用"));
const pagePrompt = tc.composeTaskCardChatPrompt({ id: "usr-p", title: "受控卡", blocks: controlledBlocks }, "帮我在页面里下单");
check(
  "the card prompt teaches the [page] protocol",
  pagePrompt.includes("[page]") &&
    pagePrompt.includes("http://a.local/") &&
    pagePrompt.includes("可操作的网页应用") &&
    pagePrompt.includes("click") &&
    pagePrompt.includes("read") &&
    pagePrompt.includes("then")
);
check("the prompt stays quiet without a controlled page", tc.composePagePromptSection([{ kind: "embed", url: "http://x.local/" }]) === "");
check(
  "page actions are refused while the switch is off",
  (await tc.runPageBlockFromReply('[page] { "actions": [ { "action": "read" } ] } [/page]', controlledBlocks)).summary.includes("网页操作已关闭")
);
tc.saveTaskBridgeSettings({ url: "http://127.0.0.1:8790", token: "", enabled: true });
check(
  "page actions without a matching app report why",
  (await tc.runPageBlockFromReply('[page] { "actions": [ { "action": "read" } ] } [/page]', [{ kind: "text", text: "x" }])).summary.includes("没有匹配的受控网页")
);
check(
  "page actions against an unreachable bridge fail loudly",
  (await tc.runPageBlockFromReply('[page] { "actions": [ { "action": "read" } ] } [/page]', controlledBlocks)).summary.includes("bridge-unreachable")
);
tc.saveTaskBridgeSettings(tc.freshTaskBridgeSettings());

// ---- plugin items: any plugin's UI on the canvas, addable and rebuildable ----
check(
  "plugin references sanitize like every other id",
  tc.sanitizePluginRef({ id: "dsh-plugin-tpt-chronicle" }).id === "dsh-plugin-tpt-chronicle" &&
    tc.sanitizePluginRef({ id: "@scope/pkg", title: "包名", height: 400 }).height === 400 &&
    tc.sanitizePluginRef({ id: "bad id!" }) === null &&
    tc.sanitizePluginRef({ id: "" }) === null &&
    tc.sanitizePluginRef(null) === null
);
check(
  "the embed global follows the DSH convention",
  // the convention drops the `dsh-plugin-` prefix, exactly like dsh-plugin-tpt-chronicle's
  // globalThis.__DSH_TPT_CHRONICLE__ that the chronicle card already mounts
  tc.pluginGlobalName("dsh-plugin-tpt-chronicle") === "__DSH_TPT_CHRONICLE__" &&
    tc.pluginGlobalName("@scope/pkg") === "__DSH_PKG__" &&
    tc.pluginBareName("@scope/dsh-plugin-thing") === "thing"
);
globalThis.__DSH_DEMO_PLUGIN__ = { mountEmbedded: () => {} };
globalThis.__CUSTOM_ENTRY__ = () => {};
globalThis.__DSH_DSH_PLUGIN_LEGACY__ = { mountEmbedded: () => {} };
globalThis.__DSH_TPT_CHRONICLE__ = { mountEmbedded: () => {} };
check(
  "embed entries are discovered by convention or by name",
  tc.findPluginEntry("demo-plugin", void 0) !== null &&
    tc.findPluginEntry("demo-plugin", void 0).name === "__DSH_DEMO_PLUGIN__" &&
    tc.findPluginEntry("whatever", "__CUSTOM_ENTRY__") !== null &&
    // the real plugin id resolves to the global its bundle actually publishes
    tc.findPluginEntry("dsh-plugin-tpt-chronicle", void 0) !== null &&
    tc.findPluginEntry("dsh-plugin-tpt-chronicle", void 0).name === "__DSH_TPT_CHRONICLE__" &&
    // a plugin that kept its prefix in the global still hosts
    tc.findPluginEntry("dsh-plugin-legacy", void 0) !== null &&
    tc.findPluginEntry("nope-plugin", void 0) === null
);
delete globalThis.__DSH_DEMO_PLUGIN__;
delete globalThis.__CUSTOM_ENTRY__;
delete globalThis.__DSH_DSH_PLUGIN_LEGACY__;
delete globalThis.__DSH_TPT_CHRONICLE__;
check(
  "the plugin picker lists client bundles and degrades without a manifest",
  Array.isArray(tc.listPluginCandidates()) && tc.listPluginCandidates().every((row) => typeof row.id === "string" && typeof row.url === "string")
);
globalThis.__DSH_BOOT__ = { entries: [{ id: "dsh-plugin-demo", url: "https://example.com/demo.js" }] };
const pluginCanvas = tc.canvasCreate("插件画布");
const pluginItemId = tc.canvasAddPlugin(pluginCanvas.id, { id: "dsh-plugin-demo", title: "演示插件", height: 420 });
const pluginItem = tc.canvasSnapshot().canvases[pluginCanvas.id].cards[pluginItemId];
check(
  "a plugin item lands on the canvas with its own size and revision",
  pluginItemId !== null &&
    pluginItem.plugin.id === "dsh-plugin-demo" &&
    pluginItem.title === "演示插件" &&
    pluginItem.h === 420 &&
    // a fresh item carries no revision: the bundle is loaded once and reused per item
    pluginItem.plugin.rev === void 0 &&
    pluginItem.blocks === void 0
);
const barePluginId = tc.canvasAddPlugin(pluginCanvas.id, { id: "dsh-plugin-demo" }, { bare: true, x: 10, y: 20 });
check("a plugin item can be bare (no card chrome)", tc.canvasSnapshot().canvases[pluginCanvas.id].cards[barePluginId].bare === true);
const pluginRebuilt = tc.rebuildHostedPlugin(pluginCanvas.id, tc.canvasSnapshot().canvases[pluginCanvas.id].cards[pluginItemId]);
const pluginRevOnce = tc.canvasSnapshot().canvases[pluginCanvas.id].cards[pluginItemId].plugin.rev;
const pluginRebuiltAgain = tc.rebuildHostedPlugin(pluginCanvas.id, tc.canvasSnapshot().canvases[pluginCanvas.id].cards[pluginItemId]);
const pluginRevTwice = tc.canvasSnapshot().canvases[pluginCanvas.id].cards[pluginItemId].plugin.rev;
check(
  "rebuilding a plugin item always moves its revision forward",
  pluginRebuilt === true &&
    pluginRebuiltAgain === true &&
    typeof pluginRevOnce === "number" &&
    // two rebuilds inside one millisecond must still differ, or the mounted UI stays put
    pluginRevTwice > pluginRevOnce
);
const pluginSpec = tc.parseCanvasSpec('[canvas] { "ops": [ { "op": "addPlugin", "id": "dsh-plugin-demo", "title": "演示", "height": 380 }, { "op": "addPlugin", "pluginId": "dsh-plugin-two", "bare": true }, { "op": "addPlugin", "id": "bad id" } ] } [/canvas]');
check(
  "canvas ops can add plugins and drop unusable references",
  pluginSpec !== null &&
    pluginSpec.ops.length === 2 &&
    pluginSpec.ops[0].op === "addPlugin" &&
    pluginSpec.ops[0].plugin.id === "dsh-plugin-demo" &&
    pluginSpec.ops[0].plugin.height === 380 &&
    pluginSpec.ops[1].plugin.id === "dsh-plugin-two" &&
    pluginSpec.ops[1].bare === true
);
const pluginApplied = tc.applyCanvasSpec(pluginCanvas.id, {
  ops: [
    { op: "addPlugin", plugin: { id: "dsh-plugin-three" }, x: 300, y: 90 },
    { op: "rebuild", id: pluginItemId },
    { op: "rebuild", id: "cc-missing" },
  ],
});
check(
  "plugin ops apply and report what they did",
  pluginApplied.ok === true &&
    pluginApplied.changed === 2 &&
    pluginApplied.skipped === 1 &&
    pluginApplied.message.includes("新增插件 1") &&
    pluginApplied.message.includes("重建插件 1") &&
    Object.values(tc.canvasSnapshot().canvases[pluginCanvas.id].cards).some((item) => item.plugin !== void 0 && item.plugin.id === "dsh-plugin-three")
);
const pluginRawApplied = tc.applyCanvasSpec(pluginCanvas.id, {
  ops: [
    // a programmatic caller passes the raw shape (no parser in between)
    { op: "addPlugin", id: "dsh-plugin-demo", title: "裸写法", height: 260, bare: true },
    { op: "addPlugin", plugin: "dsh-plugin-demo", y: 40 },
  ],
});
check(
  "addPlugin accepts both the parsed and the raw op shape",
  pluginRawApplied.ok === true &&
    pluginRawApplied.changed === 2 &&
    Object.values(tc.canvasSnapshot().canvases[pluginCanvas.id].cards).some((item) => item.plugin !== void 0 && item.title === "裸写法" && item.h === 260 && item.bare === true)
);
const pluginPrompt = tc.composeCanvasChatPrompt({ canvasId: pluginCanvas.id, canvas: tc.canvasSnapshot().canvases[pluginCanvas.id] }, "把工作时序插件放到画布上");
check(
  "the canvas prompt teaches plugin ops and lists candidates",
  pluginPrompt.includes('"op": "addPlugin"') &&
    pluginPrompt.includes('"op": "rebuild"') &&
    pluginPrompt.includes("可挂载的插件") &&
    pluginPrompt.includes("dsh-plugin-demo") &&
    pluginPrompt.includes("mountEmbedded")
);
delete globalThis.__DSH_BOOT__;
const pluginHostHtml = renderToString(jsx(tc.PluginHostView, { plugin: { id: "dsh-plugin-absent" }, dark: false }));
check(
  "the plugin host renders a node (and explains when an entry is missing)",
  pluginHostHtml.includes("dsh-tc-pluginHost") && (pluginHostHtml.includes("dsh-tc-pluginFailed") || pluginHostHtml.includes("dsh-tc-pluginNode"))
);
check("the canvas bar offers the plugin picker", renderToString(jsx(tc.TaskCanvasView, { onClose: () => {} })).includes("插件"));

const canvas = tc.canvasCreate("测试画布");
const published = tc.canvasPublishCard({ title: "源卡", blocks: [{ kind: "text", text: "hi" }] });check(
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
