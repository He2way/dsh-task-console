# Changelog / 变更记录

All notable changes to `dsh-task-console` are recorded here. Versions follow `package.json`.

本文件记录 `dsh-task-console` 的版本变更，版本号与 `package.json` 一致。

## v0.13.0

- **Drag the embedded app to resize it / 内嵌网页可拖动调整大小**: every embedded web app now has a **grip on its bottom edge** — drag it up or down and the frame follows your pointer (rAF + inline height, no React render per move); the live pixel value is shown in a small chip while dragging, and the new height is **committed once on release** and persisted on that block (`height`), broadcast to collaborators when the card is on the canvas. `fill` apps show no grip: they follow the card's own bottom-right resize handle.
  - **Layout pixels, not screen pixels**: the gesture reads `offsetHeight` and derives the current scale from `rect / offset`, so a drag inside the **zoomed infinite canvas** (20 %–250 %) converts screen pixels back to layout pixels correctly (verified: 120 screen px at 1.5× → exactly +80 layout px), and it is immune to the card's entry animation transform.
  - **Fixed a real layout bug found by that check**: `.dsh-tc-appWrap` carried `flex: 1`, so a configured height was ignored (a 320px app painted as ~150px) and squeezed when the card was tight. The wrap is now `flex: none` in fixed mode (height is exact, the card body scrolls if the content no longer fits) and only `fill` mode opts into `flex: 1`.
- **Tests**: `smoke.mjs` asserts the grip renders for fixed-height apps (and not for `fill`), and covers `patchTaskEmbedHeight` (clamping, no-op/fill/non-embed/bad-index rejection, immutability, round-trip through `sanitizeTaskBlocks`). `npm run verify:embed` now **replays the real gesture** in headless Chrome (`pointerdown` → `pointermove` → `pointerup`) and asserts the board card grew 220 → 360 with exactly one commit, plus the scaled-plane case (1.5× → 200 → 280 committed), and screenshots the result.
- **内嵌网页大小可拖动调整**：内嵌应用下边缘新增拖动条，上下拖动即可改高度，跟手实时预览并显示当前像素值，松手一次性提交并持久化到该控件的 `height`（画布卡片会广播给协作者）；`fill` 模式不显示拖动条，改高度用卡片右下角手柄。手势按**布局像素**计算（`offsetHeight` + `rect/offset` 求缩放比），因此在缩放画布（0.2–2.5 倍）里拖动同样准确，也不受卡片入场动画 transform 影响；顺带修掉一个真实布局 bug——固定高度此前被 `flex:1` 覆盖/挤压（320px 实际只画出约 150px），现在高度严格等于设定值。

## v0.12.0

- **Cards can associate other web apps / 卡片关联内嵌网页应用**: a new declarative `embed` control puts another web application inside a card as a sandboxed frame — `{ "kind": "embed", "url": "http://localhost:5173", "title": "本地应用", "height": 320, "fill": false }`.
  - **Authoring**: the manual editor (`✎`) gained an **内嵌网页应用** section (address, name, height px, 填满卡片, `↗` test-open, remove; up to 4 per card) with inline validation, and the `💬` card conversation knows the control, so you can just say “新建一张卡片，内嵌 http://localhost:5173”.
  - **Layout**: fixed height (120–1200px, default 300) or `fill: true` to take the card's remaining height — resize the card and the app grows with it, so one card can be a whole app window. Apps mix freely with text/buttons/other controls (the block column becomes a flex track when a `fill` app is present).
  - **App bar**: every embedded app gets a small bar (status dot, name, host, `↻` reload, `↗` new tab, `⧉` copy address) — a blank frame usually means the site refuses framing (`X-Frame-Options`/CSP), and `↗` is the escape hatch.
  - **Security**: only absolute `http(s)` URLs survive sanitization (`javascript:`, `data:`, `file:`, `blob:`, scheme-relative and scheme-less inputs are dropped) and the URL is normalized through `new URL()`; frames load with `sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-presentation"` — never `allow-top-navigation`, so an embedded app cannot navigate the workbench away. A **same-origin** address (this GUI itself) is re-framed with an opaque origin instead, so the embedded copy cannot script the app it lives in. Frames use `referrerpolicy="no-referrer"` and `loading="lazy"`, and embeds travel with the card when it is published to the canvas or shared into a collaboration room.
  - **Tests**: `smoke.mjs` covers URL allow-listing/normalization, height clamping, protocol parsing (unsafe URLs dropped), SSR of the app bar + sandbox attributes + `fill` layout, the editor rows, `taskEditorBlocks` and the refactor prompt; `npm run verify:embed` (`tools/verify-embed-browser.mjs`) mounts real cards in headless Chrome against a local app and asserts 3 apps / 3 frames / 1 fill / sandboxed frames, then screenshots the result.
