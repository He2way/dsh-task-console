window.__ModuleLoader__.load({
	id: "dsh-task-console",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region styles
		const TASK_CSS = ".dsh-tc-toggle{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(148,163,184,.32);background:rgba(255,255,255,.5);color:var(--dsw-alias-label-primary);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:500;cursor:pointer;box-shadow:0 10px 28px rgba(15,23,42,.16);transition:transform .15s,box-shadow .2s;user-select:none;-webkit-user-select:none}.dsh-tc-toggle:hover{transform:translateY(-1px);box-shadow:0 14px 34px rgba(15,23,42,.2)}body[data-ds-dark-theme] .dsh-tc-toggle{background:rgba(24,27,42,.55);border-color:rgba(148,163,184,.25)}.dsh-tc-toggleIcon{display:inline-flex;font-size:14px;line-height:0}.dsh-tc-panel{position:fixed;inset:0;z-index:2147480000;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(1100px 700px at 15% 12%,rgba(99,102,241,.16),transparent 55%),radial-gradient(900px 650px at 88% 88%,rgba(56,189,248,.14),transparent 55%),rgba(255,255,255,.55);backdrop-filter:blur(28px) saturate(160%);-webkit-backdrop-filter:blur(28px) saturate(160%);animation:dsh-tc-flip-in .5s cubic-bezier(.4,.2,.2,1)}.dsh-tc-panel[data-theme=dark]{background:radial-gradient(1100px 700px at 15% 12%,rgba(99,102,241,.22),transparent 55%),radial-gradient(900px 650px at 88% 88%,rgba(56,189,248,.18),transparent 55%),rgba(13,16,28,.6)}@keyframes dsh-tc-flip-in{from{transform:perspective(1400px) rotateY(-14deg);opacity:.3}to{transform:perspective(1400px) rotateY(0);opacity:1}}@media (prefers-reduced-motion:reduce){.dsh-tc-panel{animation:none}}.dsh-tc-boardHeader{flex:none;display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid rgba(148,163,184,.22)}.dsh-tc-boardTitle{font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary);flex:none}.dsh-tc-boardSub{min-width:0;font-size:12px;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.dsh-tc-boardSpacer{flex:1}.dsh-tc-btn{flex:none;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.35);color:var(--dsw-alias-label-secondary);border-radius:10px;padding:5px 12px;font-size:12px;line-height:18px;cursor:pointer;display:inline-flex;align-items:center}.dsh-tc-btn:hover{background:rgba(255,255,255,.55)}.dsh-tc-panel[data-theme=dark] .dsh-tc-btn{background:rgba(255,255,255,.06)}.dsh-tc-panel[data-theme=dark] .dsh-tc-btn:hover{background:rgba(255,255,255,.12)}.dsh-tc-canvas{position:relative;flex:1;min-height:0;overflow:hidden}.dsh-tc-card{position:absolute;width:300px;min-width:260px;max-width:min(340px,calc(100% - 24px));display:flex;flex-direction:column;border-radius:16px;border:1px solid rgba(148,163,184,.28);background:rgba(255,255,255,.45);backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);box-shadow:0 18px 44px rgba(15,23,42,.14),0 2px 8px rgba(15,23,42,.06);transition:box-shadow .2s,transform .2s;overflow:hidden;user-select:none;-webkit-user-select:none}.dsh-tc-panel[data-theme=dark] .dsh-tc-card{background:rgba(28,32,48,.55);border-color:rgba(148,163,184,.22);box-shadow:0 18px 44px rgba(0,0,0,.4)}.dsh-tc-card[data-dragging]{box-shadow:0 24px 60px rgba(15,23,42,.22);cursor:grabbing}.dsh-tc-cardHead{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:grab;border-bottom:1px solid rgba(148,163,184,.18);touch-action:none}.dsh-tc-card[data-dragging] .dsh-tc-cardHead{cursor:grabbing}.dsh-tc-cardTitle{flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.dsh-tc-cardBadge{flex:none;font-size:11px;line-height:18px;padding:0 8px;border-radius:9px;background:rgba(99,102,241,.14);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}.dsh-tc-cardIconBtn{flex:none;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;padding:2px 4px;border-radius:6px;display:inline-flex;align-items:center;font-size:12px;line-height:1}.dsh-tc-cardIconBtn:hover{color:var(--dsw-alias-label-secondary);background:rgba(148,163,184,.18)}.dsh-tc-cardBody{display:flex;flex-direction:column;gap:2px;padding:8px 12px 12px;overflow:auto;max-height:280px}.dsh-tc-card[data-collapsed] .dsh-tc-cardBody{display:none}.dsh-tc-row{display:flex;align-items:center;gap:8px;min-width:0;padding:3px 0}.dsh-tc-dot{flex:none;width:8px;height:8px;border-radius:50%}.dsh-tc-dot-ongoing{background:var(--dsw-alias-state-business-primary,#3b82f6)}.dsh-tc-dot-warn{background:var(--dsw-alias-state-warn-primary,#f59e0b)}.dsh-tc-dot-done{background:var(--dsw-alias-state-success-primary,#22c55e)}.dsh-tc-dot-error{background:var(--dsw-alias-state-error-primary,#ef4444)}.dsh-tc-kind{flex:none;font-size:10px;line-height:16px;padding:0 6px;border-radius:5px;background:rgba(148,163,184,.2);color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,monospace)}.dsh-tc-label{flex:1;min-width:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.dsh-tc-meta{flex:none;font-size:11px;line-height:18px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap;max-width:96px;text-overflow:ellipsis;overflow:hidden}.dsh-tc-empty{font-size:12px;line-height:20px;color:var(--dsw-alias-label-tertiary);padding:10px 4px;text-align:center}.dsh-tc-kv{display:flex;gap:8px;min-width:0;font-size:12px;line-height:20px}.dsh-tc-kvKey{flex:none;color:var(--dsw-alias-label-tertiary)}.dsh-tc-kvVal{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.dsh-tc-path{font-family:var(--ds-font-family-code,monospace);font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);word-break:break-all;white-space:normal;max-height:64px;overflow:auto}";
		const TASK_TAG_ID = "dsh-task-console/styles";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(TASK_TAG_ID) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-task-console";
			tag.dataset.pluginCss = TASK_TAG_ID;
			tag.textContent = TASK_CSS;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region constants + helpers
		const TASK_STORAGE_KEY = "dsh.taskconsole.v1";
		const TASK_CARD_DEFAULTS = {
			"session": { x: 24, y: 24, collapsed: false, hidden: false },
			"jobs": { x: 352, y: 24, collapsed: false, hidden: false },
			"subagents": { x: 24, y: 288, collapsed: false, hidden: false },
			"workspace": { x: 396, y: 288, collapsed: false, hidden: false }
		};
		/** Fresh default layout for every card (never merges saved state). */
		function freshTaskCards() {
			const cards = {};
			for (const key of Object.keys(TASK_CARD_DEFAULTS)) cards[key] = { ...TASK_CARD_DEFAULTS[key] };
			return cards;
		}
		/** Load the persisted card layout, merged over defaults; null when absent or corrupt. */
		function loadTaskCards() {
			if (typeof localStorage === "undefined") return null;
			try {
				const raw = localStorage.getItem(TASK_STORAGE_KEY);
				if (raw === null) return null;
				const parsed = JSON.parse(raw);
				if (parsed === null || typeof parsed !== "object" || parsed.cards === null || typeof parsed.cards !== "object") return null;
				const cards = freshTaskCards();
				for (const key of Object.keys(cards)) {
					const saved = parsed.cards[key];
					if (saved !== null && typeof saved === "object") {
						for (const field of ["x", "y"]) if (typeof saved[field] === "number" && Number.isFinite(saved[field])) cards[key][field] = saved[field];
						for (const field of ["collapsed", "hidden"]) if (typeof saved[field] === "boolean") cards[key][field] = saved[field];
					}
				}
				return cards;
			} catch {
				return null;
			}
		}
		/** Persist the card layout; storage failures are ignored (the board still works). */
		function saveTaskCards(cards) {
			if (typeof localStorage === "undefined") return;
			try {
				localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify({ cards }));
			} catch {
				/* storage may be unavailable (private mode) */
			}
		}
		/** Human duration in at most two adjacent units. */
		function fmtTaskDuration(elapsedMs) {
			const total = Math.max(0, Math.floor(elapsedMs / 1e3));
			const seconds = total % 60;
			const minutes = Math.floor(total / 60) % 60;
			const hours = Math.floor(total / 3600);
			if (hours > 0) return `${hours}小时${minutes}分`;
			if (minutes > 0) return `${minutes}分${seconds}秒`;
			return `${seconds}秒`;
		}
		/** Job status → dot state class. */
		function taskJobDot(status) {
			switch (status) {
				case "running": return "ongoing";
				case "stopping": return "warn";
				case "killed": return "warn";
				case "completed": return "done";
				case "failed": return "error";
				/* v8 ignore next -- closed wire status union */
				default: return "done";
			}
		}
		/** Chinese status word for a job row. */
		function taskStatusLabel(status) {
			switch (status) {
				case "running": return "运行中";
				case "stopping": return "正在停止";
				case "completed": return "已完成";
				case "killed": return "已取消";
				case "failed": return "已失败";
				/* v8 ignore next -- closed wire status union */
				default: return status;
			}
		}
		/** Live jobs first in start order, then settled newest-first. */
		function orderedTaskJobs(jobs) {
			const isLive = (job) => job.status === "running" || job.status === "stopping";
			return [...jobs].sort((left, right) => {
				const liveLeft = isLive(left);
				if (liveLeft !== isLive(right)) return liveLeft ? -1 : 1;
				if (liveLeft) return left.startedAt - right.startedAt;
				const finished = (right.finishedAt ?? right.startedAt) - (left.finishedAt ?? left.startedAt);
				return finished !== 0 ? finished : left.startedAt - right.startedAt;
			});
		}
		//#endregion
		//#region draggable card
		/** One draggable glass card (drag by header, pointer capture, clamped to the canvas). */
		function TaskCard(props) {
			const { id, title, badge, layout, dragging, zIndex, boardRef, onToggle, onClose, onDragStart, onDragMove, onDragEnd, children } = props;
			const cardRef = (0, react.useRef)(null);
			const origin = (0, react.useRef)({ px: 0, py: 0, x: 0, y: 0 });
			const onPointerDown = (event) => {
				if (event.button !== 0) return;
				event.preventDefault();
				origin.current = { px: event.clientX, py: event.clientY, x: layout.x, y: layout.y };
				onDragStart(id);
				try {
					event.currentTarget.setPointerCapture(event.pointerId);
				} catch {
					/* pointer already released */
				}
			};
			const onPointerMove = (event) => {
				if (!dragging) return;
				let nextX = origin.current.x + (event.clientX - origin.current.px);
				let nextY = origin.current.y + (event.clientY - origin.current.py);
				const board = boardRef.current;
				if (board !== null) {
					const rect = board.getBoundingClientRect();
					const width = cardRef.current?.offsetWidth ?? 300;
					const height = cardRef.current?.offsetHeight ?? 160;
					nextX = Math.min(Math.max(0, nextX), Math.max(0, rect.width - width));
					nextY = Math.min(Math.max(0, nextY), Math.max(0, rect.height - height));
				}
				onDragMove(id, nextX, nextY);
			};
			const onPointerUp = (event) => {
				if (!dragging) return;
				try {
					event.currentTarget.releasePointerCapture(event.pointerId);
				} catch {
					/* pointer already released */
				}
				onDragEnd(id);
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: cardRef,
				className: "dsh-tc-card",
				"data-dragging": dragging || void 0,
				"data-collapsed": layout.collapsed || void 0,
				style: { left: layout.x, top: layout.y, zIndex },
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-cardHead",
						onPointerDown,
						onPointerMove,
						onPointerUp,
						title: "按住拖拽移动卡片",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardTitle", children: title }),
							badge !== void 0 && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardBadge", children: badge }),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-cardIconBtn",
								title: layout.collapsed ? "展开" : "收起",
								onPointerDown: (event) => event.stopPropagation(),
								onClick: onToggle,
								children: (0, react_jsx_runtime.jsx)("span", { children: layout.collapsed ? "▾" : "▴" })
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-cardIconBtn",
								title: "隐藏卡片",
								onPointerDown: (event) => event.stopPropagation(),
								onClick: onClose,
								children: (0, react_jsx_runtime.jsx)("span", { children: "×" })
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-cardBody", children })
				]
			});
		}
		//#endregion
		//#region card bodies
		/** Session overview card body. */
		function TaskSessionBody(props) {
			const { summary, current, phase, liveJobs, totalJobs, runningSubagents, totalSubagents } = props;
			const rows = [
				["会话", summary?.displayTitle ?? (current ?? "未选择会话")],
				["状态", summary?.running === true ? "进行中" : "空闲"],
				["阶段", phase ?? "—"],
				["来源", summary?.origin ?? "根会话"],
				["后台任务", totalJobs > 0 ? `${liveJobs} 运行 / ${totalJobs} 总计` : "无"],
				["子代理", totalSubagents > 0 ? `${runningSubagents} 运行 / ${totalSubagents} 总计` : "无"]
			];
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: rows.map((row) => (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-kv",
				children: [
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvKey", children: row[0] }),
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvVal", title: String(row[1]), children: String(row[1]) })
				]
			}, row[0])) });
		}
		/** Background jobs card body (live rows first, ticking durations). */
		function TaskJobsBody(props) {
			const { jobs, now } = props;
			if (jobs.length === 0) return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-empty", children: "当前会话暂无后台任务" });
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: orderedTaskJobs(jobs).map((job) => {
				const live = job.status === "running" || job.status === "stopping";
				const duration = fmtTaskDuration(live ? now - job.startedAt : (job.finishedAt ?? job.startedAt) - job.startedAt);
				const status = taskStatusLabel(job.status);
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-row",
					children: [
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-dot dsh-tc-dot-" + taskJobDot(job.status) }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kind", children: job.kind }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-label", title: job.label, children: job.label }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-meta", title: job.detail ?? status, children: job.detail ?? status }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-meta", children: duration })
					]
				}, job.id);
			}) });
		}
		/** Subagent catalog card body. */
		function TaskSubagentsBody(props) {
			const { entries } = props;
			if (entries.length === 0) return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-empty", children: "当前会话暂无子代理" });
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: entries.map((entry) => {
				const running = entry.activity === "running";
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-row",
					children: [
						(0, react_jsx_runtime.jsx)("span", { className: running ? "dsh-tc-dot dsh-tc-dot-ongoing" : "dsh-tc-dot dsh-tc-dot-done" }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kind", children: entry.kind }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-label", title: entry.label, children: entry.label }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-meta", children: running ? "运行中" : "空闲" }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-meta", title: entry.id, children: entry.id.slice(0, 8) })
					]
				}, entry.id);
			}) });
		}
		/** Workspace card body. */
		function TaskWorkspaceBody(props) {
			const { summary, current, updatedAt } = props;
			const time = updatedAt > 0 ? new Date(updatedAt).toLocaleTimeString() : "—";
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("div", { key: "dir", className: "dsh-tc-kv", children: (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvKey", children: "工作目录" }) }),
				(0, react_jsx_runtime.jsx)("div", { key: "path", className: "dsh-tc-path", title: summary?.cwd, children: summary?.cwd ?? "（未设置）" }),
				(0, react_jsx_runtime.jsx)("div", { key: "id", className: "dsh-tc-kv", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvKey", children: "会话 ID" }), (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvVal", title: current, children: current ?? "—" })] }),
				(0, react_jsx_runtime.jsx)("div", { key: "time", className: "dsh-tc-kv", children: [(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvKey", children: "最近更新" }), (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvVal", children: time })] })
			] });
		}
		//#endregion
		//#region back panel
		/** The full-screen "back of the page" task board: header + draggable glass cards over the live session state. */
		function TaskBackPanel(props) {
			const { useSessions, onClose } = props;
			const current = useSessions((state) => state.current);
			const byId = useSessions((state) => state.byId);
			const jobs = useSessions((state) => state.current === void 0 ? void 0 : state.jobsBySession[state.current]);
			const catalog = useSessions((state) => state.current === void 0 ? void 0 : state.subagentsByParent[state.current]);
			const phase = useSessions((state) => state.phase);
			const boardRef = (0, react.useRef)(null);
			const [cards, setCards] = (0, react.useState)(() => loadTaskCards() ?? freshTaskCards());
			const [order, setOrder] = (0, react.useState)(() => Object.keys(TASK_CARD_DEFAULTS));
			const [activeId, setActiveId] = (0, react.useState)(null);
			const [now, setNow] = (0, react.useState)(() => Date.now());
			const [dark, setDark] = (0, react.useState)(() => typeof document !== "undefined" && document.body.hasAttribute("data-ds-dark-theme"));
			const cardsRef = (0, react.useRef)(cards);
			cardsRef.current = cards;
			(0, react.useEffect)(() => {
				setNow(Date.now());
				const timer = setInterval(() => setNow(Date.now()), 1e3);
				return () => clearInterval(timer);
			}, []);
			(0, react.useEffect)(() => {
				const body = document.body;
				const update = () => setDark(body.hasAttribute("data-ds-dark-theme"));
				const observer = new MutationObserver(update);
				observer.observe(body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
				return () => observer.disconnect();
			}, []);
			const onDragStart = (0, react.useCallback)((id) => {
				setActiveId(id);
				setOrder((previous) => [...previous.filter((key) => key !== id), id]);
			}, []);
			const onDragMove = (0, react.useCallback)((id, x, y) => {
				setCards((previous) => ({ ...previous, [id]: { ...previous[id], x, y } }));
			}, []);
			const onDragEnd = (0, react.useCallback)(() => {
				setActiveId(null);
				saveTaskCards(cardsRef.current);
			}, []);
			const setCardFlag = (0, react.useCallback)((id, field, value) => {
				setCards((previous) => {
					const next = { ...previous, [id]: { ...previous[id], [field]: value } };
					saveTaskCards(next);
					return next;
				});
			}, []);
			const reset = (0, react.useCallback)(() => {
				const defaults = freshTaskCards();
				setCards(defaults);
				setOrder(Object.keys(TASK_CARD_DEFAULTS));
				saveTaskCards(defaults);
			}, []);
			const summary = current === void 0 ? void 0 : byId[current];
			const jobList = jobs ?? [];
			const liveJobs = jobList.filter((job) => job.status === "running" || job.status === "stopping").length;
			const entries = catalog?.entries ?? [];
			const runningSubagents = entries.filter((entry) => entry.activity === "running").length;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-panel",
				"data-theme": dark ? "dark" : "light",
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-boardHeader",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-boardTitle", children: "任务控制台" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-boardSub", title: summary?.displayTitle, children: summary?.displayTitle ?? "未选择会话" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-boardSpacer" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: reset, children: "复位卡片" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onClose, children: "返回会话" })
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						ref: boardRef,
						className: "dsh-tc-canvas",
						children: Object.keys(cards).map((id) => {
							const layout = cards[id];
							if (layout.hidden) return null;
							const dragging = activeId === id;
							const zIndex = 10 + order.indexOf(id);
							let title = id;
							let badge;
							let body;
							if (id === "session") {
								title = "会话概览";
								body = (0, react_jsx_runtime.jsx)(TaskSessionBody, { summary, current, phase, liveJobs, totalJobs: jobList.length, runningSubagents, totalSubagents: entries.length });
							} else if (id === "jobs") {
								title = "后台任务";
								badge = liveJobs > 0 ? `${liveJobs} 运行中` : String(jobList.length);
								body = (0, react_jsx_runtime.jsx)(TaskJobsBody, { jobs: jobList, now });
							} else if (id === "subagents") {
								title = "子代理";
								badge = runningSubagents > 0 ? `${runningSubagents} 运行中` : String(entries.length);
								body = (0, react_jsx_runtime.jsx)(TaskSubagentsBody, { entries });
							} else {
								title = "工作区";
								body = (0, react_jsx_runtime.jsx)(TaskWorkspaceBody, { summary, current, updatedAt: summary?.updatedAt ?? 0 });
							}
							return (0, react_jsx_runtime.jsx)(TaskCard, {
								id,
								title,
								badge,
								layout,
								dragging,
								zIndex,
								boardRef,
								onToggle: () => setCardFlag(id, "collapsed", !layout.collapsed),
								onClose: () => setCardFlag(id, "hidden", true),
								onDragStart,
								onDragMove,
								onDragEnd,
								children: body
							}, id);
						})
					})
				]
			});
		}
		//#endregion
		//#region root occupant
		/** Floating glass toggle that opens/closes the task console panel. */
		function TaskFlipToggle(props) {
			const { open, onFlip } = props;
			return (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: "dsh-tc-toggle",
				onClick: onFlip,
				title: open ? "返回页面正面" : "翻到页面背面 · 任务控制台",
				children: [
					(0, react_jsx_runtime.jsx)("span", { key: "icon", className: "dsh-tc-toggleIcon", children: open ? "◀" : "⇄" }),
					(0, react_jsx_runtime.jsx)("span", { key: "label", children: open ? "返回正面" : "任务台" })
				]
			});
		}
		/**
		 * shell.overlay occupant root: the floating toggle plus the full-screen
		 * glass back panel. The overlay layer is click-through; this entry opts
		 * back into pointer events on its own surfaces only.
		 * @param props - framework standard props (useSessions is the standard feed).
		 */
		function TaskConsoleRoot(props) {
			const { useSessions } = props;
			const [open, setOpen] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onKeyDown = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("keydown", onKeyDown);
				return () => document.removeEventListener("keydown", onKeyDown);
			}, [open]);
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)(TaskFlipToggle, { open, onFlip: () => setOpen((current) => !current) }),
				open ? (0, react_jsx_runtime.jsx)(TaskBackPanel, { useSessions, onClose: () => setOpen(false) }) : null
			] });
		}
		//#endregion
		//#region plugin entry
		/** Required services: the slot registry (shell.overlay contribution). */
		const inject = ["slots"];
		/**
		 * Client plugin body: register the task console as a shell.overlay
		 * occupant (additive, click-through until opted in).
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "task-console",
				order: 100,
				label: "任务控制台"
			}, TaskConsoleRoot));
		}
		//#endregion
		/* test hooks (harmless exports used by smoke.mjs) */
		exports.__dshTestHooks = { TaskConsoleRoot, TaskBackPanel, TaskCard, TaskFlipToggle, freshTaskCards, loadTaskCards, saveTaskCards, fmtTaskDuration, taskJobDot, orderedTaskJobs };
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
