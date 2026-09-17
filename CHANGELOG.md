# Changelog / 变更记录

All notable changes to `dsh-task-console` are recorded here. Versions follow `package.json`.

本文件记录 `dsh-task-console` 的版本变更，版本号与 `package.json` 一致。

## v0.23.0

- **The agent can operate an embedded web page / 让 agent 操作内嵌网页**: an embedded app can now be marked **受控** (controlled), and the workbench — and therefore the agent — can really click, type, scroll and read inside it. The missing piece was architectural: a cross-origin iframe is opaque to its parent, so no amount of client code could act on it. The repo now ships a **local page bridge** (`bridge/server.mjs`, zero dependencies) that closes the gap:
  - `GET /p?url=…&target=…` proxies the target page and **injects an agent script** into it; that script opens a WebSocket back to the bridge and executes commands *inside the page* (its own origin), so the plugin never needs script access it should not have.
  - Commands: `read` (title, body text, and the visible form fields), `query`, `click` (by CSS selector **or by button text**), `type` (+ `submit`), `press`, `select`, `check`, `scroll`, `wait`, `eval`, `back`, `forward`, `reload` — each returning a JSON result, with per-command timeouts and `no-page`/`timeout` answers instead of hangs.
  - **Agent loop**: the card and canvas prompts now list the controlled apps and teach a `[page]` block — `[page] { "actions": [ … ], "then": "…" } [/page]` — which the workbench executes after applying the reply, reports in the chat log (`读取内容 ✓ 「标题」…；点击 #buy ✓ 「购买」`), and optionally hands back to the agent through `then` for a second round. Page actions can be mixed with `[taskcard]`/`[canvas]` blocks in the same reply.
  - **Workbench UI**: `🌉 桥接` in the board header holds the bridge URL / token / the `允许 agent 操作网页` switch (the safety gate, off by default) plus a connection test; every controlled app shows a live badge (`受控 · 已连接` / `桥接离线` / `未连上`), and the card editor has the `受控` checkbox next to `填满`.
  - **Several frames, one page**: a target keeps every live frame socket (a board card plus its canvas copy plus a fullscreen overlay can all show the same app); a command is broadcast to all of them and the first answer wins — this also fixed a connection war where each new frame evicted the previous one.
  - **Safety**: the bridge is loopback-only by default, supports a bearer `--token`, an `--allow` host allow-list and a response size cap; the `允许 agent 操作网页` switch gates execution, and nothing runs unless a page is embedded with `受控` on. It is a local tool: whatever the page itself can do, the bridge can do inside that page.
- **Tests**: `bridge/smoke.mjs` (`npm run test:bridge`) covers the proxy (injection, framing headers dropped, non-HTML passthrough, token gate, URL validation, allow-list) and the WebSocket hub (page registration, host→page routing, results, `no-page`, timeout, multi-frame targets, disconnect broadcast). `smoke.mjs` covers the client protocol (target keys, settings sanitize, proxied URL, `[page]` parsing/validation, action summaries, the controlled-app picker, the badge markup, the editor switch, the enable gate, the bridge panel and the prompt teaching). `npm run verify:embed` now drives the **real** path in Chromium over the DevTools protocol (real time, no virtual clock): it embeds a controlled app, waits for the injected agent, runs a `[page]` action list — two clicks and two reads — and asserts the page itself reports `点击 2 次`, with the badge reading `受控 · 已连接`.
- **让 agent 操作内嵌网页**：内嵌应用现在可以勾选 **受控**，工作台与 agent 就能真的在里面点击 / 输入 / 滚动 / 读取。原先做不到的根因是架构性的——跨源 iframe 对父页面不透明，客户端怎么写都动不了它。仓库因此新增**本机页面桥接**（`bridge/server.mjs`，零依赖）：`/p` 代理目标网页并**注入受控脚本**，脚本用 WebSocket 连回桥接、在页面自己的源里执行命令，插件不需要任何越权脚本能力。可用动作：`read`（标题 / 正文 / 可见输入框）、`query`、`click`（CSS 选择器**或按钮文字**）、`type`（可 `submit`）、`press`、`select`、`check`、`scroll`、`wait`、`eval`、`back`/`forward`/`reload`，每条都返回 JSON，并有超时与 `no-page` 兜底。对话侧新增 `[page]` 协议：卡片与画布提示词会列出受控应用并教 agent 输出 `[page] { "actions": [ … ], "then": "…" } [/page]`，执行后在对话记录里汇报（如 `读取内容 ✓ …；点击 #buy ✓ 「购买」`），并用 `then` 把观察结果回灌给 agent 继续下一轮；可与 `[taskcard]` / `[canvas]` 同回复混用。工作台头部新增 `🌉 桥接` 面板（地址 / 令牌 / **允许 agent 操作网页** 开关，默认关闭，作为安全闸门）与连通性测试，受控应用上有实时徽章，卡片编辑器里 `受控` 就在 `填满` 旁边。另修复：同一页面在多个框架（卡片 + 画布副本 + 全屏）同时显示时新框架会驱逐旧框架造成连接风暴——现在同一 target 保留所有活跃框架，命令广播、先答者胜。安全上：桥接默认只监听回环、支持 `--token` 与 `--allow` 主机白名单、限制响应体大小，且必须页面勾选 `受控` + 面板打开开关才会执行。

