# Changelog / 变更记录

All notable changes to `dsh-task-console` are recorded here. Versions follow `package.json`.

本文件记录 `dsh-task-console` 的版本变更，版本号与 `package.json` 一致。

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