- **卡片可以关联内嵌其它网页应用**：新增 `embed` 控件，把别的网页应用放进卡片。`✎` 编辑器新增「内嵌网页应用」区（地址 / 名称 / 高度 / 填满卡片 / ↗ 测试打开 / 删除，每卡最多 4 个，地址非法会当场报错），`💬` 对话和 `[taskcard]` 协议同样支持（说一句“新建一张卡片，内嵌 http://localhost:5173”即可）。高度可固定（120–1200，默认 300），也可 `fill: true` 铺满卡片剩余高度——把卡片拖大，应用跟着变大，一张卡就是一个应用窗口；应用可与文字 / 按钮等控件混排。每个应用自带小工具条：`↻` 重新加载、`↗` 新标签打开、`⧉` 复制地址；站点禁止被嵌入（X-Frame-Options/CSP）时画面空白，用 `↗` 打开即可。安全上只接受 http/https 绝对地址（`javascript:` / `data:` / `file:` / `blob:` 一律丢弃，地址经 `new URL()` 规范化），iframe 沙箱**不含** `allow-top-navigation`（应用无法把工作台导航走），同源地址改用不透明源加载，避免内嵌的自己脚本化工作台；发布到画布 / 分享到协作房间时内嵌应用随卡片一起走。

## v0.11.0

- **Right-hand architecture diagram / 右侧项目逻辑框图**: `🗺 框图` in the board header docks the project's own architecture diagram against the right edge of the task board. Drag the dock's left edge to resize it (380px – viewport, persisted in `dsh.taskconsole.dockwidth.v1`), `新标签打开` opens the same artifact full-screen in a new tab, `关闭` puts it away. The embedded artifact stays fully interactive inside the dock (zoom, node details, light/dark, guided views, export).
- **Ships inside the bundle**: `docs/architecture.html` (the archify artifact, ~640KB) is gzipped (~114KB) and base64-embedded in `lib/client.js` by `tools/embed-diagram.mjs`; the dock decodes it **lazily on first open** with `DecompressionStream`, caches it for the session, and shows an explicit message instead of a broken frame on browsers without it. The frame runs with `sandbox="allow-scripts allow-downloads allow-modals allow-popups"` (opaque origin), so the artifact cannot touch the app's DOM or storage.
- **Generated from repository evidence**: `docs/architecture.json` is the typed archify spec (11 components, 11 connections, 3 note cards) validated and delivered with `archify validate` / `archify deliver --quality showcase --repo-root .`; the repository references in the diagram were verified against the sources.
- **Tests**: `smoke.mjs` now decodes the embedded payload, re-computes its sha256 and asserts it equals both `docs/architecture.html` and the embedded `TASK_DIAGRAM_SHA256` (so a stale embed fails), SSR-renders the dock (sandbox attributes, artifact size label, width clamp) and checks the header toggle. `npm run verify:diagram` (`tools/verify-diagram-browser.mjs`) goes one step further and loads the payload in headless Chrome — proving `DecompressionStream` decodes it byte-identically (sha256 match), that the artifact renders inside the iframe (22 nodes / 22 edges / 4 scripts) and that the sandboxed frame loads with an opaque origin; it skips cleanly when no Chrome is installed.
- **页面右侧显示项目逻辑框图**：面板顶部 `🗺 框图` 在任务控制台右侧停靠 archify 生成的架构图；约 640KB 的产物 gzip 后内嵌在单文件 bundle 中，首次打开时解压并缓存，在沙箱 iframe 里保持可交互（缩放 / 点击节点 / 明暗 / 导出）；拖左边缘可改宽度并记住，`新标签打开` 可全屏查看。`npm test` 会校验内嵌内容与 `docs/architecture.html` 的长度与 sha256 完全一致。