## v0.22.0

- **Published to the DSH plugin market / 发布到 DSH 插件市场**: the plugin is submitted to the curated registry behind the community plugin markets (`awesome-dsh-plugin`, which feeds `dsh-market` and the storefronts) as `He2way/dsh-task-console`, category **ui**, with a prebuilt tarball attached to the GitHub release so one-click installs skip the build-approval step.
  - **Live on npm**: [`dsh-task-console@0.22.0`](https://www.npmjs.com/package/dsh-task-console) (published 2026-09-17, `latest`, 23 files, 1.7 MB tarball, `repository` pointing back at this repo so the markets can link the package and show download counts). Verified after publishing by re-downloading the tarball from the registry and comparing `lib/client.js` — byte-identical to the repository.
  - Repository metadata brought in line with the submission rules: the **`dsh-plugin` topic** is set, `dsh.bundle` + `cordis.patch.yml` are in place (what makes `dsh plugin add` work), the repo is well past the 1-day age bar, and the description now states what the plugin actually does.
  - `screenshots.json` declares two real UI screenshots (`docs/screenshots/canvas-and-chat.png`, `embedded-web-apps.png`, both generated from the headless-browser verification runs), which the markets show AppStore-style on the detail page.
  - `engines.dsh` now declares the tested harness range (`>=0.1.5-rc.1 <0.2.0-0`) so host-aware catalog filters can compare against the running DSH.
  - Install paths for users: `dsh plugin --profile web add dsh-task-console` (npm, once published), the GitHub release tarball, or the repository spec.
- **发布到 DSH 插件市场**：本项目已提交到社区插件市场背后的精选列表（`awesome-dsh-plugin`，dsh-market 及各商店的数据源），条目为 `He2way/dsh-task-console`，分类 **ui**，并在 GitHub Release 上附带预构建 tarball，让一键安装无需构建授权。仓库元数据也按投稿规则对齐：已设置 **`dsh-plugin` topic**、`dsh.bundle` 与 `cordis.patch.yml` 齐备（这是 `dsh plugin add` 可安装的前提）、仓库年龄远超 1 天门槛，描述也改成如实说明功能。新增 `screenshots.json` 声明两张真实界面截图（`docs/screenshots/canvas-and-chat.png`、`embedded-web-apps.png`，均由 headless 浏览器验证流程生成），市场会在详情页以 App Store 风格展示。`engines.dsh` 声明了实测的 harness 版本范围（`>=0.1.5-rc.1 <0.2.0-0`），便于市场做宿主兼容性判断。

## v0.21.0

- **The canvas chat is centred / 画布对话框居中**: the floating panel now sits **horizontally centred 16px above the bottom edge** (`left:0; right:0; margin:0 auto`) instead of pinned to the right corner, so it reads like a command bar under the plane; its mini pill centres itself too, and the entry animation is now a short rise from the bottom (`translateY(14px)`) instead of a sideways slide that would fight the centring.
- **Tests**: `smoke.mjs` asserts the centred floating contract (`left/right:0`, `margin:0 auto`, `bottom:16px`, `width:340px`, the rise animation, the pill rule). `npm run verify:embed` measures it in the real browser: **`dockW=342 centerOffset=0 gapBottom=16 floating=true`** — exactly centred (0px offset), 16px above the bottom, well under half the viewport.
- **画布对话框居中**：悬浮面板从右下角改为**底部水平居中**（`left:0; right:0; margin:0 auto`，距底 16px），看起来像画布下方的一条指令栏；收成的小胶囊同样居中，入场动画也改成从下方轻微上浮（`translateY(14px)`），不再和居中的位移冲突。浏览器实测：`dockW=342 centerOffset=0 gapBottom=16`。

## v0.20.0

- **The canvas chat is now a narrow floating panel / 画布对话框改为收窄的悬浮样式**: the canvas conversation used to be a full-width bar docked to the bottom edge; it is now a **340px floating glass card in the bottom-right corner** (16px inset, above the plane), so the canvas keeps almost all of its area and the chat is always where the eye already is.
  - The panel has its own head row: `画布对话` + `▴` (show/hide the transcript) + `—` (shrink the whole panel into a small `💬 改画布` pill, with the log count as a badge, and expand it back). `Esc` in the input does the same, and the input is a compact one-line field (`一句话改画布…`) with a `发送` button.
  - The transcript scrolls inside the panel (max 190px) instead of pushing the canvas around, and the panel is an overlay: the plane, its panning and its zoom are unaffected.
- **Tests**: `smoke.mjs` asserts the floating contract (absolute, `right/bottom:16px`, `z-index:40`, `width:340px`, the mini pill rule) plus the head/input markup. `npm run verify:embed` measures the panel in the real browser and asserts **`dockW=342 gapRight=16 gapBottom=16 floating=true`** (340px + borders, inset 16px, well under half the viewport), while still driving a `[canvas]` op list through the canvas and checking the plane updated.
- **画布对话框收窄改为悬浮**：原来贴底的整条对话栏改成**右下角 340px 的悬浮玻璃卡片**（距边 16px，浮在画布之上），画布面积几乎不被占用。面板自带一行头部：`画布对话` + `▴`（展开/收起对话记录）+ `—`（整块收成 `💬 改画布` 小胶囊，带记录条数，可再展开）；输入框内按 `Esc` 同样收起；输入为一行的 `一句话改画布…` + `发送`。记录在面板内滚动（最高 190px），不再推挤画布；面板本身是覆盖层，画布的平移与缩放完全不受影响。

## v0.19.0

- **The canvas has its own conversation box / 画布自带对话框**: every canvas (including a card's instance canvas) now carries a docked chat at the bottom — describe the change you want in one sentence and the canvas is edited for you. The dock keeps a collapsible transcript (`▴ 记录`), shows the streaming agent reply, and reports exactly what changed (`已应用：新增控件 1 · 移动 1 · 重命名画布`).
  - The agent gets a **full inventory of the plane** (every item's id, whether it is a card or a bare control, its controls, its position) and answers with a single `[canvas]` block of operations: `add` (any control, with its fields), `addCard`, `update`, `move`, `remove`, `rename`, `note`. Every operation runs through the normal canvas helpers, so a control added by chat is a normal bare control, a removed bound item still removes its control from the card, and a rename is a real rename.
  - Operations that cannot be applied are **skipped and counted** instead of failing the batch: an unknown id or a control whose fields do not validate is reported as `N 项无法应用`, and the ops that were valid still land.
  - The temporary-agent bridge was generalised into reusable tasks (`TASK_CARD_AGENT_TASK` / `TASK_CANVAS_AGENT_TASK`), so the card popup and the canvas dock share one session/prompt/parse/apply pipeline.
  - Fixed while building it: `rename` and `note` ops were counted as skipped because the applier looked up an item id before handling canvas-level operations.
- **The main composer can shrink into a logo / 主会话输入框可缩成 Logo**: while the board is open, the floating main-session window has a `—` control that collapses the whole thing into a round 🐋 chip in the corner (above the flip toggle); clicking the logo brings the window back. The real composer is only hidden by CSS — React keeps it mounted, so nothing typed or configured is lost, and the chip cleanly disappears when the page flips back.
- **Tests**: `smoke.mjs` covers the `[canvas]` protocol (marker and fenced parsing, junk rejection, invalid controls dropped, 6 applied + 1 skipped with the exact message, rename/`note`, inventory contents, the prompt's op vocabulary) and the dock's render, plus the collapse-to-logo CSS contract. The bridge tests now pass the task descriptor explicitly. `npm run verify:embed` drives a `[canvas]` op list through the real canvas view and asserts the plane and the name input updated, alongside the existing drag/refactor/fullscreen checks.
- **画布内自带对话修改框**：每块画布（含卡片的副本画布）底部都有对话条——用一句话描述改动即可：临时 agent 会拿到**画布清单**（每项的 id、是卡片还是裸控件、含哪些控件、所在坐标），并回一个 `[canvas]` 操作列表（`add` / `addCard` / `update` / `move` / `remove` / `rename` / `note`），由客户端逐条执行。`▴ 记录` 可展开对话记录，执行完会汇报改动明细；无法执行的项会被**跳过并计数**（如引用了不存在的 id 或控件字段不合法），其余照常生效。顺带把临时 agent 桥接抽成可复用的任务描述（卡片 / 画布共用同一条会话-提示-解析-应用管线），并修掉 `rename`/`note` 被误判为跳过的问题。另：**主会话输入框可缩成 Logo** —— 任务台打开时，浮动输入窗右上角多了 `—`，点一下整个窗口收成右下角的圆形 🐋 图标（在翻面按钮上方），点图标即可恢复；输入框只是被 CSS 隐藏，React 始终挂载，内容和配置都不会丢。

## v0.18.0

- **The canvas is no longer only cards: put any control on it / 画布上可以直接放任何控件**: `+ 控件` in the canvas bar drops **any control straight onto the plane with no card around it** — 18 kinds (text, heading, note, stats, progress, trend, key-values, links, chips, checklist, counter, button, table, code, toggle, countdown, bars, embedded web app), each with usable starter content.
  - A bare control is dragged by its hover toolbar (or by any non-interactive part of itself), resized from its own corner grip, edited with `✎`, refactored by talking (`💬`), duplicated (`⧉`), sent to the board (`📥`, as a card) and deleted (`🗑`); while the toolbar is shown it also labels the control (`清单 · 跑测试`).
  - `✎` opens a **control editor**: a plain field for the kinds with one obvious text (`text`/`heading`/`note`/`code`/`progress`/`label` kinds), an address field for embedded apps and images, and a **raw-JSON editor** for everything else — both go through the same `sanitizeTaskBlock` validation, so a control can never be saved in a state the client cannot render.
  - `▢`/`▣` flips any single-control item between the card look and the bare look in **both** directions, so a card's exploded control can become a free-floating control and vice versa.
  - Pasted or dropped images now arrive as **bare image controls** (previously a whole image card), and the `+ 控件` menu deliberately leaves images out because they need real data.
  - Bare controls are normal canvas items: they persist, sync over the relay and stay bound to their card when they came from one (edits still write back, deleting still removes the control, and dragging them still re-orders the card).
- **Fixed a gesture robustness bug found while verifying this**: the new bare-control drag computed its position inside `requestAnimationFrame` only, so a throttled or skipped frame (background tab, reduced motion) could drop the drag entirely; the pointer handler now updates the gesture state synchronously and only *paints* in rAF (the board and canvas card gestures already worked this way).
- **Tests**: `smoke.mjs` covers the menu (18 kinds, every default sanitizes, `image` intentionally absent and rejected), adding a control without a card (position, `bare`, single block, generated `bid`, no binding), persistence (`bare` survives a sanitize round-trip), duplication, in-place editing plus an invalid-edit rejection, wrapping/unwrapping, the bare renderer's markup (control present, no card header/body chrome) and the quick editor (simple field, JSON fallback). `npm run verify:embed` clicks `+ 控件` → 计数 in the real canvas, asserts a bare counter with no card chrome, **drags it by its toolbar and checks it moved by exactly the dispatched delta**, then screenshots the plane.
- **画布自由度更高：可以直接加任何控件**：画布工具条新增 `+ 控件`，把任意控件**直接放到画布上，外面不套卡片**（文本/小标题/说明/统计/进度/趋势/键值/链接/标签/清单/计数/按钮/表格/代码/开关/倒计时/条形图/网页应用，共 18 种，每种都带可直接用的初始内容）。裸控件用悬停工具条拖动（或拖它自己的非交互区域）、右下角缩放、`✎` 编辑、`💬` 对话重构、`⧉` 复制、`📥` 发回任务台、`🗑` 删除；`✎` 打开的是**控件编辑器**：结构简单的控件给一个文本框，应用/图片给地址框，其它一律给**原始 JSON 编辑**（都走同一套校验，绝不会存成渲染不出来的状态）。`▢/▣` 可以在「卡片外观」和「裸控件」之间双向切换；粘贴/拖入的图片现在直接变成裸图片控件。另外修掉一个新发现的交互健壮性问题：裸控件的拖动曾经只在 `requestAnimationFrame` 里计算位置，掉帧（后台标签页、减少动效）时拖动会整个丢失——现在指针事件里同步更新状态、rAF 只负责绘制。

## v0.17.0

- **A card's conversation refactor now targets exactly what its canvas holds / 对话重构的对象与画布内一致**: refactoring a card (the `💬` popup, a `[taskcard]` block in any conversation, the `✎` editor, or an embedded-app height drag) used to update the card only, leaving the card's canvas showing the controls from before. The card's canvas is now **reconciled** with the card after every such change:
  - controls that the refactor removed lose their canvas item (and the deletion is broadcast to collaborators),
  - surviving controls keep their item's **position and size** and take the new content and label — the `bid` is what survives, and the refactor prompt now explicitly tells the agent to echo existing `bid`s (and widget `key`s) so nothing jumps around,
  - controls the refactor added get a fresh item placed under the existing ones.
  - The same reconciliation runs the other way: editing a control on the plane relabels its item, writes it back to the card, and pulls in any extra controls the refactor produced, so "one control on the card" and "one item on the plane" always hold.
  - Deleting a card (from the board or through `[taskcard] delete`) clears its canvas items instead of leaving ghost controls pointing at a card that no longer exists.
- **Tests**: `smoke.mjs` asserts the reconciliation end to end — after a conversation refactor the card's control count equals the plane's bound item count, the echoed control keeps its exact `x`/`y` and takes the new content, the added control gets an item, the dropped one's item is gone, item labels follow their control, and deleting the card leaves zero bound items. `npm run verify:embed` performs the same refactor through `applyTaskCardSpec` in the real browser and asserts the plane DOM updated (3 items, kept control in place with its refreshed label) plus the screenshot.
- **对话重构的对象内容和画布内保持一致**：以前用 `💬` 重构卡片（或任意会话里的 `[taskcard]`、`✎` 编辑器、拖动内嵌应用高度）只更新卡片，卡片画布上还是旧的控件。现在每次这类改动之后都会**把卡片画布与卡片对齐**：被删掉的控件其画布卡片一并移除（并广播给协作者）；保留的控件**位置与尺寸不变**，只更新内容与标签（靠 `bid` 识别，重构提示词现在也明确要求 AI 原样回传已有的 `bid` 与 `key`）；新增的控件会在已有控件下方生成新卡片。反向同样成立：在画布上改某个控件会写回卡片、刷新其标签，并把重构多出来的控件补进画布，因此「卡片上的控件」与「画布上的控件卡片」始终一一对应。删除卡片（面板或 `[taskcard] delete`）会清掉它的画布卡片，不再留下指向已删卡片的幽灵控件。

## v0.16.0

- **A card's controls live on its own canvas / 卡片的控件就在它自己的画布上**: maximizing a user card no longer drops a single copy of the card onto the plane — it **unrolls the card into its controls**, one canvas item per control (laid out in two readable columns). Each item is a normal canvas card: drag it, resize it, edit it (`✎`), refactor it by talking (`💬`), open it fullscreen (`⛶`), duplicate it (`⧉`), send it to the board (`📥`) or delete it.
  - **The board card is their thumbnail**: the card body renders the same controls compactly and carries a `N 个控件 · ⛶ 进画布排布` line; **rearranging the items on the plane re-orders the controls on the card** (the order is derived from their `y`, then `x`), so the card is a live miniature of what is on the canvas.
  - **Two-way content mapping**: controls get a stable identity (`bid`, carried through every sanitize round-trip, alongside the existing widget `key`). Editing a control's item (manual editor, `💬` refactor, embedded-app height drag) writes that control back onto the card, and deleting an item removes the control from the card (`🗑` says so when the item is bound).
  - `⟲ 重新展开控件` re-unrolls the card's current controls (replacing the bound items) when the card was changed elsewhere; `⟲ 放入源卡副本` still drops a whole-card copy, and derived/duplicated items stay unbound so they never write back.
  - Fixed a real bug this surfaced: stored card entries carry no `id` of their own, so every card used to share one instance canvas (`cv-inst-undefined`) — the panel now binds the id explicitly and `canvasOpenInstance` refuses to run without one.
- **Tests**: `smoke.mjs` covers the unrolling (3 controls → 3 bound single-control items, ids stamped onto the card), idempotent re-entry, the active-canvas seat, **drag-driven reordering**, content write-back (edit / no-op / delete), re-unrolling, unbound duplicates, labels, `bid`/`from` round-trips and the thumbnail footer; `npm run verify:embed` adds a real pointer drag of a control item on the plane and asserts the board card's control order changed (`wHead|check|check|app` → `check|check|app|wHead`), plus the instance bar, the overlay from the app item and the screenshot.
- **卡片的控件在它自己的画布里，可以拖动编辑；未打开的卡片是这些控件的缩略映射**：最大化自定义卡片不再只放一张副本，而是**把卡片拆成一个个控件**（每个控件一张画布卡片，两列排布）。每张都能拖动、缩放、`✎` 编辑、`💬` 对话重构、`⛶` 全屏、`⧉` 复制、`📥` 发回任务台、🗑 删除（删除绑定的控件会同时从卡片上移除该控件）。任务台上的卡片则是它们的**缩略映射**：卡片正文按同样顺序紧凑展示控件，底部标着「N 个控件 · ⛶ 进画布排布」，**在画布上拖动排序会同步改变卡片上的控件顺序**。控件现在有稳定身份 `bid`（与交互用的 `key` 一起在每次校验中保留），因此编辑画布上的控件会写回卡片。另修掉一个真实 bug：卡片存档本身不带 id，之前所有卡片会共用同一个副本画布；现在面板显式带上 id，缺 id 时拒绝进入。

## v0.15.0

- **Maximizing a card turns it into a canvas — its own instance / 卡片最大化后变成画布（副本）**: a user card's `⛶` no longer just shows a big card, it **opens the card's own canvas instance** — a private workspace seeded with an independent copy of that card, centered in view, like entering an instance in a game:
  - Pan/zoom freely, move/resize cards, drop or paste images, refactor cards by talking (`💬`), edit them (`✎`), open one fullscreen (`⛶`), **derive variants with `⧉` 复制**, and **send a card back to the board with `📥` 发回任务台** (creates it, or updates the card with the same title).
  - The instance is **created on first use and reused afterwards** (canvas id `cv-inst-<cardId>`, name `副本 · <卡片标题>`), so leaving and coming back finds exactly what you left — and it is a normal canvas underneath: share string, relay collaboration and presence all work.
  - The bar is instance-aware: no canvas switcher / `+ 新画布` / `删除画布`, instead `⟲ 放入源卡副本` (re-copy the board card's current content into the instance) and `删除副本`; the close button becomes `返回任务台`. Instance canvases stay out of the normal canvas switcher so it does not fill up with copies.
  - Publishing into an explicitly named canvas no longer steals the "active canvas" seat, so entering an instance leaves the main canvas view untouched.
  - Built-in read-only cards (session / jobs / subagents / workspace / plugins) keep the plain fullscreen view — there is nothing to copy into a workspace.
- **Fixed stale-keydown layering**: the canvas' Escape guard now reads refs instead of the effect closure, so the first Escape after opening an overlay above the canvas (card fullscreen / editor / chat) closes only that overlay and leaves the canvas open — caught by the browser check, which had shown the canvas closing underneath.
- **Tests**: `smoke.mjs` covers the instance id, seeding (name, blocks, style, independent copy), idempotent re-entry, the active-canvas seat, `⧉` duplication, `📥` send-to-board (create then update), and the instance bar's SSR (no switcher/creation controls). `npm run verify:embed`'s board phase now maximizes a real user card, asserts the instance view (`副本画布`, 1 seeded card with a live embedded app, no `+ 新画布`), opens the card fullscreen from inside it (overlay fills the viewport), asserts Escape closes only the overlay, duplicates a card, and screenshots the instance with both cards.
- **卡片最大化后变成画布（副本）**：自定义卡片的 `⛶` 现在直接进入**这张卡片的副本画布**——以该卡片的独立副本为中心播下的专属工作区，像进游戏副本一样：自由平移缩放、拖拽/缩放卡片、粘贴图片、`💬` 对话重构、`✎` 编辑、`⛶` 单卡全屏、`⧉` 原地衍生副本、`📥` 把卡片发回任务台（同名则更新）。副本画布首次进入时创建、之后一直复用（id `cv-inst-<卡片id>`、名称 `副本 · 卡片标题`），退出再进还是原样；底层就是普通画布，分享串、中继协作、在线状态照常可用。副本模式隐藏画布切换器 / `+ 新画布` / `删除画布`，改为 `⟲ 放入源卡副本`、`删除副本`，关闭按钮变成 `返回任务台`；副本画布不会出现在普通画布下拉里。内置只读卡片仍走普通全屏视图。

## v0.14.0

- **Any card can go fullscreen / 卡片可以全屏**: every card — built-in (session / jobs / subagents / workspace / plugins) and user cards, on the board and on the infinite canvas — carries a `⛶` button that opens it as a **fullscreen view over the whole workbench** (up to 1680×1200, otherwise 97 % × 94 % of the viewport). The very same card body is rendered large, so nothing is duplicated or lost:
  - An **embedded web app** takes the entire screen; with `fill: true` it stretches to the fullscreen body (verified in headless Chrome: a 666px shell inside a 706px viewport, the app filling 590px of it).
  - `Esc`, the backdrop, or `✕` closes it; the header keeps the card's own actions (`📌` pin, `📤` publish, `💬` refactor, `✎` edit) so you can keep working without leaving the fullscreen view, and `⤢` additionally asks the browser for **real fullscreen** (hidden browser chrome) — Esc then belongs to the browser first, so leaving browser-fullscreen does not also close the card.
  - The overlay is a proper dialog (`role="dialog"`, `aria-modal`, labelled with the card title) and works inside the flipped panel because it positions against the viewport.
- **Tests**: `smoke.mjs` checks the fullscreen button on the board panel, a standalone board card and the canvas cards, that the overlay renders its shell/header/hint/actions/`data-fill` with the live body (including the embedded app inside it), and that a card without a `fill` app scrolls instead of stretching. `npm run verify:embed` gained a second headless-Chrome phase that mounts the **real board panel**, creates an app card through the `[taskcard]` store API, clicks `⛶`, asserts the overlay/shell/app/frame sizes plus the Esc-close/reopen, and screenshots the fullscreen app.
- **卡片可以全屏**：内置卡片（会话 / 后台任务 / 子代理 / 工作区 / 插件）和自定义卡片、任务台与无限画布上的卡片都多了 `⛶` 按钮，点一下就以全屏视图铺满整个工作台（最大 1680×1200，否则 97% × 95% 视口）。渲染的是同一份卡片内容，内嵌网页应用因此可以直接占满整屏（`fill: true` 时铺满全屏视图）；`Esc`、点空白处或 `✕` 退出，头部保留卡片自己的按钮（📌 置顶 / 📤 发布 / 💬 重构 / ✎ 编辑），`⤢` 还能让浏览器进入真·全屏（连浏览器界面一起隐藏；此时 Esc 先交给浏览器，不会顺手把卡片也关掉）。弹层带 `role="dialog"` / `aria-modal`，在翻面面板里也按视口定位。

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
