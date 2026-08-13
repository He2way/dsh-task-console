// Smoke test for the dsh-task-console client bundle.
// Loads lib/client.js in a stubbed browser-ish environment and renderToString()s
// the overlay root + back panel with fixture session state.
// Run: npm test   (needs `npm i` once for react/react-dom devDependencies)
import { readFileSync, existsSync } from "node:fs";
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
  body: { hasAttribute: () => false },
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
  ["session title", "测试会话 · 重构文档"],
  ["cwd path", "D:\\projects\\demo"],
  ["live job row", "运行测试套件"],
  ["failed job status", "权限不足"],
  ["job duration ticks", "分"],
  ["subagent row", "研究助手"],
  ["reset button", "复位卡片"],
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

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILURES`);
process.exit(failed === 0 ? 0 : 1);