## v0.10.0

- **Fullscreen infinite canvas**: `🖼 画布` opens a pannable/zoomable plane (wheel zoom anchored at the pointer, 20 %–250 %, drag empty space to pan, `复位视图`). Panning/zooming write the plane `transform` directly and commit the view once the gesture idles, so the canvas stays off the React render path.
- **Publish as a copy**: `📤` on a user card copies its title, control blocks and style into an **independent canvas card** near the current viewport. Canvas cards drag by the header, resize from the corner, and keep `✎` manual editing, `💬` agent refactor and per-card widget state (the refactor pipeline now takes an `applySpec` hook so it can target canvas cards instead of the board store).
- **Named canvases + share string**: multiple canvases with rename/switch/delete, persisted in `localStorage` and mirrored across same-browser windows through `storage` events. `复制分享串` emits `DSHCANVAS1:<base64url>` carrying relay URL + canvas id + name + optional token; `协作 → 加入` adopts it.
- **Images**: drop or paste an image onto the canvas — it is downscaled to a bounded JPEG and stored as a new declarative `image` control (`src`, `caption?`, `alt?`; only `https`/`http`/`data:image/*` accepted, ≤ 700 KB data URL).
- **Zero-dependency relay** (`relay/server.mjs`, `npm run relay`): WebSocket rooms per canvas id, snapshot on join, op broadcast, presence, heartbeat, debounced snapshot persistence to `--data/<canvasId>.json`, optional shared `--token`. The client sync layer reconnects with backoff, queues ops while offline and merges conflicts last-writer-wins per card (`updatedAt`, then `rev`); oversized content stays local with a hint. `relay/smoke.mjs` (`npm run test:relay`) covers the real handshake, snapshot, broadcast, presence and token rejection.
- **无限画布与协作**：看板 `🖼 画布` 打开全屏无限画布（滚轮以指针为锚缩放、拖空白平移、复位视图），平移缩放直接写 `transform` 并只在手势空闲时提交，不进入 React 渲染路径；用户卡片 `📤` 发布独立副本到画布（可拖动/缩放/手动编辑/💬 对话重构/保留交互状态，agent 重构新增 `applySpec` 挂钩以作用于画布卡片）；支持多命名画布（重命名/切换/删除，`localStorage` 持久化并跨同浏览器窗口用 `storage` 事件同步）；`复制分享串` 生成 `DSHCANVAS1:` 分享串（中继地址+画布 id+名称+可选 token），`协作 → 加入` 粘贴即接入；画布可拖拽/粘贴图片（压缩为受限 JPEG，作为新的 `image` 控件）；仓库自带零依赖中继 `relay/server.mjs`（按画布房间、入房快照、操作广播、在线状态、心跳、快照落盘、可选 `--token`），客户端带重连退避与离线队列，冲突按卡片“最后写入获胜”（`updatedAt`，再比 `rev`），超限内容仅本地保存并提示。

## v0.9.3

