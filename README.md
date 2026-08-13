# dsh-task-console

A [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) client plugin: a floating glass **task console** for the current session. Click the glass button in the bottom-right corner and the page "flips" to its back — a frosted-glass board with mouse-draggable cards showing live background jobs, subagents, a session overview and the workspace.

一个 DeepSeek Harness (DSH) 客户端插件：为当前会话提供悬浮毛玻璃「任务控制台」。点击右下角的玻璃按钮，页面翻到背面 —— 一块毛玻璃面板上悬浮着可鼠标拖拽的卡片，实时展示后台任务、子代理、会话概览与工作区。

## Features / 功能

- **Flip to the back / 翻面到背面** — a floating glass toggle (`⇄ 任务台`, fixed bottom-right) opens a full-screen frosted-glass panel with a 3D flip-in animation; `返回会话` or `Esc` flips back.
- **Live current-session data / 当前会话实时数据**（来自 DSH 的 `useSessions` 标准数据源）:
  - **会话概览 Session** — title, running/idle, phase, origin, live job & subagent counts.
  - **后台任务 Jobs** — live background jobs: status dot, kind chip, label, status, ticking durations (live jobs first).
  - **子代理 Subagents** — the session's subagent catalog: child/fork, running/idle, id.
  - **工作区 Workspace** — cwd, session id, last update time.
- **Draggable glassmorphism cards / 可拖拽毛玻璃卡片** — hold a card header and drag (pointer capture, clamped to the board); cards raise to front while dragging; each card can be collapsed or hidden; positions/state persist in `localStorage` (`dsh.taskconsole.v1`); `复位卡片` resets the layout.
- **Theme aware / 明暗主题自适应** — follows the DSH theme (`data-ds-dark-theme`), respects `prefers-reduced-motion`.

## Install / 安装

Requires a DSH profile (default: `web`). The package declares `dsh.bundle`, so `dsh plugin` wires it into the profile's bundle list automatically — no manual patch editing.

需要 DSH profile（默认 `web`）。本包声明了 `dsh.bundle`，`dsh plugin` 会自动把它加入 profile 的 bundle 列表，无需手动改 patch。

### From npm / 从 npm 安装（发布后）

```bash
dsh plugin --profile web add dsh-task-console
```

### From GitHub / 从 GitHub 安装

```bash
dsh plugin --profile web add git+https://github.com/He2way/dsh-task-console.git
```

> If pnpm blocks the build of a git-hosted dependency, add the exact key pnpm prints under `allowBuilds` in `$DSH_HOME/profiles/web/pnpm-workspace.yaml`, then re-run.
> 若 pnpm 阻止 git 依赖的构建，把 pnpm 打印的 key 加到 `$DSH_HOME/profiles/web/pnpm-workspace.yaml` 的 `allowBuilds` 下，再重跑一次。

Then restart the `dsh web` process (or reload the profile) so the new loader row mounts and the browser bundle is composed into `window.__DSH_BOOT__`. Hard-refresh the page (Ctrl+Shift+R).

然后重启 `dsh web` 进程（或重新加载 profile）使新 loader 行挂载、浏览器 bundle 进入启动清单，最后强制刷新页面（Ctrl+Shift+R）。

## Usage / 用法

1. Click the floating glass button `⇄ 任务台` (bottom-right).
2. The page flips to the back — the glass task console for the current session.
3. Drag cards by their headers; use `▴/▾` to collapse, `×` to hide a card.
4. `复位卡片` restores the default layout; `返回会话` / `Esc` flips back to the chat.

## How it works / 工作原理

- The browser half registers as an occupant of the `shell.overlay` slot (the documented additive seat for a frame-wide floating surface). The overlay layer is click-through; the console opts back into pointer events only on its own surfaces.
- Session state comes from the standard `useSessions` prop the slot framework provides to every occupant.
- The node half is an empty `apply()` stub so the plugin appears in the host Loader (standard for pure-UI client plugins).

## Development / 开发

No build step — `lib/client.js` is both source and shipped bundle (ModuleLoader format, zero dependencies beyond React).

```bash
npm i        # react + react-dom for the smoke test
npm test     # smoke.mjs: SSR-renders the components with fixture state
```

## License / 许可证

MIT © He2way