- Removed the `⚡ 低特效` toggle again (it is not wanted); the board keeps its glass look.
- Fixed the "all cards brighten while dragging" bug: the interaction rule no longer restyles every card. Only the card being moved/sized changes (it drops its `backdrop-filter` and gets a slightly denser background); all other cards keep their exact normal appearance.
- Drag is now **render-free from grab to release**: grabbing no longer re-orders React state (the card is raised with a direct inline `z-index`), so the board does not re-render at pointer-down; the order/position commit happens once on release. `transition` and `backdrop-filter` are also cleared inline on the busy card for the very first frames instead of waiting for a class-driven style pass.
- Added `pointercancel` handling for both gestures, so an interrupted pointer can no longer leave the interaction state (and its styling) stuck on.
- 按你的要求**移除「低特效」开关**；修复拖拽时“所有卡片发亮”：交互规则不再统一改所有卡片样式，只有被拖动/缩放的卡片临时去掉毛玻璃并略微加深底色，其余卡片外观完全不变；抓取到松手全程**不触发 React 渲染**（置顶改为直接写 `z-index`），松手才提交位置/尺寸与持久化；busy 卡片从第一帧起就用内联样式清掉 `transition` 与 `backdrop-filter`；补充 `pointercancel` 兜底，避免指针中断后状态与样式卡住。

## v0.9.2

- Root-caused the remaining drag stutter to **compositing, not React**: every card carried `backdrop-filter: blur(18px)` and sampled the whole page (including the rotated app behind the board), so each pointer frame re-blurred the board. Fixes:
  - the board panel now forms its own backdrop root (`contain: paint`), so card blur only samples the board surface;
  - once the flip settles the rotated front face is culled with `visibility: hidden` + `content-visibility: hidden`, freeing its compositor layers and layout;
  - while a gesture runs, **all** cards drop their `backdrop-filter` and go opaque (restored on release), and the dragged card keeps `will-change: transform`;
  - card bodies are memoized, so session streaming / commit re-renders no longer rebuild every card's control tree;
  - new **⚡ 低特效** board-header toggle (persisted in `localStorage`) disables card glass blur, the panel's ambient animations and the card entrance animation for low-power machines.
- 继续修复拖拽卡顿，根因改判为**合成开销**而非 React：每张卡片的 `backdrop-filter` 会重采样整页（含翻到背面、仍被渲染的整个 App）。修复：看板面板加 `contain:paint` 自成 backdrop root；翻面结算后把正面用 `visibility/content-visibility:hidden` 摘出合成与布局；手势期间**所有**卡片临时关闭毛玻璃并改为不透明（松手恢复），拖拽卡片保留 `will-change`；卡片内容组件 memo 化，流式/提交引起的重渲染不再重建每张卡；新增看板头部 **⚡ 低特效** 开关（持久化），一次性关掉卡片毛玻璃、环境动画与入场动画。

## v0.9.1

- Fixed card drag/resize jank. Gestures no longer write React state per `pointermove`: the card moves on the compositor (`transform`) or resizes through inline width/height inside a `requestAnimationFrame`, board metrics are read once per gesture, and the board commits state + `localStorage` exactly once on release. `transition` is suspended on the busy card so the movement never lags behind the pointer, `will-change`/layout containment are applied, and the ambient board animation pauses for the duration.
- Removed the board-wide 1s re-render: the jobs card now owns its own 1s duration clock, so idle boards stop re-rendering every card.
- Cut idle DOM work: the `[taskcard]` watcher reads only the newest rows (older rows are visited once), and skips ticks while the tab is hidden or a gesture is running; the floating transcript reads only its tail rows.
- 修复拖拽/缩放卡顿：手势期间不再逐帧写 React state（合成器 transform + rAF，松手时一次性提交并持久化），暂停拖拽卡片的 transition 并加 `will-change`/布局隔离，交互期间暂停看板环境动画；任务卡的 1 秒计时移入卡片自身，空闲时不再整板重渲染；`[taskcard]` 监听只读最新行、后台标签页或手势期间跳过，悬浮窗转录只读末尾几行。

## v0.9.0

- Cards are now **mouse-resizable**: drag the bottom-right handle to resize any card (220–900 px wide, 120–1200 px tall, clamped to the board). The size persists per card in `localStorage` and survives reloads; a manual size supersedes the `style.width` preset (dragging drops that preset so the size sticks). Collapsed cards hide the handle and return to auto height.
- 卡片支持**鼠标拖动右下角缩放**（宽 220–900、高 120–1200，随板边界钳制），尺寸按卡片持久化并随刷新保留；手动尺寸优先于 `style.width` 预设（拖动时移除该预设）；折叠时隐藏手柄并回到自适应高度。

## v0.8.2

- Extended the declarative control catalog with `table`, `code`, `toggle`, `countdown` and `bars` (on top of `text`, `heading`, `note`, `stats`, `progress`, `trend`, `kv`, `links`, `chips`, `checklist`, `counter`, `button`).
- Refactor pipeline hardened: the temporary helper is now a **blank session** created through `sessions.create` in the source session's workspace (neither history nor agent inbox inherited); `session.fork` remains the fallback, and that path clears inherited queue items / cancels a stale open turn before prompting. The helper is opened for its event window and the reply is read from `assistant/message` events plus streaming deltas, accepted only after the instruction has landed as a user message — otherwise the popup degrades to the main session instead of idling.
- Repository tidy: README control/style catalogs aligned with the implementation, a release changelog and an `npm run check` syntax script for the shipped bundle.
- 控件目录扩展 `table` / `code` / `toggle` / `countdown` / `bars`；临时 helper 改为 `sessions.create` 空白会话（fork 兜底并清理遗留队列/回合），回复从事件窗口读取；补齐变更记录与 `npm run check`。

## v0.7.0

- The card `💬` conversation now **calls a temporary agent session** (`sessions.fork` + `session.prompt`) instead of posting into the main conversation: the popup streams the helper agent's reply, applies its `[taskcard]` block directly, and archives the helper with `workspace.archiveSession`.
- Graceful fallback to the main-session channel when the agent services are unavailable.
- 卡片 `💬` 对话改为调用临时 agent 会话（fork + prompt），弹窗流式回显并直接应用 `[taskcard]`，结束后归档；不可用时回退主会话。

## v0.6.0

- New `trend` control: sparkline-style line + area chart (2–48 points), tinted by the card accent color.
- 新增 `trend` 趋势图控件，随卡片强调色着色。

## v0.5.0

- `+ 新建卡片` now creates a blank draft card and **auto-opens the conversation popup at the top-right**; the popup itself is anchored top-right.
- Declarative card `style`: `accent` / `width` / `density` / `icon` with allow-list validation.
- 新建卡片改为「先建草稿 + 自动弹右上角对话」；新增卡片整体样式 `style` 白名单。

## v0.4.0

- Card-level `💬` chat popup: modify a card's content by describing it in natural language.
- 卡片头部 `💬` 对话修改入口。

## v0.3.0

- Card content became a declarative control list: `text` / `heading` / `note` / `stats` / `progress` / `kv` / `links` / `chips` / `checklist` / `counter` / `button`.
- Interactive widget state (checked items, counters) persists per card and per stable `key`.
- `fill` button action writes text into the main composer for review before sending.
- Unknown control kinds keep their original fields and upgrade automatically once supported.
- 卡片内容升级为控件目录；交互状态持久化；未知控件保留原始字段并可自动升级还原。

## v0.2.0

- User cards: add / edit / pin / collapse / delete, while the five built-in cards stay read-only; state persists in `localStorage`.
- The `[taskcard]…[/taskcard]` protocol: settled conversation messages that carry one are watched and applied live (create / update / delete), deduplicated by content hash.
- 自定义悬浮卡片与 `[taskcard]` 卡片协议。

## v0.1.0

- First release: the flip-page glass task console — session overview, background jobs, subagents, workspace and plugin management cards, draggable glassmorphism cards and the unified floating composer.
- 首个版本：一体两面翻页任务控制台与统一悬浮输入窗。
