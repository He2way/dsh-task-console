/*
 * dsh-task-console — browser half (also the shipped bundle).
 *
 * Flip the page to its glass back for a board of mouse-draggable, mouse-resizable
 * cards: live background jobs, subagents, session overview, workspace and the frame-wide
 * plugin inventory. User cards carry a declarative control list (text,
 * heading, note, stats, progress, trend, kv, links, chips, image, checklist,
 * counter, button, table, code, toggle, countdown, bars) plus an allow-listed
 * card style; conversations author and refactor them through [taskcard] blocks
 * and the top-right card chat, which calls a temporary agent session. Cards
 * publish independent copies onto a fullscreen infinite canvas with named
 * boards, share strings and a WebSocket relay (relay/server.mjs) for
 * multi-user editing.
 *
 * No build step: this file is both source and bundle (ModuleLoader format,
 * zero dependencies beyond React). See README.md for the protocol and
 * CHANGELOG.md for the release history.
 */
window.__ModuleLoader__.load({
	id: "dsh-task-console",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let react_dom = require("react-dom");
		/** Plugin-management port (inventory + stop/remove), built by apply. */
		let taskPluginsPort = null;
		//#region styles
		const TASK_CSS = ".dsh-tc-toggle{position:fixed;right:16px;bottom:16px;z-index:2147483000;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(148,163,184,.32);background:linear-gradient(135deg,rgba(255,255,255,.7),rgba(255,255,255,.42));color:var(--dsw-alias-label-primary);backdrop-filter:blur(14px) saturate(160%);-webkit-backdrop-filter:blur(14px) saturate(160%);border-radius:999px;padding:8px 14px;font-size:12.5px;font-weight:500;cursor:pointer;box-shadow:0 10px 28px rgba(15,23,42,.16);transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s,background .25s,border-color .25s;user-select:none;-webkit-user-select:none}.dsh-tc-toggle:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 16px 40px rgba(99,102,241,.32)}.dsh-tc-toggle:active{transform:scale(.94)}.dsh-tc-toggle[data-open]{background:linear-gradient(135deg,rgba(99,102,241,.22),rgba(56,189,248,.18));border-color:rgba(99,102,241,.45);box-shadow:0 10px 32px rgba(99,102,241,.3)}body[data-ds-dark-theme] .dsh-tc-toggle{background:linear-gradient(135deg,rgba(44,48,74,.85),rgba(24,27,42,.65));border-color:rgba(148,163,184,.25)}.dsh-tc-toggleIcon{display:inline-flex;font-size:14px;line-height:0;transition:transform .4s cubic-bezier(.34,1.56,.64,1)}.dsh-tc-toggle[data-open] .dsh-tc-toggleIcon{transform:rotate(180deg)}.dsh-tc-flip{position:fixed;inset:0;z-index:2147480000;transform-style:preserve-3d;pointer-events:none;will-change:transform;animation:dsh-tc-flip-in .85s cubic-bezier(.4,0,.2,1) both}.dsh-tc-flip[data-settled]{animation:none;transform:none}.dsh-tc-flip[data-closing]{animation:dsh-tc-flip-out .65s cubic-bezier(.4,0,.2,1) both}.dsh-tc-flip[data-settled] .dsh-tc-panel{transform:none}.dsh-tc-panel{position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden;transform:rotateY(180deg);backface-visibility:hidden;-webkit-backface-visibility:hidden;pointer-events:auto;background:radial-gradient(1100px 700px at 15% 12%,rgba(99,102,241,.15),transparent 55%),radial-gradient(900px 650px at 88% 88%,rgba(56,189,248,.13),transparent 55%),linear-gradient(165deg,rgba(249,250,255,.99),rgba(235,239,250,.97))}.dsh-tc-panel[data-theme=dark]{background:radial-gradient(1100px 700px at 15% 12%,rgba(99,102,241,.22),transparent 55%),radial-gradient(900px 650px at 88% 88%,rgba(56,189,248,.17),transparent 55%),linear-gradient(165deg,rgba(23,27,44,.99),rgba(13,16,28,.98))}@keyframes dsh-tc-flip-in{from{transform:perspective(2200px) rotateY(0)}to{transform:perspective(2200px) rotateY(180deg)}}@keyframes dsh-tc-flip-out{from{transform:perspective(2200px) rotateY(0)}to{transform:perspective(2200px) rotateY(-180deg)}}.dsh-tc-panel::before{content:'';position:absolute;inset:0;z-index:3;pointer-events:none;background:linear-gradient(112deg,transparent 30%,rgba(255,255,255,.38) 42%,rgba(255,255,255,.06) 50%,transparent 62%);transform:translateX(-135%) skewX(-8deg);mix-blend-mode:screen;animation:dsh-tc-sheen .9s .62s cubic-bezier(.22,1,.36,1) forwards}.dsh-tc-panel[data-theme=dark]::before{background:linear-gradient(112deg,transparent 30%,rgba(170,195,255,.2) 42%,rgba(170,195,255,.05) 50%,transparent 62%)}.dsh-tc-panel::after{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(620px 420px at 82% 16%,rgba(139,92,246,.16),transparent 62%),radial-gradient(720px 520px at 10% 90%,rgba(14,165,233,.12),transparent 62%);animation:dsh-tc-drift 10s ease-in-out infinite alternate}@keyframes dsh-tc-sheen{to{transform:translateX(135%) skewX(-8deg)}}@keyframes dsh-tc-drift{from{opacity:.6;transform:translate3d(0,0,0)}to{opacity:1;transform:translate3d(-28px,18px,0)}}.dsh-tc-boardHeader,.dsh-tc-canvas{position:relative;z-index:2}.dsh-tc-float{border-radius:16px;overflow:hidden;border:1px solid rgba(148,163,184,.32);box-shadow:0 18px 50px rgba(15,23,42,.22)}.dsh-tc-float::before{content:'';position:absolute;top:6px;left:50%;transform:translateX(-50%);width:36px;height:4px;border-radius:999px;background:rgba(148,163,184,.45);cursor:grab;pointer-events:none;z-index:7}.dsh-tc-float::after{content:'';position:absolute;right:2px;bottom:2px;width:16px;height:16px;cursor:nwse-resize;pointer-events:none;z-index:6;background:radial-gradient(circle at 100% 100%,rgba(148,163,184,.5) 0,transparent 11px)}.dsh-tc-float [data-slot='conversation.input.dock']{display:none}.dsh-tc-float [data-composer-card]{background:transparent;border:none;box-shadow:none}.dsh-tc-headbar{flex:none;display:flex;align-items:center;height:32px;padding:0 14px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);border-bottom:1px solid rgba(148,163,184,.2);user-select:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.dsh-tc-transcript{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:10px 14px}.dsh-tc-msg{display:flex;gap:8px;min-width:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary)}.dsh-tc-msg-label{flex:none;font-size:10px;line-height:16px;padding:0 6px;border-radius:8px;align-self:flex-start;background:rgba(148,163,184,.25);color:var(--dsw-alias-label-secondary)}.dsh-tc-msg-user .dsh-tc-msg-label{background:rgba(56,189,248,.18)}.dsh-tc-msg-ai .dsh-tc-msg-label{background:rgba(99,102,241,.2)}.dsh-tc-msg-text{flex:1;min-width:0;white-space:pre-wrap;word-break:break-word}.dsh-tc-msg-empty{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary);text-align:center;padding:8px 0}.dsh-tc-plugBtn{flex:none;border:1px solid rgba(148,163,184,.28);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:7px;padding:1px 8px;font-size:11px;line-height:18px;cursor:pointer}.dsh-tc-plugBtn:hover{background:rgba(148,163,184,.18)}.dsh-tc-plugBtn:disabled{opacity:.5;cursor:default}.dsh-tc-plugBtnDanger{border-color:rgba(239,68,68,.45);color:var(--dsw-alias-state-error-primary,#ef4444)}body.dsh-tc-open>div:not(#root):not(.dsh-tc-flip):not(.dsh-tc-toggle){z-index:2147484000!important}@media (prefers-reduced-motion:reduce){.dsh-tc-flip,.dsh-tc-panel,.dsh-tc-card,.dsh-tc-toggle,.dsh-tc-toggleIcon,.dsh-tc-panel::before,.dsh-tc-panel::after{animation:none!important;transition:none!important}.dsh-tc-flip{transform:perspective(2200px) rotateY(180deg)}}.dsh-tc-boardHeader{flex:none;display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid rgba(148,163,184,.22)}.dsh-tc-boardTitle{font-size:16px;font-weight:600;color:var(--dsw-alias-label-primary);flex:none}.dsh-tc-boardSub{min-width:0;font-size:12px;color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.dsh-tc-boardSpacer{flex:1}.dsh-tc-btn{flex:none;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.35);color:var(--dsw-alias-label-secondary);border-radius:10px;padding:5px 12px;font-size:12px;line-height:18px;cursor:pointer;display:inline-flex;align-items:center}.dsh-tc-btn:hover{background:rgba(255,255,255,.55)}.dsh-tc-panel[data-theme=dark] .dsh-tc-btn{background:rgba(255,255,255,.06)}.dsh-tc-panel[data-theme=dark] .dsh-tc-btn:hover{background:rgba(255,255,255,.12)}.dsh-tc-canvas{position:relative;flex:1;min-height:0;overflow:hidden}.dsh-tc-card{position:absolute;width:300px;min-width:260px;max-width:min(340px,calc(100% - 24px));display:flex;flex-direction:column;border-radius:16px;border:1px solid rgba(148,163,184,.28);background:rgba(255,255,255,.45);backdrop-filter:blur(18px) saturate(170%);-webkit-backdrop-filter:blur(18px) saturate(170%);box-shadow:0 18px 44px rgba(15,23,42,.14),0 2px 8px rgba(15,23,42,.06);transition:box-shadow .2s,transform .2s;overflow:hidden;user-select:none;-webkit-user-select:none;animation:dsh-tc-card-in .5s cubic-bezier(.22,1,.36,1) backwards}.dsh-tc-panel[data-theme=dark] .dsh-tc-card{background:rgba(28,32,48,.55);border-color:rgba(148,163,184,.22);box-shadow:0 18px 44px rgba(0,0,0,.4)}.dsh-tc-card[data-dragging]{box-shadow:0 24px 60px rgba(15,23,42,.22);cursor:grabbing}.dsh-tc-card:nth-child(1){animation-delay:.52s}.dsh-tc-card:nth-child(2){animation-delay:.58s}.dsh-tc-card:nth-child(3){animation-delay:.64s}.dsh-tc-card:nth-child(4){animation-delay:.7s}@keyframes dsh-tc-card-in{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}.dsh-tc-cardHead{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:grab;border-bottom:1px solid rgba(148,163,184,.18);touch-action:none}.dsh-tc-card[data-dragging] .dsh-tc-cardHead{cursor:grabbing}.dsh-tc-cardTitle{flex:1;min-width:0;font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.dsh-tc-cardBadge{flex:none;font-size:11px;line-height:18px;padding:0 8px;border-radius:9px;background:rgba(99,102,241,.14);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}.dsh-tc-cardIconBtn{flex:none;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;padding:2px 4px;border-radius:6px;display:inline-flex;align-items:center;font-size:12px;line-height:1}.dsh-tc-cardIconBtn:hover{color:var(--dsw-alias-label-secondary);background:rgba(148,163,184,.18)}.dsh-tc-cardBody{display:flex;flex-direction:column;gap:2px;padding:8px 12px 12px;overflow:auto;max-height:280px}.dsh-tc-card[data-collapsed] .dsh-tc-cardBody{display:none}.dsh-tc-row{display:flex;align-items:center;gap:8px;min-width:0;padding:3px 0}.dsh-tc-dot{flex:none;width:8px;height:8px;border-radius:50%}.dsh-tc-dot-ongoing{background:var(--dsw-alias-state-business-primary,#3b82f6)}.dsh-tc-dot-warn{background:var(--dsw-alias-state-warn-primary,#f59e0b)}.dsh-tc-dot-done{background:var(--dsw-alias-state-success-primary,#22c55e)}.dsh-tc-dot-error{background:var(--dsw-alias-state-error-primary,#ef4444)}.dsh-tc-kind{flex:none;font-size:10px;line-height:16px;padding:0 6px;border-radius:5px;background:rgba(148,163,184,.2);color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,monospace)}.dsh-tc-label{flex:1;min-width:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.dsh-tc-meta{flex:none;font-size:11px;line-height:18px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap;max-width:96px;text-overflow:ellipsis;overflow:hidden}.dsh-tc-empty{font-size:12px;line-height:20px;color:var(--dsw-alias-label-tertiary);padding:10px 4px;text-align:center}.dsh-tc-kv{display:flex;gap:8px;min-width:0;font-size:12px;line-height:20px}.dsh-tc-kvKey{flex:none;color:var(--dsw-alias-label-tertiary)}.dsh-tc-kvVal{min-width:0;color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.dsh-tc-path{font-family:var(--ds-font-family-code,monospace);font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);word-break:break-all;white-space:normal;max-height:64px;overflow:auto}";
		const TASK_CSS_EXTRA = [
			".dsh-tc-iconOn{color:var(--dsw-alias-state-business-primary,#3b82f6)}",
			".dsh-tc-iconDanger{color:var(--dsw-alias-state-error-primary,#ef4444)}",
			".dsh-tc-iconDanger:hover{background:rgba(239,68,68,.18)}",
			".dsh-tc-userBody{display:flex;flex-direction:column;gap:8px;min-width:0}",
			".dsh-tc-bodyText{white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:19px;color:var(--dsw-alias-label-primary)}",
			".dsh-tc-emptyText{font-size:12px;line-height:20px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-actRow{display:flex;flex-wrap:wrap;gap:6px;padding-top:8px;border-top:1px dashed rgba(148,163,184,.25)}",
			".dsh-tc-actBtn{flex:none;display:inline-flex;align-items:center;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.4);color:var(--dsw-alias-label-secondary);border-radius:9px;padding:3px 10px;font-size:11.5px;line-height:18px;cursor:pointer;transition:background .15s,transform .15s}",
			".dsh-tc-actBtn:hover{background:rgba(255,255,255,.7);transform:translateY(-1px)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-actBtn{background:rgba(255,255,255,.07)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-actBtn:hover{background:rgba(255,255,255,.13)}",
			".dsh-tc-editorWrap{position:absolute;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.16);backdrop-filter:blur(4px)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-editorWrap{background:rgba(2,4,12,.42)}",
			".dsh-tc-editor{width:min(540px,94vw);max-height:min(600px,88vh);display:flex;flex-direction:column;gap:10px;padding:16px 18px;border-radius:18px;border:1px solid rgba(148,163,184,.32);background:rgba(255,255,255,.93);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);box-shadow:0 26px 80px rgba(15,23,42,.3);overflow:hidden}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-editor{background:rgba(22,26,42,.95);border-color:rgba(148,163,184,.22)}",
			".dsh-tc-editorTitle{flex:none;font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}",
			".dsh-tc-field{display:flex;flex-direction:column;gap:5px;min-width:0}",
			".dsh-tc-fieldLabel{font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-in,.dsh-tc-ta{border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.65);color:var(--dsw-alias-label-primary);border-radius:10px;padding:6px 10px;font-size:12.5px;line-height:18px;outline:none;font-family:inherit}",
			".dsh-tc-ta{resize:vertical;min-height:110px;white-space:pre-wrap;word-break:break-word}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-in,.dsh-tc-panel[data-theme=dark] .dsh-tc-ta{background:rgba(255,255,255,.07)}",
			".dsh-tc-in:focus,.dsh-tc-ta:focus{border-color:rgba(99,102,241,.6);box-shadow:0 0 0 2px rgba(99,102,241,.16)}",
			".dsh-tc-editorScroll{flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:2px}",
			".dsh-tc-editRow{display:flex;gap:6px;align-items:center;min-width:0}",
			".dsh-tc-editAction{flex:none;width:106px;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.55);color:var(--dsw-alias-label-secondary);border-radius:9px;padding:5px 6px;font-size:12px;font-family:inherit}",
			".dsh-tc-editLabel{flex:1;min-width:70px}",
			".dsh-tc-editValue{flex:2.2;min-width:120px}",
			".dsh-tc-editEmbedRow{flex-wrap:wrap}",
			".dsh-tc-editUrl{flex:2.4;min-width:180px}",
			".dsh-tc-editHeight{flex:none;width:74px}",
			".dsh-tc-editCheck{flex:none;display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:var(--dsw-alias-label-secondary);cursor:pointer;user-select:none}",
			".dsh-tc-fieldHint{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-editAction{background:rgba(255,255,255,.07)}",
			".dsh-tc-addBtn{border:1px dashed rgba(148,163,184,.55);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:9px;padding:4px 10px;font-size:12px;cursor:pointer;align-self:flex-start}",
			".dsh-tc-addBtn:hover{background:rgba(99,102,241,.12);color:var(--dsw-alias-label-primary)}",
			".dsh-tc-editorFoot{flex:none;display:flex;gap:8px;justify-content:flex-end;align-items:center}",
			".dsh-tc-btnPrimary{flex:none;border:1px solid rgba(99,102,241,.55);background:linear-gradient(135deg,rgba(99,102,241,.92),rgba(56,189,248,.88));color:#fff;border-radius:10px;padding:6px 16px;font-size:12.5px;font-weight:600;cursor:pointer;box-shadow:0 6px 18px rgba(99,102,241,.3)}",
			".dsh-tc-btnPrimary:hover{filter:brightness(1.07)}",
			".dsh-tc-editErr{flex:1;font-size:11px;color:var(--dsw-alias-state-error-primary,#ef4444)}",
			".dsh-tc-blocks{display:flex;flex-direction:column;gap:7px;min-width:0}",
			".dsh-tc-wHead{font-size:12.5px;font-weight:700;color:var(--dsw-alias-label-primary);margin-top:2px}",
			".dsh-tc-wText{white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:19px;color:var(--dsw-alias-label-primary)}",
			".dsh-tc-wNote{font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary);background:rgba(148,163,184,.12);border-radius:8px;padding:4px 8px}",
			".dsh-tc-wUnsupported{font-size:11px;line-height:17px;color:var(--dsw-alias-state-warn-primary,#f59e0b)}",
			".dsh-tc-statRow{display:flex;gap:8px;flex-wrap:wrap}",
			".dsh-tc-stat{flex:1;min-width:76px;border:1px solid rgba(148,163,184,.2);border-radius:10px;padding:6px 9px;background:rgba(255,255,255,.35)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-stat{background:rgba(255,255,255,.05)}",
			".dsh-tc-statVal{font-size:16px;font-weight:700;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;line-height:22px}",
			".dsh-tc-statLabel{font-size:10.5px;color:var(--dsw-alias-label-tertiary);line-height:15px}",
			".dsh-tc-progHead{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--dsw-alias-label-secondary);line-height:16px}",
			".dsh-tc-progTrack{height:6px;border-radius:999px;background:rgba(148,163,184,.22);overflow:hidden;margin-top:3px}",
			".dsh-tc-progFill{height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(99,102,241,.9),rgba(56,189,248,.9));transition:width .3s ease}",
			".dsh-tc-chips{display:flex;flex-wrap:wrap;gap:5px}",
			".dsh-tc-chip{font-size:10.5px;line-height:16px;padding:1px 8px;border-radius:999px;background:rgba(99,102,241,.12);color:var(--dsw-alias-label-secondary)}",
			".dsh-tc-links{display:flex;flex-direction:column;gap:3px;min-width:0}",
			".dsh-tc-link{color:var(--dsw-alias-state-business-primary,#3b82f6);text-decoration:none;font-size:12px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dsh-tc-link:hover{text-decoration:underline}",
			".dsh-tc-check{display:flex;align-items:flex-start;gap:7px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);cursor:pointer;min-width:0}",
			".dsh-tc-check input{accent-color:#6366f1;margin:3px 0 0;flex:none}",
			".dsh-tc-checkLabel{flex:1;min-width:0;word-break:break-word}",
			".dsh-tc-checkDone{opacity:.55}",
			".dsh-tc-checkDone .dsh-tc-checkLabel{text-decoration:line-through}",
			".dsh-tc-count{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--dsw-alias-label-primary);min-width:0}",
			".dsh-tc-countLabel{flex:1;min-width:0}",
			".dsh-tc-countBtn{flex:none;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.4);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:1px 9px;font-size:13px;line-height:18px;cursor:pointer;font-family:inherit}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-countBtn{background:rgba(255,255,255,.07)}",
			".dsh-tc-countBtn:hover{background:rgba(99,102,241,.15);color:var(--dsw-alias-label-primary)}",
			".dsh-tc-countVal{min-width:4ch;text-align:center;font-weight:700;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}",
			".dsh-tc-wHead2{font-size:11px;font-weight:600;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-chat{width:min(580px,94vw);max-height:min(640px,88vh);display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:18px;border:1px solid rgba(148,163,184,.32);background:rgba(255,255,255,.95);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);box-shadow:0 26px 80px rgba(15,23,42,.32);overflow:hidden}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-chat{background:rgba(22,26,42,.96);border-color:rgba(148,163,184,.22)}",
			".dsh-tc-chatHead{flex:none;display:flex;flex-direction:column;gap:3px;min-width:0}",
			".dsh-tc-chatTitle{font-size:13.5px;font-weight:600;color:var(--dsw-alias-label-primary);min-width:0}",
			".dsh-tc-chatSub{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-chatBody{flex:1;min-height:150px;max-height:280px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:8px 10px;border:1px solid rgba(148,163,184,.22);border-radius:12px;background:rgba(255,255,255,.4)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-chatBody{background:rgba(255,255,255,.05)}",
			".dsh-tc-chatHint{font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-chatErr{font-size:11px;color:var(--dsw-alias-state-error-primary,#ef4444)}",
			".dsh-tc-chatInputRow{flex:none;display:flex;gap:8px;align-items:flex-end}",
			".dsh-tc-chatTa{flex:1;min-width:0;min-height:64px;max-height:160px;resize:vertical;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.65);color:var(--dsw-alias-label-primary);border-radius:10px;padding:7px 10px;font-size:12.5px;line-height:18px;outline:none;font-family:inherit;white-space:pre-wrap;word-break:break-word}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-chatTa{background:rgba(255,255,255,.07)}",
			".dsh-tc-chatTa:focus{border-color:rgba(99,102,241,.6);box-shadow:0 0 0 2px rgba(99,102,241,.16)}",
			".dsh-tc-chatFoot{flex:none;display:flex;gap:8px;align-items:center;justify-content:flex-end}",
			".dsh-tc-chatOverlay{position:absolute;inset:0;z-index:2147483600;display:flex;justify-content:flex-end;align-items:flex-start;padding:64px 20px 20px;background:rgba(15,23,42,.04)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-chatOverlay{background:rgba(2,4,12,.22)}",
			".dsh-tc-chat{animation:dsh-tc-chat-in .2s cubic-bezier(.22,1,.36,1);max-height:calc(100vh - 84px)}",
			"@keyframes dsh-tc-chat-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}",
			".dsh-tc-cardIcon{flex:none;font-size:15px;line-height:1.2;margin-right:-4px}",
			".dsh-tc-card[data-width=compact]{width:260px!important}",
			".dsh-tc-card[data-width=standard]{width:300px!important}",
			".dsh-tc-card[data-width=wide]{width:420px!important;max-width:calc(100% - 24px)!important}",
			".dsh-tc-card[data-density=cozy] .dsh-tc-cardBody{padding:10px 14px 14px}",
			".dsh-tc-card[data-density=cozy] .dsh-tc-blocks{gap:10px}",
			".dsh-tc-card[data-acc]::before{content:'';position:absolute;top:0;left:0;right:0;height:2.5px;background:linear-gradient(90deg,var(--dsh-tc-acc),transparent 75%);z-index:2;pointer-events:none}",
			".dsh-tc-card[data-acc] .dsh-tc-iconOn{color:var(--dsh-tc-acc)}",
			".dsh-tc-trend{display:flex;flex-direction:column;gap:3px;min-width:0}",
			".dsh-tc-trendHead{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary);line-height:16px;min-width:0}",
			".dsh-tc-trendLast{font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}",
			".dsh-tc-trendSvg{display:block;width:100%;height:52px;min-width:0}",
			".dsh-tc-tableWrap{overflow-x:auto;min-width:0}",
			".dsh-tc-table{width:100%;border-collapse:collapse;font-size:11.5px;line-height:16px}",
			".dsh-tc-table th{text-align:left;font-weight:600;color:var(--dsw-alias-label-tertiary);padding:3px 6px;border-bottom:1px solid rgba(148,163,184,.3)}",
			".dsh-tc-table td{padding:3px 6px;color:var(--dsw-alias-label-primary);border-bottom:1px solid rgba(148,163,184,.14);white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}",
			".dsh-tc-codeBox{display:flex;flex-direction:column;gap:4px;min-width:0}",
			".dsh-tc-codeHead{display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--dsw-alias-label-tertiary);min-width:0}",
			".dsh-tc-code{margin:0;padding:8px 10px;border-radius:9px;background:rgba(15,23,42,.06);font-family:var(--ds-font-family-code,monospace);font-size:11.5px;line-height:17px;white-space:pre-wrap;word-break:break-word;max-height:220px;overflow:auto}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-code{background:rgba(255,255,255,.07)}",
			".dsh-tc-switchRow{display:flex;align-items:center;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);cursor:pointer}",
			".dsh-tc-switch{appearance:none;-webkit-appearance:none;flex:none;width:32px;height:18px;border-radius:999px;background:rgba(148,163,184,.45);position:relative;cursor:pointer;transition:background .18s;margin:0}",
			".dsh-tc-switch:checked{background:var(--dsh-tc-acc,#6366f1)}",
			".dsh-tc-switch::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(15,23,42,.3);transition:transform .18s}",
			".dsh-tc-switch:checked::after{transform:translateX(14px)}",
			".dsh-tc-countdown{display:flex;align-items:baseline;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary);min-width:0}",
			".dsh-tc-countdownValue{font-variant-numeric:tabular-nums;font-weight:600;color:var(--dsh-tc-acc,#6366f1)}",
			".dsh-tc-bars{display:flex;flex-direction:column;gap:5px;min-width:0}",
			".dsh-tc-barRow{display:flex;align-items:center;gap:8px;font-size:11.5px;line-height:16px;min-width:0}",
			".dsh-tc-barLabel{flex:none;width:74px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
			".dsh-tc-barTrack{flex:1;min-width:0;height:7px;border-radius:999px;background:rgba(148,163,184,.22);overflow:hidden}",
			".dsh-tc-barFill{display:block;height:100%;border-radius:999px;background:var(--dsh-tc-acc,#6366f1);opacity:.85}",
			".dsh-tc-barValue{flex:none;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}",
			".dsh-tc-wRaw{margin-top:4px;display:flex;flex-direction:column;gap:2px;opacity:.85}",
			".dsh-tc-cardResize{position:absolute;right:2px;bottom:2px;width:16px;height:16px;cursor:nwse-resize;z-index:6;background:radial-gradient(circle at 100% 100%,rgba(148,163,184,.5) 0,transparent 11px)}",
			".dsh-tc-card[data-collapsed] .dsh-tc-cardResize{display:none}",
			".dsh-tc-card[data-sized]{max-width:calc(100% - 24px);min-height:120px}",
			".dsh-tc-card[data-sized] .dsh-tc-cardBody{max-height:none;flex:1;min-height:0}",
			".dsh-tc-card[data-collapsed][data-sized]{height:auto!important;min-height:0}",
			".dsh-tc-card{contain:layout style}",
			".dsh-tc-cardBusy{transition:none!important;will-change:transform;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(255,255,255,.78)!important;box-shadow:0 24px 60px rgba(15,23,42,.28)!important;cursor:grabbing}",
			"body[data-ds-dark-theme] .dsh-tc-cardBusy{background:rgba(30,34,52,.88)!important}",
			".dsh-tc-interacting .dsh-tc-panel::after{animation-play-state:paused}",
			".dsh-tc-interacting .dsh-tc-card{transition:none}",
			".dsh-tc-panel{contain:paint}",
			".dsh-tc-canvasView{position:absolute;inset:0;z-index:2147483500;display:flex;flex-direction:column;background:linear-gradient(165deg,rgba(249,250,255,.99),rgba(235,239,250,.97))}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-canvasView{background:linear-gradient(165deg,rgba(23,27,44,.99),rgba(13,16,28,.98))}",
			".dsh-tc-canvasBar{flex:none;display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(148,163,184,.22);flex-wrap:wrap}",
			".dsh-tc-canvasBarTitle{font-size:14px;font-weight:600;color:var(--dsw-alias-label-primary)}",
			".dsh-tc-canvasName{width:180px}",
			".dsh-tc-canvasSync{font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-canvasZoom{font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}",
			".dsh-tc-canvasHint{flex:none;padding:6px 14px;font-size:11px;color:var(--dsw-alias-label-secondary);background:rgba(99,102,241,.08)}",
			".dsh-tc-addPanel{flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 14px;border-bottom:1px solid rgba(148,163,184,.2);background:rgba(255,255,255,.45)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-addPanel{background:rgba(255,255,255,.05)}",
			".dsh-tc-addHint{font-size:11.5px;color:var(--dsw-alias-label-tertiary);margin-right:4px}",
			".dsh-tc-addChip{border:1px solid rgba(148,163,184,.4);background:rgba(255,255,255,.6);color:var(--dsw-alias-label-primary);border-radius:999px;padding:3px 10px;font-size:11.5px;cursor:pointer}",
			".dsh-tc-addChip:hover{border-color:rgba(99,102,241,.6);background:rgba(99,102,241,.14)}",
			".dsh-tc-quickEdit{max-width:520px}",
			".dsh-tc-quickJson{min-height:220px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}",
			".dsh-tc-canvasCollab{flex:none;display:flex;flex-direction:column;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(148,163,184,.2);background:rgba(255,255,255,.4)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-canvasCollab{background:rgba(255,255,255,.05)}",
			".dsh-tc-canvasCollabRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".dsh-tc-canvasScroll{position:relative;flex:1;min-height:0;overflow:hidden;cursor:grab;background-image:radial-gradient(rgba(148,163,184,.32) 1px,transparent 1px);background-size:24px 24px;background-position:0 0}",
			".dsh-tc-canvasScroll:active{cursor:grabbing}",
			".dsh-tc-canvasPlane{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}",
			".dsh-tc-card.dsh-tc-canvasCard{width:360px}",
			".dsh-tc-bare{position:absolute;min-width:180px;display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;border:1px dashed transparent;background:rgba(255,255,255,.5);box-shadow:0 6px 20px rgba(15,23,42,.08);cursor:default}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-bare{background:rgba(30,34,52,.6)}",
			".dsh-tc-bare:hover{border-color:rgba(99,102,241,.45);background:rgba(255,255,255,.72)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-bare:hover{background:rgba(30,34,52,.82)}",
			".dsh-tc-bare[data-kind=image],.dsh-tc-bare[data-kind=embed]{padding:6px}",
			".dsh-tc-bareTools{position:absolute;left:0;right:0;top:-22px;display:flex;align-items:center;gap:3px;height:20px;padding:0 2px;border-radius:8px;background:rgba(15,23,42,.86);color:#fff;font-size:10.5px;opacity:0;transition:opacity .12s;pointer-events:none;cursor:grab}",
			".dsh-tc-bare:hover .dsh-tc-bareTools,.dsh-tc-bare:focus-within .dsh-tc-bareTools{opacity:1;pointer-events:auto}",
			".dsh-tc-bare .dsh-tc-cardBusy .dsh-tc-bareTools{cursor:grabbing}",
			".dsh-tc-bareGrip{flex:none;padding:0 2px;opacity:.75}",
			".dsh-tc-bareLabel{flex:none;max-width:150px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;opacity:.9}",
			".dsh-tc-bareSpacer{flex:1;min-width:6px}",
			".dsh-tc-bareBtn{flex:none;border:0;background:transparent;color:rgba(255,255,255,.82);cursor:pointer;border-radius:5px;padding:1px 3px;font-size:11px;line-height:1}",
			".dsh-tc-bareBtn:hover{background:rgba(255,255,255,.18);color:#fff}",
			".dsh-tc-bareBtn.dsh-tc-iconDanger:hover{background:rgba(244,63,94,.3)}",
			".dsh-tc-bareBody{flex:1;min-height:0;min-width:0;overflow:hidden}",
			".dsh-tc-bareResize{position:absolute;right:1px;bottom:1px;width:14px;height:14px;cursor:nwse-resize;opacity:0;background:radial-gradient(circle at 100% 100%,rgba(99,102,241,.75) 0,transparent 10px)}",
			".dsh-tc-bare:hover .dsh-tc-bareResize{opacity:1}",
			".dsh-tc-canvasEmpty{position:absolute;left:40px;top:40px;font-size:12px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-imgWrap{margin:0;display:flex;flex-direction:column;gap:3px;min-width:0}",
			".dsh-tc-img{display:block;width:100%;height:auto;border-radius:10px}",
			".dsh-tc-imgCap{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-blocks[data-fill]{flex:1;min-height:0}",
			".dsh-tc-cardFoot{flex:none;margin-top:2px;padding-top:6px;border-top:1px dashed rgba(148,163,184,.32);font-size:10.5px;line-height:15px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-app{display:flex;flex-direction:column;min-width:0;border-radius:12px;overflow:hidden;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.5)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-app{background:rgba(255,255,255,.04)}",
			".dsh-tc-appFill{flex:1;min-height:220px}",
			".dsh-tc-appBar{flex:none;display:flex;align-items:center;gap:6px;padding:4px 6px 4px 8px;border-bottom:1px solid rgba(148,163,184,.22);background:rgba(248,250,252,.6)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-appBar{background:rgba(255,255,255,.05)}",
			".dsh-tc-appDot{flex:none;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#34d399,#0ea5e9)}",
			".dsh-tc-appTitle{font-size:11.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary)}",
			".dsh-tc-appHost{flex:1;min-width:0;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-appBtn{flex:none;border:0;background:transparent;cursor:pointer;font-size:12px;line-height:1;padding:3px 5px;border-radius:7px;color:var(--dsw-alias-label-secondary)}",
			".dsh-tc-appBtn:hover{background:rgba(99,102,241,.14);color:var(--dsw-alias-state-business-primary,#3b82f6)}",
			".dsh-tc-appWrap{position:relative;flex:none;min-width:0;background:#fff}",
			".dsh-tc-appFill .dsh-tc-appWrap{flex:1;min-height:0}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-appWrap{background:#0b1020}",
			".dsh-tc-appFrame{display:block;width:100%;height:100%;border:0;background:transparent}",
			".dsh-tc-appGrip{flex:none;position:relative;height:11px;cursor:ns-resize;touch-action:none;background:rgba(148,163,184,.12)}",
			".dsh-tc-appGrip:hover{background:rgba(99,102,241,.2)}",
			".dsh-tc-appGripBar{position:absolute;left:50%;top:4px;width:34px;height:3px;margin-left:-17px;border-radius:999px;background:rgba(100,116,139,.55)}",
			".dsh-tc-appGripLabel{position:absolute;right:6px;top:-16px;padding:1px 6px;border-radius:7px;font-size:10.5px;font-variant-numeric:tabular-nums;background:rgba(15,23,42,.82);color:#fff;opacity:0;transition:opacity .12s}",
			".dsh-tc-app[data-dragging] .dsh-tc-appGrip{background:rgba(99,102,241,.28)}",
			".dsh-tc-app[data-dragging] .dsh-tc-appGripLabel{opacity:1}",
			".dsh-tc-app[data-dragging] .dsh-tc-appFrame{pointer-events:none}",
			".dsh-tc-app[data-dragging]{user-select:none}",
			".dsh-tc-er{font-size:11px;line-height:17px;color:#e11d48}",
			".dsh-tc-diagramDock{position:absolute;top:0;right:0;bottom:0;z-index:6000;display:flex;flex-direction:column;min-width:380px;max-width:96vw;border-left:1px solid rgba(148,163,184,.28);background:linear-gradient(165deg,rgba(249,250,255,.985),rgba(235,239,250,.97));box-shadow:-20px 0 52px rgba(15,23,42,.2);animation:dsh-tc-dock-in .26s cubic-bezier(.22,1,.36,1) both}",
			".dsh-tc-full{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.5);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);animation:dsh-tc-full-in .18s ease-out both}",
			"@keyframes dsh-tc-full-in{from{opacity:0}to{opacity:1}}",
			".dsh-tc-fullCard{position:relative;display:flex;flex-direction:column;width:min(1680px,97vw);height:min(1200px,94vh);border-radius:18px;overflow:hidden;border:1px solid rgba(148,163,184,.32);background:linear-gradient(165deg,rgba(249,250,255,.99),rgba(235,239,250,.98));box-shadow:0 40px 120px rgba(15,23,42,.45);animation:dsh-tc-full-card .22s cubic-bezier(.22,1,.36,1) both}",
			"@keyframes dsh-tc-full-card{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-fullCard{background:linear-gradient(165deg,rgba(23,27,44,.99),rgba(13,16,28,.985))}",
			".dsh-tc-fullCard:fullscreen{border-radius:0;border:0;width:100%;height:100%}",
			".dsh-tc-fullHead{cursor:default;padding:12px 14px;touch-action:auto}",
			".dsh-tc-fullHead .dsh-tc-cardTitle{font-size:15px}",
			".dsh-tc-fullHint{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-fullBody{flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:12px 14px 14px;overflow:auto}",
			".dsh-tc-fullBody[data-fill]{min-height:0;overflow:hidden}",
			".dsh-tc-fullBody .dsh-tc-appFill{min-height:0}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-diagramDock{background:linear-gradient(165deg,rgba(23,27,44,.99),rgba(13,16,28,.985))}",
			"@keyframes dsh-tc-dock-in{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}",
			".dsh-tc-diagramGrip{position:absolute;left:-4px;top:0;bottom:0;width:9px;z-index:2;cursor:col-resize;background:transparent}",
			".dsh-tc-diagramGrip:hover,.dsh-tc-diagramGrip[data-dragging]{background:linear-gradient(180deg,rgba(99,102,241,0),rgba(99,102,241,.4),rgba(99,102,241,0))}",
			".dsh-tc-diagramBar{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(148,163,184,.22)}",
			".dsh-tc-diagramTitle{font-size:13.5px;font-weight:600;white-space:nowrap;color:var(--dsw-alias-label-primary)}",
			".dsh-tc-diagramMeta{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-diagramBody{position:relative;flex:1;min-height:0;background:#0b1020}",
			".dsh-tc-diagramFrame{display:block;width:100%;height:100%;border:0}",
			".dsh-tc-diagramState{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center;font-size:12px;background:rgba(248,250,252,.96);color:var(--dsw-alias-label-secondary)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-diagramState{background:rgba(15,18,32,.96)}",
			".dsh-tc-diagramErr{max-width:420px;word-break:break-word;color:#e11d48}"
		].join("");
		const TASK_TAG_ID = "dsh-task-console/styles";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(TASK_TAG_ID) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-task-console";
			tag.dataset.pluginCss = TASK_TAG_ID;
			tag.textContent = TASK_CSS + TASK_CSS_EXTRA;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region constants + helpers
		const TASK_STORAGE_KEY = "dsh.taskconsole.v1";
		const TASK_SPEC_KEY = "dsh.taskconsole.specs.v1";
		const TASK_USER_PREFIX = "usr-";
		const TASK_TITLE_LIMIT = 80;
		const TASK_BODY_LIMIT = 4000;
		const TASK_BUTTON_LIMIT = 8;
		const TASK_CARD_DEFAULTS = {
			"session": { x: 24, y: 24, collapsed: false, hidden: false },
			"jobs": { x: 352, y: 24, collapsed: false, hidden: false },
			"subagents": { x: 24, y: 288, collapsed: false, hidden: false },
			"workspace": { x: 396, y: 288, collapsed: false, hidden: false },
			"plugins": { x: 24, y: 540, collapsed: false, hidden: false }
		};
		/** Cascade landing slots for freshly created user cards (top-left bias). */
		const TASK_CARD_SLOTS = [
			{ x: 24, y: 24 }, { x: 340, y: 24 }, { x: 656, y: 24 },
			{ x: 24, y: 292 }, { x: 340, y: 292 }, { x: 656, y: 292 },
			{ x: 24, y: 560 }, { x: 340, y: 560 }, { x: 656, y: 560 },
			{ x: 24, y: 828 }, { x: 340, y: 828 }, { x: 656, y: 828 }
		];
		/** Approximate occupied box (width x height) used by the cascade placer. */
		const TASK_SLOT_BOX = { width: 316, height: 214 };
		/** Mouse-resize bounds for one card (px). */
		const TASK_CARD_MIN_W = 220;
		const TASK_CARD_MAX_W = 900;
		const TASK_CARD_MIN_H = 120;
		const TASK_CARD_MAX_H = 1200;
		/** Clamp a persisted card dimension; undefined when absent or not a number. */
		function clampTaskCardSize(value, min, max) {
			return typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(min, Math.round(value)), max) : void 0;
		}
		/** Fresh default layout for every built-in card (never merges saved state). */
		function freshTaskCards() {
			const cards = {};
			for (const key of Object.keys(TASK_CARD_DEFAULTS)) cards[key] = { ...TASK_CARD_DEFAULTS[key] };
			return cards;
		}
		/** The built-in card ids in their canonical stacking order. */
		function builtinTaskCardIds() {
			return Object.keys(TASK_CARD_DEFAULTS);
		}
		/** True for a user card entry (carries authored content), never a bare built-in slot. */
		function isUserTaskCard(card) {
			return card !== null && typeof card === "object" && (typeof card.title === "string" || typeof card.body === "string" || Array.isArray(card.blocks));
		}
		function clampTaskNumber(value, fallback) {
			return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
		}
		/** Validate one action button row; vocabulary: copy / link / fill (into the main composer). Null when unusable. */
		function sanitizeTaskButton(raw) {
			if (raw === null || typeof raw !== "object") return null;
			const action = raw.action === "link" ? "link" : raw.action === "fill" ? "fill" : "copy";
			const label = typeof raw.label === "string" && raw.label.trim().length > 0 ? raw.label.trim().slice(0, 24) : (action === "link" ? "打开链接" : action === "fill" ? "填入输入框" : "复制");
			const value = typeof raw.value === "string" ? raw.value.trim().slice(0, 1024) : "";
			if (value.length === 0) return null;
			return { action, label, value };
		}
		/** Validate a whole button list (bounded count, invalid rows dropped). */
		function sanitizeTaskButtons(value) {
			if (!Array.isArray(value)) return [];
			return value.slice(0, TASK_BUTTON_LIMIT).map(sanitizeTaskButton).filter((button) => button !== null);
		}
		/** Bounds for the declarative control blocks a conversation can author. */
		const TASK_BLOCK_LIMIT = 16;
		/** Single source of truth for the control kinds the client can render. */
		const TASK_BLOCK_KINDS = ["text", "heading", "note", "stats", "progress", "trend", "kv", "links", "chips", "checklist", "counter", "button", "table", "code", "toggle", "countdown", "bars", "embed"];
		/** Bounds for embedded web apps on a card. */
		const TASK_EMBED_LIMIT = 4;
		const TASK_EMBED_MIN_H = 120;
		const TASK_EMBED_MAX_H = 1200;
		const TASK_EMBED_DEFAULT_H = 300;
		const TASK_EMBED_URL_LIMIT = 2048;
		/** Sandbox for a cross-origin app frame: it may run, keep its own storage and open its own windows. */
		const TASK_EMBED_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-presentation";
		/** Same-origin pages get an opaque origin instead, so an embedded copy of this app cannot script it. */
		const TASK_EMBED_SANDBOX_OPAQUE = "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-presentation";
		const TASK_EMBED_ALLOW = "clipboard-write; clipboard-read; fullscreen; autoplay; encrypted-media; picture-in-picture; geolocation; camera; microphone; display-capture";
		/**
		 * Validate one embedded web-app URL. Only absolute `http(s)` URLs are accepted —
		 * exactly what an iframe can load — so `javascript:`, `data:`, `file:`, `blob:`
		 * and scheme-relative URLs can never reach the frame.
		 */
		function cleanTaskEmbedUrl(value) {
			if (typeof value !== "string") return null;
			const raw = value.trim().slice(0, TASK_EMBED_URL_LIMIT);
			if (!/^https?:\/\//i.test(raw)) return null;
			try {
				const parsed = new URL(raw);
				if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
				if (parsed.hostname.length === 0) return null;
				return parsed.href.slice(0, TASK_EMBED_URL_LIMIT);
			} catch {
				return null;
			}
		}
		/** Host (and port) of an embedded app URL, for the card's app bar. */
		function taskEmbedHost(url) {
			try {
				return new URL(url).host;
			} catch {
				return url;
			}
		}
		/** True when `url` resolves to the very origin this page runs on. */
		function taskEmbedIsSameOrigin(url) {
			if (typeof location === "undefined") return false;
			try {
				return new URL(url).origin === location.origin;
			} catch {
				return false;
			}
		}
		function clampTaskEmbedHeight(value) {
			if (typeof value !== "number" || !Number.isFinite(value)) return TASK_EMBED_DEFAULT_H;
			return Math.min(Math.max(Math.round(value), TASK_EMBED_MIN_H), TASK_EMBED_MAX_H);
		}
		/**
		 * Set one embed block's height (the drag on the app's bottom edge) and return a
		 * new card. Returns null when there is nothing to do, so callers can skip a commit.
		 */
		function patchTaskEmbedHeight(card, blockIndex, height) {
			if (card === null || typeof card !== "object" || !Array.isArray(card.blocks)) return null;
			if (typeof blockIndex !== "number" || !Number.isInteger(blockIndex) || blockIndex < 0 || blockIndex >= card.blocks.length) return null;
			if (typeof height !== "number" || !Number.isFinite(height)) return null;
			const block = card.blocks[blockIndex];
			if (block === null || typeof block !== "object" || block.kind !== "embed" || block.fill === true) return null;
			const next = clampTaskEmbedHeight(height);
			if (next === block.height) return null;
			const blocks = card.blocks.slice();
			blocks[blockIndex] = { ...block, height: next };
			return { ...card, blocks };
		}
		const TASK_WIDGET_TEXT_LIMIT = 4000;
		function cleanTaskBlockText(value, limit) {
			return typeof value === "string" ? value.slice(0, limit) : "";
		}
		/** Stable scope key for one block's interactive state (the card.widgets map). */
		function taskBlockScope(block, index) {
			if (block !== null && typeof block === "object" && typeof block.key === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(block.key)) return block.key;
			return "b" + index;
		}
		/** Fresh stable id for one control block (stamped when a card is exploded into a canvas). */
		function nextTaskBlockId() {
			return "blk-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
		}
		/** Kinds offered by the canvas' "+ 控件" menu (everything with usable starter content). */
		const TASK_CANVAS_ADD_KINDS = ["text", "heading", "note", "stats", "progress", "trend", "kv", "links", "chips", "checklist", "counter", "button", "table", "code", "toggle", "countdown", "bars", "embed"];
		/** Starter content for a control dropped straight onto a canvas. */
		function taskBlockDefault(kind) {
			switch (kind) {
				case "text": return { kind, text: "新文本：双击或点 ✎ 改写" };
				case "heading": return { kind, text: "小标题" };
				case "note": return { kind, text: "说明文字" };
				case "stats": return { kind, items: [{ label: "指标", value: "0" }] };
				case "progress": return { kind, label: "进度", value: 1, max: 3, unit: "" };
				case "trend": return { kind, label: "趋势", unit: "", values: [1, 3, 2, 4] };
				case "kv": return { kind, rows: [["键", "值"]] };
				case "links": return { kind, items: [{ label: "链接", url: "https://example.com/" }] };
				case "chips": return { kind, items: ["标签"] };
				case "checklist": return { kind, key: "chk-" + Math.random().toString(36).slice(2, 6), items: [{ id: "a", label: "第一项" }, { id: "b", label: "第二项" }] };
				case "counter": return { kind, key: "cnt-" + Math.random().toString(36).slice(2, 6), label: "计数", step: 1, min: 0, max: 999999 };
				case "button": return { kind, action: "copy", label: "复制", value: "要复制的文本" };
				case "table": return { kind, columns: ["列 A", "列 B"], rows: [["a1", "b1"]] };
				case "code": return { kind, language: "", text: "// 代码片段" };
				case "toggle": return { kind, key: "sw-" + Math.random().toString(36).slice(2, 6), label: "开关", value: false };
				case "countdown": return { kind, label: "倒计时", until: Date.now() + 3600000, done: "时间到" };
				case "bars": return { kind, label: "占比", items: [{ label: "A", value: 3 }, { label: "B", value: 1 }] };
				case "image": return { kind, src: "", caption: "" };
				case "embed": return { kind, url: "https://example.com/", title: "网页应用", height: TASK_EMBED_DEFAULT_H, fill: false };
				default: return { kind: "text", text: "新文本" };
			}
		}
		/** Field a quick edit writes for one control kind (empty when the control needs the JSON editor). */
		const TASK_BLOCK_TEXT_FIELD = {
			text: "text",
			heading: "text",
			note: "text",
			code: "text",
			progress: "label",
			trend: "label",
			countdown: "label",
			toggle: "label",
			counter: "label",
			bars: "label",
			button: "label",
			chips: "label",
			stats: "label",
		};
		const TASK_BLOCK_FIELD_LABEL = {
			text: "内容",
			label: "标题 / 标签",
			src: "图片地址（https 或 data:image/…）",
			url: "应用地址（http/https）",
			caption: "图片说明",
		};
		const TASK_BLOCK_LABELS = {
			text: "文本",
			heading: "小标题",
			note: "说明",
			stats: "统计",
			progress: "进度",
			trend: "趋势",
			kv: "键值",
			links: "链接",
			chips: "标签",
			image: "图片",
			embed: "网页应用",
			checklist: "清单",
			counter: "计数",
			button: "按钮",
			table: "表格",
			code: "代码",
			toggle: "开关",
			countdown: "倒计时",
			bars: "条形图"
		};
		/** Title of one control's canvas item: what it is, plus a short excerpt of its content. */
		function taskBlockLabel(block) {
			if (block === null || typeof block !== "object") return "控件";
			const kind = TASK_BLOCK_LABELS[block.kind] ?? (typeof block.requested === "string" ? block.requested : "控件");
			let excerpt = "";
			if (typeof block.text === "string") excerpt = block.text;
			else if (typeof block.label === "string") excerpt = block.label;
			else if (typeof block.title === "string") excerpt = block.title;
			else if (typeof block.url === "string") excerpt = block.url;
			else if (Array.isArray(block.items) && block.items.length > 0) {
				const first = block.items[0];
				excerpt = typeof first === "string" ? first : typeof first?.label === "string" ? first.label : "";
			} else if (Array.isArray(block.rows) && block.rows.length > 0) {
				excerpt = Array.isArray(block.rows[0]) ? String(block.rows[0][0] ?? "") : "";
			}
			const clean = excerpt.replace(/\s+/g, " ").trim().slice(0, 18);
			return clean.length > 0 ? kind + " · " + clean : kind;
		}
		/**
		 * Validate one control block into its persisted shape. Unknown kinds are
		 * kept as an explicit unsupported placeholder so a conversation never
		 * silently loses content.
		 */
		function sanitizeTaskBlockFields(raw, index) {
			if (raw === null || typeof raw !== "object") return null;
			const kind = typeof raw.kind === "string" ? raw.kind : "";
			const key = typeof raw.key === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(raw.key.trim()) ? raw.key.trim() : void 0;
			// `bid` is the control's stable identity: it survives every sanitize round-trip
			// and lets a canvas item keep pointing at "its" control after reordering.
			const bid = typeof raw.bid === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(raw.bid.trim()) ? raw.bid.trim() : void 0;
			const base = {};
			if (key !== void 0) base.key = key;
			if (bid !== void 0) base.bid = bid;
			switch (kind) {
				case "text": {
					const text = cleanTaskBlockText(raw.text, TASK_WIDGET_TEXT_LIMIT).trim();
					if (text.length === 0) return null;
					return { kind, text };
				}
				case "heading": {
					const text = cleanTaskBlockText(raw.text, 100).trim();
					if (text.length === 0) return null;
					return { kind, text };
				}
				case "note": {
					const text = cleanTaskBlockText(raw.text, 300).trim();
					if (text.length === 0) return null;
					return { kind, text };
				}
				case "stats": {
					const items = Array.isArray(raw.items) ? raw.items.slice(0, 8).map((item) => {
						if (item === null || typeof item !== "object") return null;
						const label = typeof item.label === "string" ? item.label.trim().slice(0, 40) : "";
						const value = item.value === null || item.value === void 0 ? "" : String(item.value).slice(0, 40);
						if (label.length === 0 && value.length === 0) return null;
						return { label, value };
					}).filter((item) => item !== null) : [];
					if (items.length === 0) return null;
					return { kind, items };
				}
				case "progress": {
					const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : "";
					const value = typeof raw.value === "number" && Number.isFinite(raw.value) ? Math.max(0, Math.min(1e6, raw.value)) : 0;
					const max = typeof raw.max === "number" && Number.isFinite(raw.max) && raw.max > 0 ? Math.min(1e6, raw.max) : Math.max(value, 1);
					const unit = typeof raw.unit === "string" ? raw.unit.trim().slice(0, 12) : "";
					return { kind, label, value, max, unit };
				}
				case "kv": {
					const feed = Array.isArray(raw.rows) ? raw.rows : Array.isArray(raw.items) ? raw.items : [];
					const rows = feed.slice(0, 12).map((row) => {
						if (Array.isArray(row)) {
							if (row.length < 2) return null;
							const pairKey = String(row[0] ?? "").slice(0, 40).trim();
							const pairValue = String(row[1] ?? "").slice(0, 200).trim();
							if (pairKey.length === 0 && pairValue.length === 0) return null;
							return [pairKey, pairValue];
						}
						// `items: [{ key|label, value }]` is accepted alongside `rows: [[k, v]]`.
						if (row === null || typeof row !== "object") return null;
						const itemKey = String(row.key ?? row.label ?? "").slice(0, 40).trim();
						const itemValue = String(row.value ?? "").slice(0, 200).trim();
						if (itemKey.length === 0 && itemValue.length === 0) return null;
						return [itemKey, itemValue];
					}).filter((row) => row !== null);
					if (rows.length === 0) return null;
					return { kind, rows };
				}
				case "links": {
					const items = Array.isArray(raw.items) ? raw.items.slice(0, 12).map((item) => {
						if (item === null || typeof item !== "object") return null;
						const url = typeof item.url === "string" ? item.url.trim().slice(0, 1024) : "";
						if (!/^https?:\/\//i.test(url)) return null;
						const label = typeof item.label === "string" && item.label.trim().length > 0 ? item.label.trim().slice(0, 60) : url;
						return { label, url };
					}).filter((item) => item !== null) : [];
					if (items.length === 0) return null;
					return { kind, items };
				}
				case "chips": {
					const items = Array.isArray(raw.items) ? raw.items.slice(0, 12).map((item) => {
						if (typeof item === "string") return item.trim().slice(0, 24);
						if (item !== null && typeof item === "object" && typeof item.label === "string") return item.label.trim().slice(0, 24);
						return "";
					}).filter((text) => text.length > 0) : [];
					if (items.length === 0) return null;
					return { kind, items };
				}
				case "checklist": {
					const items = Array.isArray(raw.items) ? raw.items.slice(0, 24).map((item, itemIndex) => {
						if (item === null || typeof item !== "object") return null;
						const id = typeof item.id === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(item.id.trim()) ? item.id.trim() : "i" + itemIndex;
						const label = typeof item.label === "string" ? item.label.trim().slice(0, 200) : "";
						if (label.length === 0) return null;
						return { id, label };
					}).filter((item) => item !== null) : [];
					if (items.length === 0) return null;
					return { ...base, kind, items };
				}
				case "counter": {
					const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : "计数";
					const step = typeof raw.step === "number" && Number.isFinite(raw.step) && raw.step > 0 ? Math.min(1e6, Math.round(raw.step)) : 1;
					const max = typeof raw.max === "number" && Number.isFinite(raw.max) ? Math.round(raw.max) : 999999;
					const min = typeof raw.min === "number" && Number.isFinite(raw.min) ? Math.round(raw.min) : 0;
					return { ...base, kind, label, step, min: Math.min(min, max), max };
				}
				case "image": {
					const src = typeof raw.src === "string" ? raw.src.trim() : "";
					const allowed = src.startsWith("https://") || src.startsWith("http://") || src.startsWith("data:image/");
					if (!allowed || src.length > CANVAS_IMAGE_LIMIT) return null;
					const caption = typeof raw.caption === "string" ? raw.caption.trim().slice(0, 200) : "";
					const alt = typeof raw.alt === "string" ? raw.alt.trim().slice(0, 200) : caption;
					return { kind, src, caption, alt };
				}
				case "button": {
					const button = sanitizeTaskButton(raw);
					if (button === null) return null;
					return { ...base, kind, action: button.action, label: button.label, value: button.value };
				}
				case "embed": {
					const url = cleanTaskEmbedUrl(raw.url !== void 0 ? raw.url : raw.src);
					if (url === null) return null;
					const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 80) : "";
					const fill = raw.fill === true;
					return { ...base, kind, url, title, fill, height: clampTaskEmbedHeight(raw.height) };
				}
				case "trend": {
					const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : "";
					const unit = typeof raw.unit === "string" ? raw.unit.trim().slice(0, 12) : "";
					const items = [];
					const feed = Array.isArray(raw.points) ? raw.points : Array.isArray(raw.values) ? raw.values : [];
					for (const source of feed.slice(0, 48)) {
						if (typeof source === "number" && Number.isFinite(source)) {
							items.push({ label: "", value: source });
							continue;
						}
						if (source === null || typeof source !== "object" || Array.isArray(source)) continue;
						const value = typeof source.value === "number" && Number.isFinite(source.value) ? source.value : null;
						if (value === null) continue;
						const itemLabel = typeof source.label === "string" ? source.label.trim().slice(0, 20) : "";
						items.push({ label: itemLabel, value });
					}
					if (items.length < 2) return null;
					return { kind, label, unit, items };
				}
				case "table": {
					const columns = Array.isArray(raw.columns) ? raw.columns.slice(0, 6).map((column) => String(column ?? "").trim().slice(0, 40)).filter((column) => column.length > 0) : [];
					if (columns.length === 0) return null;
					const rows = Array.isArray(raw.rows) ? raw.rows.slice(0, 20).map((row) => {
						const cells = Array.isArray(row) ? row : [];
						const normalized = [];
						let any = false;
						for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
							const cell = String(cells[columnIndex] ?? "").trim().slice(0, 80);
							if (cell.length > 0) any = true;
							normalized.push(cell);
						}
						return any ? normalized : null;
					}).filter((row) => row !== null) : [];
					if (rows.length === 0) return null;
					return { kind, columns, rows };
				}
				case "code": {
					const text = cleanTaskBlockText(raw.text, TASK_WIDGET_TEXT_LIMIT).replace(/\s+$/, "");
					if (text.trim().length === 0) return null;
					const language = typeof raw.language === "string" ? raw.language.trim().slice(0, 20) : "";
					return { kind, text, language };
				}
				case "toggle": {
					const label = typeof raw.label === "string" && raw.label.trim().length > 0 ? raw.label.trim().slice(0, 60) : "开关";
					return { ...base, kind, label, value: raw.value === true };
				}
				case "countdown": {
					const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : "";
					let until = null;
					if (typeof raw.until === "number" && Number.isFinite(raw.until)) until = Math.round(raw.until);
					else if (typeof raw.until === "string") {
						const parsed = Date.parse(raw.until);
						if (Number.isFinite(parsed)) until = parsed;
					}
					if (until === null) return null;
					const done = typeof raw.done === "string" ? raw.done.trim().slice(0, 40) : "";
					return { kind, label, until, done };
				}
				case "bars": {
					const label = typeof raw.label === "string" ? raw.label.trim().slice(0, 40) : "";
					const items = Array.isArray(raw.items) ? raw.items.slice(0, 12).map((item) => {
						if (item === null || typeof item !== "object") return null;
						const itemLabel = typeof item.label === "string" ? item.label.trim().slice(0, 40) : "";
						const value = typeof item.value === "number" && Number.isFinite(item.value) ? Math.max(-1e6, Math.min(1e6, item.value)) : null;
						if (value === null) return null;
						return { label: itemLabel, value };
					}).filter((item) => item !== null) : [];
					if (items.length === 0) return null;
					return { kind, label, items };
				}
				default: {
					// Keep the original primitive fields so a future client can upgrade this block
					// (e.g. when a control kind ships later) instead of losing the content.
					const snapshot = {};
					for (const [key, value] of Object.entries(raw)) {
						if (key === "kind") continue;
						const type = typeof value;
						if (type === "string") snapshot[key] = value.slice(0, 4000);
						else if (type === "number" || type === "boolean" || value === null) snapshot[key] = value;
					}
					return { kind: "unknown", requested: kind.length > 0 ? kind.slice(0, 40) : "(空)", raw: snapshot };
				}
			}
		}
		/**
		 * Validate one control block, carrying its stable `key` (widget scope) and `bid`
		 * (control identity, used to bind a canvas item) through every kind.
		 */
		function sanitizeTaskBlock(raw, index) {
			const block = sanitizeTaskBlockFields(raw, index);
			if (block === null || typeof block !== "object" || raw === null || typeof raw !== "object") return block;
			const out = { ...block };
			if (typeof raw.key === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(raw.key.trim())) out.key = raw.key.trim();
			if (typeof raw.bid === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(raw.bid.trim())) out.bid = raw.bid.trim();
			return out;
		}
		/** Validate a whole control list (bounded count); stored unknown blocks upgrade when possible. */
		function sanitizeTaskBlocks(value) {
			if (!Array.isArray(value)) return [];
			return value.slice(0, TASK_BLOCK_LIMIT).map((raw, index) => {
				const block = sanitizeTaskBlock(raw, index);
				if (block !== null && block.kind === "unknown" && block.raw !== void 0) {
					const upgraded = sanitizeTaskBlock(block.raw, index);
					if (upgraded !== null && upgraded.kind !== "unknown") return upgraded;
				}
				return block;
			}).filter((block) => block !== null);
		}
		/** Card visual style vocabulary (declarative, allow-listed). */
		const TASK_STYLE_ACCENTS = {
			indigo: "#6366f1",
			blue: "#3b82f6",
			sky: "#0ea5e9",
			emerald: "#10b981",
			amber: "#f59e0b",
			rose: "#f43f5e",
			violet: "#8b5cf6"
		};
		const TASK_STYLE_WIDTHS = { compact: 260, standard: 300, wide: 420 };
		const TASK_STYLE_DENSITIES = { compact: true, cozy: true };
		/** Validate a card style object; empty/invalid styles become undefined. */
		function sanitizeTaskStyle(raw) {
			if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return void 0;
			const out = {};
			if (typeof raw.accent === "string" && Object.prototype.hasOwnProperty.call(TASK_STYLE_ACCENTS, raw.accent)) out.accent = raw.accent;
			if (typeof raw.width === "string" && Object.prototype.hasOwnProperty.call(TASK_STYLE_WIDTHS, raw.width)) out.width = raw.width;
			if (typeof raw.density === "string" && Object.prototype.hasOwnProperty.call(TASK_STYLE_DENSITIES, raw.density)) out.density = raw.density;
			if (typeof raw.icon === "string") {
				const icon = Array.from(raw.icon.trim()).slice(0, 6).join("");
				if (icon.length > 0) out.icon = icon;
			}
			return Object.keys(out).length > 0 ? out : void 0;
		}
		/** Resolve an accent name to its hex color (undefined for unknown names). */
		function taskStyleAccentColor(accent) {
			return accent !== void 0 && Object.prototype.hasOwnProperty.call(TASK_STYLE_ACCENTS, accent) ? TASK_STYLE_ACCENTS[accent] : void 0;
		}
		/** Lightly validate the persisted interactive widget state of a card. */
		function sanitizeTaskWidgets(saved) {
			if (saved === null || typeof saved !== "object" || Array.isArray(saved)) return void 0;
			const out = {};
			for (const [scope, value] of Object.entries(saved)) {
				if (scope.length === 0 || scope.length > 80) continue;
				if (value === true || value === false) { out[scope] = value; continue; }
				if (typeof value === "number" && Number.isFinite(value)) { out[scope] = Math.max(-1e9, Math.min(1e9, Math.round(value))); continue; }
				if (value !== null && typeof value === "object") {
					const checked = {};
					let any = false;
					for (const [item, flag] of Object.entries(value)) {
						if (item.length > 64) continue;
						if (flag === true || flag === false) { checked[item] = flag; any = true; }
					}
					if (any) out[scope] = checked;
				}
			}
			return Object.keys(out).length > 0 ? out : void 0;
		}
		/** Ordered control blocks for a user card: new `blocks` or legacy body/buttons. */
		function effectiveTaskBlocks(card) {
			if (Array.isArray(card.blocks) && card.blocks.length > 0) return card.blocks;
			const blocks = [];
			if (typeof card.body === "string" && card.body.trim().length > 0) blocks.push({ kind: "text", text: card.body });
			for (const button of Array.isArray(card.buttons) ? card.buttons : []) {
				if (button !== null && typeof button === "object") blocks.push({ kind: "button", action: button.action, label: button.label, value: button.value });
			}
			return blocks;
		}
		/** Validate an incoming/stored user-card entry into its persisted shape. */
		function sanitizeTaskCardEntry(saved, fallbackTitle) {
			const entry = {
				x: clampTaskNumber(saved.x, 24),
				y: clampTaskNumber(saved.y, 24),
				collapsed: saved.collapsed === true,
				hidden: saved.hidden === true,
				pinned: saved.pinned === true
			};
			if (typeof saved.title === "string") entry.title = saved.title.slice(0, TASK_TITLE_LIMIT);
			else if (typeof fallbackTitle === "string") entry.title = fallbackTitle;
			const width = clampTaskCardSize(saved.w, TASK_CARD_MIN_W, TASK_CARD_MAX_W);
			if (width !== void 0) entry.w = width;
			const height = clampTaskCardSize(saved.h, TASK_CARD_MIN_H, TASK_CARD_MAX_H);
			if (height !== void 0) entry.h = height;
			if (typeof saved.body === "string") entry.body = saved.body.slice(0, TASK_BODY_LIMIT);
			if (Array.isArray(saved.buttons)) entry.buttons = sanitizeTaskButtons(saved.buttons);
			if (Array.isArray(saved.blocks)) {
				const blocks = sanitizeTaskBlocks(saved.blocks);
				if (blocks.length > 0) entry.blocks = blocks;
			}
			if (saved.style !== void 0) {
				const style = sanitizeTaskStyle(saved.style);
				if (style !== void 0) entry.style = style;
			}
			if (saved.widgets !== void 0) {
				const widgets = sanitizeTaskWidgets(saved.widgets);
				if (widgets !== void 0) entry.widgets = widgets;
			}
			const created = typeof saved.createdAt === "number" && Number.isFinite(saved.createdAt) ? saved.createdAt : Date.now();
			entry.createdAt = created;
			entry.updatedAt = typeof saved.updatedAt === "number" && Number.isFinite(saved.updatedAt) ? saved.updatedAt : created;
			return entry;
		}
		/** Random stable id for a fresh user card. */
		function nextUserTaskCardId() {
			return TASK_USER_PREFIX + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
		}
		/** First free cascade slot that does not overlap an existing visible card. */
		function cascadeTaskCardSpot(cards) {
			const taken = Object.keys(cards).filter((key) => cards[key].hidden !== true).map((key) => cards[key]);
			const free = TASK_CARD_SLOTS.find((slot) => !taken.some((card) => Math.abs(card.x - slot.x) < TASK_SLOT_BOX.width && Math.abs(card.y - slot.y) < TASK_SLOT_BOX.height));
			if (free !== void 0) return { ...free };
			const bottom = taken.reduce((max, card) => Math.max(max, card.y), 0) + TASK_SLOT_BOX.height;
			return { x: 24, y: bottom };
		}
		/** Deterministic stacking order over a card set (built-ins first, canonical order). */
		function rebuildTaskCardOrder(cards, order) {
			const builtins = builtinTaskCardIds();
			const next = [];
			if (Array.isArray(order)) {
				for (const id of order) {
					if (typeof id !== "string" || next.indexOf(id) !== -1) continue;
					if (builtins.indexOf(id) !== -1 || cards[id] !== void 0) next.push(id);
				}
			}
			for (const id of builtins) if (next.indexOf(id) === -1) next.push(id);
			for (const id of Object.keys(cards)) if (next.indexOf(id) === -1) next.push(id);
			return next;
		}
		/** Read the persisted board state (built-ins merged over defaults + adopted user cards). */
		function readTaskState() {
			if (typeof localStorage === "undefined") return null;
			try {
				const raw = localStorage.getItem(TASK_STORAGE_KEY);
				if (raw === null) return null;
				const parsed = JSON.parse(raw);
				if (parsed === null || typeof parsed !== "object") return null;
				const cards = freshTaskCards();
				const rawCards = parsed.cards;
				if (rawCards !== null && typeof rawCards === "object") {
					for (const [key, saved] of Object.entries(rawCards)) {
						if (saved === null || typeof saved !== "object") continue;
						if (key in cards) {
							for (const field of ["x", "y"]) {
								if (typeof saved[field] === "number" && Number.isFinite(saved[field])) cards[key][field] = Math.max(0, Math.round(saved[field]));
							}
							const width = clampTaskCardSize(saved.w, TASK_CARD_MIN_W, TASK_CARD_MAX_W);
							if (width !== void 0) cards[key].w = width;
							const height = clampTaskCardSize(saved.h, TASK_CARD_MIN_H, TASK_CARD_MAX_H);
							if (height !== void 0) cards[key].h = height;
							for (const field of ["collapsed", "hidden", "pinned"]) {
								if (typeof saved[field] === "boolean") cards[key][field] = saved[field];
							}
						} else {
							const user = sanitizeTaskCardEntry(saved);
							if (user.title !== void 0 || user.body !== void 0 || Array.isArray(user.blocks)) cards[key] = user;
						}
					}
				}
				const order = rebuildTaskCardOrder(cards, parsed.order);
				return { cards, order };
			} catch {
				return null;
			}
		}
		/** Persist the board state; storage failures are ignored (the board still works). */
		function writeTaskState(state) {
			if (typeof localStorage === "undefined") return;
			try {
				localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(state));
			} catch {
				/* storage may be unavailable (private mode) */
			}
		}
		/** Compatibility cards-only accessors (kept for the smoke hooks). */
		function loadTaskCards() {
			const state = readTaskState();
			return state === null ? null : state.cards;
		}
		function saveTaskCards(cards, order) {
			writeTaskState({ cards, order: rebuildTaskCardOrder(cards, order) });
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
			const { id, title, badge, layout, zIndex, boardRef, actions, onDragCommit, onResizeCommit, children } = props;
			const cardRef = (0, react.useRef)(null);
			const gesture = (0, react.useRef)(null);
			const frame = (0, react.useRef)(0);
			/**
			 * Capture board/card metrics once per gesture so pointermove never reads
			 * layout. Both gestures move the card on the compositor (transform for a
			 * move, inline width/height for a resize) and commit React state once on
			 * release — a per-move setState re-rendered every card on the board.
			 */
			const beginGesture = (mode, event) => {
				const card = cardRef.current;
				const board = boardRef.current;
				const boardRect = board !== null ? board.getBoundingClientRect() : null;
				const cardRect = card !== null ? card.getBoundingClientRect() : null;
				gesture.current = {
					mode,
					pointerId: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					pendingX: event.clientX,
					pendingY: event.clientY,
					x: layout.x,
					y: layout.y,
					w: cardRect !== null ? cardRect.width : (typeof layout.w === "number" ? layout.w : 300),
					h: cardRect !== null ? cardRect.height : (typeof layout.h === "number" ? layout.h : 200),
					boardW: boardRect !== null ? boardRect.width : 0,
					boardH: boardRect !== null ? boardRect.height : 0
				};
				if (card !== null) {
					// Inline (not only class-based) so the very first pointer frames are
					// already free of transitions and backdrop re-blurring.
					card.classList.add("dsh-tc-cardBusy");
					card.style.transition = "none";
					card.style.backdropFilter = "none";
					card.style.webkitBackdropFilter = "none";
				}
				if (typeof document !== "undefined" && document.body !== void 0) document.body.classList.add("dsh-tc-interacting");
			};
			const applyGesture = () => {
				frame.current = 0;
				const state = gesture.current;
				const card = cardRef.current;
				if (state === null || card === null) return;
				const dx = state.pendingX - state.startX;
				const dy = state.pendingY - state.startY;
				if (state.mode === "move") {
					const maxX = Math.max(0, state.boardW - state.w);
					const maxY = Math.max(0, state.boardH - state.h);
					state.nextX = Math.min(Math.max(0, state.x + dx), maxX);
					state.nextY = Math.min(Math.max(0, state.y + dy), maxY);
					if (state.raised !== true && (state.nextX !== state.x || state.nextY !== state.y)) {
						state.raised = true;
						card.style.zIndex = "9999";
					}
					card.style.transform = "translate3d(" + Math.round(state.nextX - state.x) + "px," + Math.round(state.nextY - state.y) + "px,0)";
					return;
				}
				const maxW = state.boardW > 0 ? Math.min(TASK_CARD_MAX_W, Math.max(TASK_CARD_MIN_W, state.boardW - state.x - 12)) : TASK_CARD_MAX_W;
				const maxH = state.boardH > 0 ? Math.min(TASK_CARD_MAX_H, Math.max(TASK_CARD_MIN_H, state.boardH - state.y - 12)) : TASK_CARD_MAX_H;
				state.nextW = Math.round(Math.min(Math.max(TASK_CARD_MIN_W, state.w + dx), maxW));
				state.nextH = Math.round(Math.min(Math.max(TASK_CARD_MIN_H, state.h + dy), maxH));
				if (state.raised !== true && (state.nextW !== state.w || state.nextH !== state.h)) {
					state.raised = true;
					card.style.zIndex = "9999";
				}
				card.style.width = state.nextW + "px";
				card.style.height = state.nextH + "px";
			};
			const scheduleGesture = (event) => {
				const state = gesture.current;
				if (state === null) return;
				state.pendingX = event.clientX;
				state.pendingY = event.clientY;
				if (frame.current !== 0) return;
				if (typeof requestAnimationFrame === "function") frame.current = requestAnimationFrame(applyGesture);
				else applyGesture();
			};
			const endGesture = (mode, event) => {
				const state = gesture.current;
				if (state === null || state.mode !== mode) return;
				state.pendingX = event.clientX;
				state.pendingY = event.clientY;
				if (frame.current !== 0) {
					if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame.current);
					frame.current = 0;
				}
				applyGesture();
				gesture.current = null;
				try {
					if (typeof event.currentTarget.releasePointerCapture === "function") event.currentTarget.releasePointerCapture(event.pointerId);
				} catch {
					/* pointer already released */
				}
				const card = cardRef.current;
				if (card !== null) {
					card.classList.remove("dsh-tc-cardBusy");
					card.style.removeProperty("transition");
					card.style.removeProperty("backdrop-filter");
					card.style.removeProperty("-webkit-backdrop-filter");
					if (mode === "move") {
						if (typeof state.nextX === "number") {
							card.style.left = state.nextX + "px";
							card.style.top = state.nextY + "px";
						}
						card.style.transform = "";
					}
				}
				if (typeof document !== "undefined" && document.body !== void 0) document.body.classList.remove("dsh-tc-interacting");
				if (mode === "move") {
					if (typeof state.nextX === "number" && typeof onDragCommit === "function") onDragCommit(id, state.nextX, state.nextY);
					return;
				}
				if (typeof state.nextW === "number" && typeof onResizeCommit === "function") onResizeCommit(id, state.nextW, state.nextH);
			};
			const onPointerDown = (event) => {
				if (event.button !== 0) return;
				event.preventDefault();
				beginGesture("move", event);
				try {
					event.currentTarget.setPointerCapture(event.pointerId);
				} catch {
					/* pointer already released */
				}
			};
			const onPointerMove = (event) => {
				if (gesture.current === null || gesture.current.mode !== "move") return;
				scheduleGesture(event);
			};
			const onPointerUp = (event) => {
				endGesture("move", event);
			};
			/** Bottom-right resize handle: same gesture pipeline as the drag, sized instead of moved. */
			const onResizePointerDown = (event) => {
				if (event.button !== 0) return;
				event.preventDefault();
				event.stopPropagation();
				beginGesture("resize", event);
				try {
					event.currentTarget.setPointerCapture(event.pointerId);
				} catch {
					/* pointer already released */
				}
			};
			const onResizePointerMove = (event) => {
				if (gesture.current === null || gesture.current.mode !== "resize") return;
				scheduleGesture(event);
			};
			const onResizePointerUp = (event) => {
				endGesture("resize", event);
			};
			const userStyle = layout !== null && typeof layout === "object" && layout.style !== null && typeof layout.style === "object" ? layout.style : null;
			const sizedW = typeof layout.w === "number" ? layout.w : void 0;
			const sizedH = typeof layout.h === "number" ? layout.h : void 0;
			const sized = sizedW !== void 0 || sizedH !== void 0;
			const cardClass = "dsh-tc-card" + (userStyle !== null && typeof userStyle.width === "string" && sizedW === void 0 ? " dsh-tc-card--" + userStyle.width : "");
			const cardInline = { left: layout.x, top: layout.y, zIndex };
			if (sizedW !== void 0) cardInline.width = sizedW;
			if (sizedH !== void 0) cardInline.height = sizedH;
			if (userStyle !== null && typeof userStyle.accent === "string") {
				const accentColor = taskStyleAccentColor(userStyle.accent);
				if (accentColor !== void 0) cardInline["--dsh-tc-acc"] = accentColor;
			}
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: cardRef,
				className: cardClass,
				"data-collapsed": layout.collapsed || void 0,
				"data-sized": sized || void 0,
				"data-width": userStyle !== null && typeof userStyle.width === "string" && sizedW === void 0 ? userStyle.width : void 0,
				"data-density": userStyle !== null && typeof userStyle.density === "string" ? userStyle.density : void 0,
				"data-acc": userStyle !== null && typeof userStyle.accent === "string" ? "1" : void 0,
				style: cardInline,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-cardHead",
						onPointerDown,
						onPointerMove,
						onPointerUp,
						onLostPointerCapture: (event) => {
							if (gesture.current !== null && gesture.current.mode === "move") endGesture("move", event);
						},
						onPointerCancel: (event) => {
							if (gesture.current !== null && gesture.current.mode === "move") endGesture("move", event);
						},
						title: "按住拖拽移动卡片",
						children: [
							userStyle !== null && typeof userStyle.icon === "string" && userStyle.icon.length > 0 && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardIcon", children: userStyle.icon }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardTitle", children: title }),
							badge !== void 0 && badge !== null && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardBadge", children: badge }),
							(actions || []).map((action) => (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-cardIconBtn" + (action.active ? " dsh-tc-iconOn" : "") + (action.danger ? " dsh-tc-iconDanger" : ""),
								title: action.title,
								onPointerDown: (event) => event.stopPropagation(),
								onClick: action.onClick,
								children: (0, react_jsx_runtime.jsx)("span", { children: action.icon })
							}, action.key))
						]
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-cardBody", children }),
					!layout.collapsed && (0, react_jsx_runtime.jsx)("div", {
						className: "dsh-tc-cardResize",
						title: "拖动调整卡片大小",
						onPointerDown: onResizePointerDown,
						onPointerMove: onResizePointerMove,
						onPointerUp: onResizePointerUp,
						onLostPointerCapture: (event) => {
							if (gesture.current !== null && gesture.current.mode === "resize") endGesture("resize", event);
						},
						onPointerCancel: (event) => {
							if (gesture.current !== null && gesture.current.mode === "resize") endGesture("resize", event);
						}
					})
				]
			});
		}
		/**
		 * Fullscreen view of one card: the very same body rendered large over the whole
		 * workbench, so an embedded web app (or a long list) gets the entire screen.
		 * Esc or the backdrop closes it; ⤢ asks the browser for real fullscreen.
		 */
		function TaskCardFullscreen(props) {
			const { title, badge, layout, actions, onClose } = props;
			const shellRef = (0, react.useRef)(null);
			const [browserFull, setBrowserFull] = (0, react.useState)(false);
			const userStyle = layout !== null && typeof layout === "object" && layout.style !== null && typeof layout.style === "object" ? layout.style : null;
			const accent = userStyle !== null && typeof userStyle.accent === "string" ? taskStyleAccentColor(userStyle.accent) : void 0;
			const shellStyle = accent !== void 0 ? { "--dsh-tc-acc": accent } : void 0;
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return void 0;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					// While the browser itself is fullscreen, Esc belongs to the browser first.
					if (document.fullscreenElement !== null && document.fullscreenElement !== void 0) return;
					event.preventDefault();
					onClose();
				};
				const onFullscreenChange = () => setBrowserFull(document.fullscreenElement !== null && document.fullscreenElement !== void 0);
				document.addEventListener("keydown", onKey);
				document.addEventListener("fullscreenchange", onFullscreenChange);
				return () => {
					document.removeEventListener("keydown", onKey);
					document.removeEventListener("fullscreenchange", onFullscreenChange);
				};
			}, [onClose]);
			const toggleBrowserFull = () => {
				const shell = shellRef.current;
				if (shell === null) return;
				if (document.fullscreenElement !== null && document.fullscreenElement !== void 0) {
					if (typeof document.exitFullscreen === "function") document.exitFullscreen().catch(() => {});
					return;
				}
				if (typeof shell.requestFullscreen === "function") shell.requestFullscreen().catch(() => {});
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-full",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "全屏卡片：" + title,
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: [(0, react_jsx_runtime.jsxs)("div", {
					ref: shellRef,
					className: "dsh-tc-fullCard",
					"data-acc": accent !== void 0 ? "1" : void 0,
					style: shellStyle,
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-cardHead dsh-tc-fullHead",
							children: [
								userStyle !== null && typeof userStyle.icon === "string" && userStyle.icon.length > 0 && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardIcon", children: userStyle.icon }),
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardTitle", children: title }),
								badge !== void 0 && badge !== null && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardBadge", children: badge }),
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-fullHint", children: browserFull ? "浏览器全屏中 · Esc 退出" : "Esc 或点空白处退出" }),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn" + (browserFull ? " dsh-tc-iconOn" : ""), title: "浏览器全屏（隐藏浏览器界面）", onClick: toggleBrowserFull, children: (0, react_jsx_runtime.jsx)("span", { children: "⤢" }) }),
								(actions || []).map((action) => (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-tc-cardIconBtn" + (action.active ? " dsh-tc-iconOn" : "") + (action.danger ? " dsh-tc-iconDanger" : ""),
									title: action.title,
									onClick: action.onClick,
									children: (0, react_jsx_runtime.jsx)("span", { children: action.icon })
								}, action.key)),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "退出全屏（Esc）", onClick: onClose, children: (0, react_jsx_runtime.jsx)("span", { children: "✕" }) })
							]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: "dsh-tc-fullBody",
							"data-fill": props.fill === true ? "1" : void 0,
							children: props.children
						})
					]
				})]
			});
		}
		//#endregion
		//#region user-card store + spec protocol
		/** Module-level board store: single source shared by the panel and the conversation watcher. */
		const taskCardsStore = { cards: null, order: null, listeners: new Set() };
		function ensureTaskCardsLoaded() {
			if (taskCardsStore.cards !== null) return;
			const loaded = readTaskState();
			if (loaded !== null) {
				taskCardsStore.cards = loaded.cards;
				taskCardsStore.order = loaded.order;
			} else {
				taskCardsStore.cards = freshTaskCards();
				taskCardsStore.order = builtinTaskCardIds();
			}
		}
		function snapshotTaskCards() {
			ensureTaskCardsLoaded();
			return { cards: taskCardsStore.cards, order: taskCardsStore.order };
		}
		function subscribeTaskCards(listener) {
			taskCardsStore.listeners.add(listener);
			return () => { taskCardsStore.listeners.delete(listener); };
		}
		function publishTaskCards(cards, order) {
			ensureTaskCardsLoaded();
			taskCardsStore.cards = cards;
			taskCardsStore.order = order;
			writeTaskState({ cards, order });
			for (const listener of [...taskCardsStore.listeners]) {
				try { listener(); } catch { /* a listener must never break the board */ }
			}
		}
		/** Open/close markers of one card block inside any chat message. */
		const TASK_SPEC_OPEN = "[taskcard]";
		const TASK_SPEC_CLOSE = "[/taskcard]";
		/**
		 * Parse the first [taskcard]...[taskcard close] block in a message into a card
		 * operation. Accepts JSON with optional markdown fences around it.
		 */
		function parseTaskCardSpec(text) {
			if (typeof text !== "string") return null;
			const start = text.indexOf(TASK_SPEC_OPEN);
			let raw = null;
			if (start !== -1) {
				const after = start + TASK_SPEC_OPEN.length;
				const end = text.indexOf(TASK_SPEC_CLOSE, after);
				if (end !== -1) raw = text.slice(after, end).trim();
			}
			if (raw === null) {
				// Fence-only variant (```taskcard ... ```) accepted when no markers are present.
				const fence = /```taskcard[\t ]*\n?([\s\S]*?)```/g.exec(text);
				if (fence !== null) raw = fence[1].trim();
			}
			if (raw === null) return null;
			if (raw.startsWith("```")) {
				raw = raw.replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/```$/, "").trim();
			}
			if (raw.length === 0 || raw.length > 6000) return null;
			let parsed = null;
			try { parsed = JSON.parse(raw); } catch { return null; }
			if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
			const op = parsed.op === "delete" ? "delete" : "upsert";
			if (op === "delete") {
				const id = typeof parsed.id === "string" ? parsed.id.trim() : "";
				const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
				if (id.length === 0 && title.length === 0) return null;
				return { op, id, title };
			}
			const cleanId = typeof parsed.id === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(parsed.id.trim()) ? parsed.id.trim() : "";
			const title = typeof parsed.title === "string" && parsed.title.trim().length > 0 ? parsed.title.trim().slice(0, TASK_TITLE_LIMIT) : (cleanId.length > 0 ? cleanId : "");
			if (cleanId.length === 0 && title.length === 0) return null;
			const pinned = parsed.pinned === true;
			const blocks = sanitizeTaskBlocks(parsed.blocks);
			if (blocks.length === 0) {
				// Legacy body/buttons map onto text + button blocks so old specs keep working.
				if (typeof parsed.body === "string" && parsed.body.trim().length > 0) {
					const textBlock = sanitizeTaskBlock({ kind: "text", text: parsed.body }, 0);
					if (textBlock !== null) blocks.push(textBlock);
				}
				for (const button of sanitizeTaskButtons(parsed.buttons)) {
					const buttonBlock = sanitizeTaskBlock({ kind: "button", action: button.action, label: button.label, value: button.value }, blocks.length);
					if (buttonBlock !== null) blocks.push(buttonBlock);
				}
			}
			return {
				op,
				id: cleanId.length > 0 ? cleanId : void 0,
				title,
				pinned,
				style: sanitizeTaskStyle(parsed.style),
				blocks
			};
		}
		/** Apply one parsed card operation against the board store; returns the outcome. */
		function applyTaskCardSpec(spec) {
			if (spec === null || typeof spec !== "object") return { ok: false, reason: "invalid" };
			ensureTaskCardsLoaded();
			const cards = taskCardsStore.cards;
			const order = taskCardsStore.order;
			const nowTs = Date.now();
			if (spec.op === "delete") {
				let key = null;
				if (spec.id !== void 0 && spec.id.length > 0 && isUserTaskCard(cards[spec.id])) key = spec.id;
				else if (spec.title.length > 0) {
					for (const id of order) {
						const card = cards[id];
						if (isUserTaskCard(card) && card.title === spec.title) { key = id; break; }
					}
				}
				if (key === null) return { ok: false, reason: "no-match" };
				const nextCards = { ...cards };
				delete nextCards[key];
				const nextOrder = order.filter((id) => id !== key);
				publishTaskCards(nextCards, nextOrder);
				// The card is gone: its instance canvas must not keep ghost controls.
				canvasUnbindCard(canvasInstanceId(key), key);
				return { ok: true, op: "delete", id: key };
			}
			let key = spec.id !== void 0 && spec.id.length > 0 ? spec.id : null;
			let existing = key !== null && isUserTaskCard(cards[key]) ? cards[key] : null;
			if (existing === null && key === null) {
				for (const id of order) {
					const card = cards[id];
					if (isUserTaskCard(card) && card.title === spec.title) { existing = card; key = id; break; }
				}
			}
			if (existing !== null) {
				const scopeSet = new Set();
				for (let index = 0; index < spec.blocks.length; index++) scopeSet.add(taskBlockScope(spec.blocks[index], index));
				const kept = {};
				if (existing.widgets !== null && typeof existing.widgets === "object") {
					for (const [scope, value] of Object.entries(existing.widgets)) {
						if (scopeSet.has(scope)) kept[scope] = value;
					}
				}
				const next = { ...existing, title: spec.title, pinned: spec.pinned, hidden: false, updatedAt: nowTs, blocks: spec.blocks };
				if (spec.style !== void 0) {
					const style = sanitizeTaskStyle(spec.style);
					if (style !== void 0) next.style = style;
					else delete next.style;
				}
				// A width preset supersedes a manually dragged size.
				if (next.style !== void 0 && typeof next.style.width === "string") delete next.w;
				if (Object.keys(kept).length > 0) next.widgets = kept;
				else delete next.widgets;
				delete next.body;
				delete next.buttons;
				const nextCards = { ...cards, [key]: next };
				publishTaskCards(nextCards, order);
				// A conversation refactor changed the card: its instance canvas (the card's own
				// controls) has to show exactly the same controls afterwards.
				syncTaskCardInstance(key);
				return { ok: true, op: "upsert", id: key, created: false };
			}
			const id = key !== null ? key : nextUserTaskCardId();
			const spot = cascadeTaskCardSpot(cards);
			const entry = sanitizeTaskCardEntry({ x: spot.x, y: spot.y, title: spec.title, blocks: spec.blocks, style: spec.style, pinned: spec.pinned, createdAt: nowTs, updatedAt: nowTs });
			const nextCards = { ...cards, [id]: entry };
			const nextOrder = order.indexOf(id) === -1 ? [...order, id] : order;
			publishTaskCards(nextCards, nextOrder);
			syncTaskCardInstance(id);
			return { ok: true, op: "upsert", id, created: true };
		}
		/** Content hashes of specs already applied, persisted so history never re-fires. */
		const appliedTaskSpecHashes = new Set(readAppliedTaskSpecHashes());
		function readAppliedTaskSpecHashes() {
			if (typeof localStorage === "undefined") return [];
			try {
				const raw = localStorage.getItem(TASK_SPEC_KEY);
				if (raw === null) return [];
				const parsed = JSON.parse(raw);
				return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string").slice(-256) : [];
			} catch { return []; }
		}
		function rememberAppliedTaskSpec(hash) {
			appliedTaskSpecHashes.add(hash);
			if (appliedTaskSpecHashes.size > 256) {
				const newest = [...appliedTaskSpecHashes].slice(-256);
				appliedTaskSpecHashes.clear();
				for (const value of newest) appliedTaskSpecHashes.add(value);
			}
			if (typeof localStorage === "undefined") return;
			try { localStorage.setItem(TASK_SPEC_KEY, JSON.stringify([...appliedTaskSpecHashes])); } catch { /* ignore */ }
		}
		function hashTaskSpecText(text) {
			let hash = 5381;
			for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
			return String(hash >>> 0);
		}
		/**
		 * Chat-flow kinds whose row text may carry a [taskcard] block. The chat
		 * package labels one settled assistant reply `assistant-step` (the older
		 * `assistant` label is kept as a compatibility alias), user messages
		 * `user`, and mid-turn user input `steering`. Anything else — the
		 * `turn-process` controller row especially — is skipped so one turn's
		 * text is never read twice.
		 */
		const TASK_CHAT_TEXT_KINDS = new Set(["user", "steering", "assistant-step", "assistant"]);
		function isTaskChatTextKind(kind) {
			return typeof kind === "string" && TASK_CHAT_TEXT_KINDS.has(kind);
		}
		let taskCardWatchTimer = null;
		/** Poll the live conversation rows for settled [taskcard] blocks and apply them. */
		function startTaskCardWatcher() {
			if (taskCardWatchTimer !== null) return;
			if (typeof document === "undefined") return;
			const seen = new Map();
			const considered = new WeakSet();
			/** Only the newest rows are re-read each tick; older rows are read once. */
			const TAIL_WINDOW = 8;
			const tick = () => {
				if (typeof document === "undefined") return;
				if (document.hidden === true) return;
				if (document.body !== void 0 && document.body.classList.contains("dsh-tc-interacting")) return;
				const now = Date.now();
				const nodes = document.querySelectorAll("[data-chat-anchor-key]");
				const total = nodes.length;
				const tailStart = Math.max(0, total - TAIL_WINDOW);
				const rows = [];
				for (let index = total - 1; index >= 0; index--) {
					const row = nodes[index];
					const fresh = !considered.has(row);
					if (fresh) considered.add(row);
					if (fresh || index >= tailStart) rows.push(row);
					else break;
				}
				rows.reverse();
				for (const row of rows) {
					const kind = typeof row.getAttribute === "function" ? row.getAttribute("data-chat-flow-kind") : null;
					if (!isTaskChatTextKind(kind)) continue;
					const text = (row.textContent ?? "").replace(/\s+/g, " ").trim();
					if (text.indexOf(TASK_SPEC_OPEN) === -1 || text.indexOf(TASK_SPEC_CLOSE) === -1) continue;
					const hash = hashTaskSpecText(text);
					if (appliedTaskSpecHashes.has(hash)) continue;
					const prior = seen.get(row);
					if (prior === void 0) { seen.set(row, { hash, at: now }); continue; }
					if (prior.hash !== hash) { prior.hash = hash; prior.at = now; continue; }
					if (now - prior.at < 900) continue;
					seen.delete(row);
					const spec = parseTaskCardSpec(text);
					if (spec !== null) {
						const result = applyTaskCardSpec(spec);
						if (result.ok) rememberAppliedTaskSpec(hash);
					}
				}
				if (seen.size > 500) {
					for (const [row, record] of seen) { if (now - record.at > 45000) seen.delete(row); }
				}
			};
			taskCardWatchTimer = setInterval(tick, 1000);
		}
		function stopTaskCardWatcher() {
			if (taskCardWatchTimer !== null) {
				clearInterval(taskCardWatchTimer);
				taskCardWatchTimer = null;
			}
		}
		/** Copy text to the clipboard with a legacy fallback; resolves to true when accepted. */
		function copyTaskText(text) {
			if (typeof navigator !== "undefined" && typeof navigator.clipboard !== "undefined" && typeof navigator.clipboard.writeText === "function") {
				return navigator.clipboard.writeText(text).then(() => true, () => copyTaskTextLegacy(text));
			}
			return Promise.resolve(copyTaskTextLegacy(text));
		}
		function copyTaskTextLegacy(text) {
			if (typeof document === "undefined") return false;
			try {
				const area = document.createElement("textarea");
				area.value = text;
				area.style.position = "fixed";
				area.style.opacity = "0";
				document.body.appendChild(area);
				area.focus();
				area.select();
				const ok = document.execCommand("copy");
				document.body.removeChild(area);
				return ok;
			} catch {
				return false;
			}
		}
		//#endregion
		//#region user card body + editor
		/** Write text into the main conversation composer (best effort) so the user can review and send it. */
		function fillTaskComposer(text) {
			if (typeof document === "undefined") return false;
			const seat = document.querySelector("[data-composer-seat]");
			if (seat === null) return false;
			const candidates = Array.from(seat.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]'));
			const editable = candidates.find((el) => {
				if (typeof el.getAttribute === "function" && (el.getAttribute("disabled") !== null || el.getAttribute("readonly") !== null)) return false;
				return true;
			}) ?? candidates[0];
			if (editable === void 0) return false;
			try {
				if (editable.isContentEditable === true) {
					editable.textContent = text;
					editable.dispatchEvent(new Event("input", { bubbles: true }));
				} else {
					const proto = Object.getPrototypeOf(editable);
					const descriptor = proto !== null ? Object.getOwnPropertyDescriptor(proto, "value") : void 0;
					if (descriptor !== void 0 && descriptor.set !== void 0) descriptor.set.call(editable, text);
					else editable.value = text;
					editable.dispatchEvent(new Event("input", { bubbles: true }));
					editable.dispatchEvent(new Event("change", { bubbles: true }));
				}
				if (typeof editable.focus === "function") editable.focus();
				return true;
			} catch {
				return false;
			}
		}
		/** Read one interactive block's stored widget value with a fallback. */
		function readTaskWidgetValue(widgets, scope, fallback) {
			if (widgets !== null && typeof widgets === "object" && Object.prototype.hasOwnProperty.call(widgets, scope)) return widgets[scope];
			return fallback;
		}
		/** Live countdown control: ticks every second until its deadline, then shows the done text. */
		function TaskCountdown(props) {
			const { block } = props;
			const [nowTs, setNowTs] = (0, react.useState)(() => Date.now());
			(0, react.useEffect)(() => {
				const timer = setInterval(() => setNowTs(Date.now()), 1000);
				return () => clearInterval(timer);
			}, []);
			const remaining = block.until - nowTs;
			if (remaining <= 0) {
				return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-countdown", children: (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-countdownValue", children: block.done.length > 0 ? block.done : "已到时间" }) });
			}
			const total = Math.floor(remaining / 1000);
			const days = Math.floor(total / 86400);
			const hours = Math.floor((total % 86400) / 3600);
			const minutes = Math.floor((total % 3600) / 60);
			const seconds = total % 60;
			const pad = (value) => (value < 10 ? "0" + value : String(value));
			const text = days > 0 ? days + "天" + hours + "小时" + pad(minutes) + "分" : hours > 0 ? hours + ":" + pad(minutes) + ":" + pad(seconds) : pad(minutes) + ":" + pad(seconds);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-countdown",
				children: [
					block.label.length > 0 && (0, react_jsx_runtime.jsx)("span", { children: block.label }),
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-countdownValue", children: text })
				]
			});
		}
		/** One embedded web app on a card: sandboxed frame plus its own bar (reload / open / copy address). */
		function TaskEmbedView(props) {
			const { block, onResize } = props;
			const [nonce, setNonce] = (0, react.useState)(0);
			const [flash, setFlash] = (0, react.useState)("");
			const [dragging, setDragging] = (0, react.useState)(false);
			const wrapRef = (0, react.useRef)(null);
			const gripLabelRef = (0, react.useRef)(null);
			const host = taskEmbedHost(block.url);
			const label = typeof block.title === "string" && block.title.length > 0 ? block.title : host;
			const fill = block.fill === true;
			const height = clampTaskEmbedHeight(block.height);
			// A same-origin app (this GUI itself) is framed with an opaque origin, so the
			// embedded copy can never script the workbench it lives in.
			const sandbox = taskEmbedIsSameOrigin(block.url) ? TASK_EMBED_SANDBOX_OPAQUE : TASK_EMBED_SANDBOX;
			const copyAddress = () => {
				copyTaskText(block.url).then((ok) => {
					setFlash(ok ? "已复制地址 ✓" : "复制失败");
					setTimeout(() => setFlash(""), 1200);
				});
			};
			/**
			 * Bottom-edge grip: the frame follows the pointer on the compositor (rAF +
			 * inline height, no React state per move) and the new height is committed once
			 * on release, so a drag never re-renders the board.
			 */
			const beginResize = (event) => {
				if (event.button !== 0) return;
				const wrap = wrapRef.current;
				if (wrap === null) return;
				event.preventDefault();
				event.stopPropagation();
				const startY = event.clientY;
				// Layout height, not the transformed rect: on the infinite canvas the card
				// lives inside a scaled plane, so screen pixels must be converted back.
				const startHeight = wrap.offsetHeight > 0 ? wrap.offsetHeight : clampTaskEmbedHeight(height);
				const rectHeight = wrap.getBoundingClientRect().height;
				const scale = rectHeight > 0 && startHeight > 0 ? rectHeight / startHeight : 1;
				let latest = clampTaskEmbedHeight(startHeight);
				let frame = 0;
				// While dragging, the frame must not swallow the pointer (an iframe is its own
				// document): CSS turns its pointer events off through [data-dragging].
				const move = (moveEvent) => {
					latest = clampTaskEmbedHeight(startHeight + (moveEvent.clientY - startY) / scale);
					if (frame !== 0) return;
					frame = requestAnimationFrame(() => {
						frame = 0;
						wrap.style.height = latest + "px";
						if (gripLabelRef.current !== null) gripLabelRef.current.textContent = latest + "px";
					});
				};
				const finish = () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", finish);
					window.removeEventListener("pointercancel", finish);
					if (frame !== 0) {
						cancelAnimationFrame(frame);
						frame = 0;
					}
					setDragging(false);
					if (gripLabelRef.current !== null) gripLabelRef.current.textContent = "";
					if (typeof onResize === "function") onResize(latest);
				};
				setDragging(true);
				if (gripLabelRef.current !== null) gripLabelRef.current.textContent = latest + "px";
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", finish);
				window.addEventListener("pointercancel", finish);
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-app" + (fill ? " dsh-tc-appFill" : ""),
				"data-dragging": dragging ? "1" : void 0,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-appBar",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-appDot" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-appTitle", title: label, children: label }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-appHost", title: block.url + "（空白多半是该站点禁止被嵌入，点 ↗ 用新标签打开）", children: flash.length > 0 ? flash : host }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-appBtn", title: "重新加载", onClick: () => setNonce((value) => value + 1), children: "↻" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-appBtn", title: "在新标签打开", onClick: () => { if (typeof window !== "undefined") window.open(block.url, "_blank", "noopener,noreferrer"); }, children: "↗" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-appBtn", title: "复制地址", onClick: copyAddress, children: "⧉" })
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						ref: wrapRef,
						className: "dsh-tc-appWrap",
						style: fill ? void 0 : { height: height + "px" },
						children: (0, react_jsx_runtime.jsx)("iframe", {
							key: nonce,
							className: "dsh-tc-appFrame",
							src: block.url,
							title: "内嵌网页应用：" + label,
							sandbox,
							allow: TASK_EMBED_ALLOW,
							referrerPolicy: "no-referrer",
							loading: "lazy",
							allowFullScreen: true
						})
					}),
					!fill && (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-appGrip",
						title: "上下拖动调整这个内嵌应用的高度（松开后记住）",
						onPointerDown: beginResize,
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-appGripBar" }),
							(0, react_jsx_runtime.jsx)("span", { ref: gripLabelRef, className: "dsh-tc-appGripLabel" })
						]
					})
				]
			});
		}
		/** Render one declarative control block authored by the conversation. */
		function TaskBlockView(props) {
			const { block, scope, value, onWidget, onRun, feedbackText, blockIndex, onResizeHeight } = props;
			if (block.kind === "text") return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-wText", children: block.text });
			if (block.kind === "heading") return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-wHead", children: block.text });
			if (block.kind === "note") return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-wNote", children: block.text });
			if (block.kind === "unknown") {
				const rawEntries = block.raw !== null && typeof block.raw === "object" ? Object.entries(block.raw) : [];
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-wUnsupported",
					children: [
						(0, react_jsx_runtime.jsx)("div", { children: "未支持的控件：" + block.requested + "（可用：" + TASK_BLOCK_KINDS.join(" / ") + "）" }),
						rawEntries.length > 0 && (0, react_jsx_runtime.jsx)("div", {
							className: "dsh-tc-wRaw",
							children: rawEntries.map(([key, value]) => (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-tc-kv",
								children: [
									(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvKey", children: key }),
									(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvVal", title: String(value), children: String(value) })
								]
							}, key))
						})
					]
				});
			}
			if (block.kind === "stats") {
				return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-statRow", children: block.items.map((item, index) => (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-stat",
					children: [
						(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-statVal", children: item.value }),
						item.label.length > 0 && (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-statLabel", children: item.label })
					]
				}, String(index))) });
			}
			if (block.kind === "progress") {
				const percent = block.max > 0 ? Math.min(100, (block.value / block.max) * 100) : 0;
				const unit = typeof block.unit === "string" ? block.unit : "";
				return (0, react_jsx_runtime.jsxs)("div", { children: [
					(0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-progHead", children: [
						(0, react_jsx_runtime.jsx)("span", { children: block.label }),
						(0, react_jsx_runtime.jsx)("span", { children: String(block.value) + "/" + String(block.max) + (unit.length > 0 ? " " + unit : "") })
					] }),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-progTrack", children: (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-progFill", style: { width: percent + "%" } }) })
				] });
			}
			if (block.kind === "kv") {
				return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: block.rows.map((row, index) => (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-kv",
					children: [
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvKey", children: row[0] }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kvVal", title: row[1], children: row[1] })
					]
				}, String(index))) });
			}
			if (block.kind === "links") {
				return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-links", children: block.items.map((item, index) => (0, react_jsx_runtime.jsx)("a", {
					className: "dsh-tc-link",
					href: item.url,
					target: "_blank",
					rel: "noopener noreferrer",
					children: item.label
				}, String(index))) });
			}
			if (block.kind === "chips") {
				return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chips", children: block.items.map((text, index) => (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-chip", children: text }, String(index))) });
			}
			if (block.kind === "checklist") {
				const map = value !== null && typeof value === "object" ? value : {};
				return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: block.items.map((item) => {
					const done = map[item.id] === true;
					return (0, react_jsx_runtime.jsxs)("label", {
						className: "dsh-tc-check" + (done ? " dsh-tc-checkDone" : ""),
						children: [
							(0, react_jsx_runtime.jsx)("input", { type: "checkbox", checked: done, onChange: (event) => onWidget(scope, { ...map, [item.id]: event.target.checked }) }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-checkLabel", children: item.label })
						]
					}, item.id);
				}) });
			}
			if (block.kind === "counter") {
				const current = typeof value === "number" && Number.isFinite(value) ? value : 0;
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-count",
					children: [
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-countLabel", children: block.label }),
						(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-countBtn", title: "减", onClick: () => onWidget(scope, Math.max(block.min, Math.min(block.max, current - block.step))), children: "-" }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-countVal", children: String(current) }),
						(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-countBtn", title: "加", onClick: () => onWidget(scope, Math.max(block.min, Math.min(block.max, current + block.step))), children: "+" })
					]
				});
			}
			if (block.kind === "trend") {
				const points = Array.isArray(block.items)
					? block.items
					: Array.isArray(block.values)
						? block.values.map((point) => ({ label: "", value: point }))
						: [];
				const last = points.length > 0 ? points[points.length - 1] : null;
				let min = Infinity;
				let max = -Infinity;
				for (const point of points) {
					if (point.value < min) min = point.value;
					if (point.value > max) max = point.value;
				}
				if (points.length < 2) return null;
				if (min === max) { min -= 1; max += 1; }
				const W = 240;
				const H = 56;
				const pad = 5;
				const xOf = (index) => pad + (index * (W - pad * 2)) / (points.length - 1);
				const yOf = (value) => pad + (H - pad * 2) - ((value - min) / (max - min)) * (H - pad * 2);
				const linePoints = points.map((point, index) => xOf(index) + "," + yOf(point.value)).join(" ");
				const firstX = xOf(0);
				const lastX = xOf(points.length - 1);
				const areaD = "M" + firstX + "," + (H - pad) + " L" + linePoints.split(" ").join(" L") + " L" + lastX + "," + (H - pad) + " Z";
				const label = typeof block.label === "string" ? block.label : "";
				const unit = typeof block.unit === "string" ? block.unit : "";
				const aria = (label.length > 0 ? label + "：" : "趋势：") + points.map((point) => point.label.length > 0 ? point.label + " " + point.value : point.value).join("，");
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-trend",
					children: [
						(label.length > 0 || last !== null) && (0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-trendHead",
							children: [
								(0, react_jsx_runtime.jsx)("span", { children: label }),
								last !== null && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-trendLast", children: String(last.value) + (unit.length > 0 ? " " + unit : "") })
							]
						}),
						(0, react_jsx_runtime.jsx)("svg", {
							className: "dsh-tc-trendSvg",
							viewBox: "0 0 240 56",
							preserveAspectRatio: "none",
							role: "img",
							"aria-label": aria,
							children: [
								(0, react_jsx_runtime.jsx)("path", { d: areaD, fill: "rgba(99,102,241,.12)" }),
								(0, react_jsx_runtime.jsx)("polyline", { points: linePoints, fill: "none", stroke: "var(--dsh-tc-acc,#6366f1)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" })
							]
						})
					]
				});
			}
			if (block.kind === "table") {
				return (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-tc-tableWrap",
					children: (0, react_jsx_runtime.jsxs)("table", {
						className: "dsh-tc-table",
						children: [
							(0, react_jsx_runtime.jsx)("thead", { children: (0, react_jsx_runtime.jsx)("tr", { children: block.columns.map((column, index) => (0, react_jsx_runtime.jsx)("th", { children: column }, String(index))) }) }),
							(0, react_jsx_runtime.jsx)("tbody", { children: block.rows.map((row, rowIndex) => (0, react_jsx_runtime.jsx)("tr", { children: row.map((cell, cellIndex) => (0, react_jsx_runtime.jsx)("td", { title: cell, children: cell }, String(cellIndex))) }, String(rowIndex))) })
						]
					})
				});
			}
			if (block.kind === "code") {
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-codeBox",
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-codeHead",
							children: [
								(0, react_jsx_runtime.jsx)("span", { children: block.language.length > 0 ? block.language : "代码" }),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-tc-actBtn",
									onClick: () => onRun(scope, { action: "copy", value: block.text, label: "复制" }),
									children: (0, react_jsx_runtime.jsx)("span", { children: feedbackText !== null && feedbackText !== void 0 ? feedbackText : "复制" })
								})
							]
						}),
						(0, react_jsx_runtime.jsx)("pre", { className: "dsh-tc-code", children: (0, react_jsx_runtime.jsx)("code", { children: block.text }) })
					]
				});
			}
			if (block.kind === "toggle") {
				return (0, react_jsx_runtime.jsxs)("label", {
					className: "dsh-tc-switchRow",
					children: [
						(0, react_jsx_runtime.jsx)("input", { type: "checkbox", className: "dsh-tc-switch", checked: value === true, onChange: (event) => onWidget(scope, event.target.checked) }),
						(0, react_jsx_runtime.jsx)("span", { children: block.label })
					]
				});
			}
			if (block.kind === "countdown") return (0, react_jsx_runtime.jsx)(TaskCountdown, { block });
			if (block.kind === "bars") {
				let maxValue = 0;
				for (const item of block.items) maxValue = Math.max(maxValue, Math.abs(item.value));
				if (maxValue === 0) maxValue = 1;
				return (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-tc-bars",
					children: block.items.map((item, index) => (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-barRow",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-barLabel", title: item.label, children: item.label }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-barTrack", children: (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-barFill", style: { width: Math.round((Math.abs(item.value) / maxValue) * 100) + "%" } }) }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-barValue", children: String(item.value) })
						]
					}, String(index)))
				});
			}
			if (block.kind === "image") {
				return (0, react_jsx_runtime.jsxs)("figure", {
					className: "dsh-tc-imgWrap",
					children: [
						(0, react_jsx_runtime.jsx)("img", { className: "dsh-tc-img", src: block.src, alt: block.alt ?? "", loading: "lazy", draggable: false }),
						typeof block.caption === "string" && block.caption.length > 0 && (0, react_jsx_runtime.jsx)("figcaption", { className: "dsh-tc-imgCap", children: block.caption })
					]
				});
			}
			if (block.kind === "embed") return (0, react_jsx_runtime.jsx)(TaskEmbedView, {
				block,
				onResize: typeof onResizeHeight === "function" ? (nextHeight) => onResizeHeight(blockIndex, nextHeight) : void 0
			});
			if (block.kind === "button") {
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-actRow",
					children: [(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dsh-tc-actBtn",
						title: block.action === "link" ? block.value : block.action === "fill" ? "填入主会话输入框（不发送）" : "复制到剪贴板",
						onClick: () => onRun(scope, block),
						children: (0, react_jsx_runtime.jsx)("span", { children: feedbackText !== null && feedbackText !== void 0 ? feedbackText : block.label })
					})]
				});
			}
			return null;
		}
		/** Rendered content of a user card: its declarative control blocks with live widget state. */
		function TaskUserBody(props) {
			const { card, onWidget, onWidgetState, onBlockResize, cardId, thumbnail } = props;
			/** Stable callbacks keep the memoized body from re-rendering with the whole board. */
			const widgetSink = onWidgetState !== void 0 ? (scope, value) => onWidgetState(cardId, scope, value) : onWidget;
			const resizeSink = onBlockResize !== void 0 ? (index, height) => onBlockResize(cardId, index, height) : void 0;
			const [feedback, setFeedback] = (0, react.useState)({});
			const flash = (scope, label) => {
				setFeedback((previous) => ({ ...previous, [scope]: label }));
				setTimeout(() => {
					setFeedback((previous) => {
						if (previous[scope] === void 0) return previous;
						const next = { ...previous };
						delete next[scope];
						return next;
					});
				}, 1300);
			};
			const runAction = (scope, block) => {
				if (block.action === "link") {
					if (typeof window !== "undefined") window.open(block.value, "_blank", "noopener,noreferrer");
					return;
				}
				if (block.action === "fill") {
					if (fillTaskComposer(block.value)) flash(scope, "已填入输入框");
					else copyTaskText(block.value).then((ok) => flash(scope, ok ? "无法填入，已复制" : "无法填入"));
					return;
				}
				copyTaskText(block.value).then((ok) => flash(scope, ok ? "已复制 ✓" : "复制失败"));
			};
			const blocks = effectiveTaskBlocks(card);
			if (blocks.length === 0) {
				return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-emptyText", children: "（空卡片：点 ✎ 添加内容，或让会话里的 AI 按需生成控件）" });
			}
			const widgets = card.widgets !== null && typeof card.widgets === "object" ? card.widgets : {};
			// A `fill` app takes the card's remaining height, so the block column becomes a flex track.
			const hasFillApp = blocks.some((block) => block.kind === "embed" && block.fill === true);
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsx)("div", {
					className: "dsh-tc-blocks",
					"data-fill": hasFillApp ? "1" : void 0,
					children: blocks.map((block, index) => {
						const scope = taskBlockScope(block, index);
						return (0, react_jsx_runtime.jsx)(TaskBlockView, {
							block,
							scope,
							blockIndex: index,
							onResizeHeight: resizeSink,
							value: readTaskWidgetValue(widgets, scope, block.kind === "counter" ? 0 : block.kind === "toggle" ? block.value === true : {}),
							feedbackText: feedback[scope] !== void 0 ? feedback[scope] : null,
							onWidget: widgetSink,
							onRun: runAction
						}, scope + "#" + index);
					})
				}),
				// The board card is a thumbnail of its controls: they are arranged on its own canvas.
				thumbnail === true && (0, react_jsx_runtime.jsx)("div", {
					className: "dsh-tc-cardFoot",
					title: "卡片是控件的缩略映射：点 ⛶ 进入副本画布，在那里拖动 / 编辑每个控件",
					children: blocks.length + " 个控件 · ⛶ 进画布排布"
				})
			] });
		}
		/**
		 * Floating glass editor over the task board: create or edit one user card
		 * (title, body, action buttons) and hand the result to onSave.
		 */
		function TaskCardEditor(props) {
			const { initial, onSave, onCancel } = props;
			const editorSource = initial !== null ? effectiveTaskBlocks(initial) : [];
			const editorTextBlock = editorSource.find((block) => block.kind === "text");
			const editorButtonBlocks = editorSource.filter((block) => block.kind === "button");
			const editorEmbedBlocks = editorSource.filter((block) => block.kind === "embed");
			const [title, setTitle] = (0, react.useState)(initial !== null && typeof initial.title === "string" ? initial.title : "");
			const [body, setBody] = (0, react.useState)(editorTextBlock !== void 0 && typeof editorTextBlock.text === "string" ? editorTextBlock.text : "");
			const [pinned, setPinned] = (0, react.useState)(initial !== null && initial.pinned === true);
			const [buttons, setButtons] = (0, react.useState)(() => editorButtonBlocks.map((block) => ({
				action: block.action === "link" ? "link" : block.action === "fill" ? "fill" : "copy",
				label: typeof block.label === "string" ? block.label : "",
				value: typeof block.value === "string" ? block.value : ""
			})));
			const [error, setError] = (0, react.useState)(null);
			const [embeds, setEmbeds] = (0, react.useState)(() => editorEmbedBlocks.slice(0, TASK_EMBED_LIMIT).map((block) => ({
				url: typeof block.url === "string" ? block.url : "",
				title: typeof block.title === "string" ? block.title : "",
				height: clampTaskEmbedHeight(block.height),
				fill: block.fill === true
			})));
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					event.preventDefault();
					onCancel();
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey, true);
			}, [onCancel]);
			const setRow = (index, field, value) => setButtons((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
			const addRow = () => setButtons((rows) => (rows.length >= TASK_BUTTON_LIMIT ? rows : [...rows, { action: "copy", label: "", value: "" }]));
			const removeRow = (index) => setButtons((rows) => rows.filter((_, i) => i !== index));
			const setEmbedRow = (index, field, value) => setEmbeds((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
			const addEmbedRow = () => setEmbeds((rows) => (rows.length >= TASK_EMBED_LIMIT ? rows : [...rows, { url: "", title: "", height: TASK_EMBED_DEFAULT_H, fill: false }]));
			const removeEmbedRow = (index) => setEmbeds((rows) => rows.filter((_, i) => i !== index));
			const save = () => {
				const clean = [];
				for (const row of buttons) {
					if (row.label.trim() === "" && row.value.trim() === "") continue;
					const validated = sanitizeTaskButton(row);
					if (validated === null) {
						setError("按钮「" + row.label.trim() + "」缺少有效内容（复制/链接都需填写“内容/地址”）。");
						return;
					}
					clean.push(validated);
				}
				const cleanEmbeds = [];
				for (const row of embeds) {
					const url = row.url.trim();
					if (url.length === 0) continue;
					const normalized = cleanTaskEmbedUrl(url);
					if (normalized === null) {
						setError("内嵌应用地址「" + url.slice(0, 60) + "」无效：只能填写 http:// 或 https:// 开头的完整地址（例如 https://example.com/app 或 http://localhost:5173）。");
						return;
					}
					cleanEmbeds.push({ url: normalized, title: row.title.trim().slice(0, 80), height: clampTaskEmbedHeight(Number(row.height)), fill: row.fill === true });
				}
				const trimmed = title.trim();
				onSave({
					title: (trimmed.length > 0 ? trimmed : "未命名卡片").slice(0, TASK_TITLE_LIMIT),
					body: body.slice(0, TASK_BODY_LIMIT),
					pinned,
					buttons: clean,
					embeds: cleanEmbeds
				});
			};
			return (0, react_jsx_runtime.jsx)("div", {
				className: "dsh-tc-editorWrap",
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-editor",
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-editorHead",
							children: [
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-editorTitle", children: initial === null ? "新建悬浮卡片" : "编辑卡片" }),
								(0, react_jsx_runtime.jsxs)("label", { className: "dsh-tc-fieldLabel", style: { display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }, children: [
									(0, react_jsx_runtime.jsx)("input", { type: "checkbox", checked: pinned, onChange: (event) => setPinned(event.target.checked) }),
									"置顶"
								] })
							]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-editorScroll",
							children: [
								(0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-field", children: [
									(0, react_jsx_runtime.jsx)("label", { className: "dsh-tc-fieldLabel", children: "标题" }),
									(0, react_jsx_runtime.jsx)("input", { className: "dsh-tc-in", value: title, maxLength: TASK_TITLE_LIMIT, placeholder: "卡片标题", onChange: (event) => setTitle(event.target.value) })
								] }),
								(0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-field", children: [
									(0, react_jsx_runtime.jsx)("label", { className: "dsh-tc-fieldLabel", children: "正文（显示内容；AI 生成的清单/进度等控件会保留在卡片上）" }),
									(0, react_jsx_runtime.jsx)("textarea", { className: "dsh-tc-ta", value: body, maxLength: TASK_BODY_LIMIT, placeholder: "卡片要展示的内容…", onChange: (event) => setBody(event.target.value) })
								] }),
								(0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-field", children: [
									(0, react_jsx_runtime.jsx)("label", { className: "dsh-tc-fieldLabel", children: "交互按钮（可选）" }),
									buttons.map((row, index) => (0, react_jsx_runtime.jsxs)("div", {
										className: "dsh-tc-editRow",
										children: [
											(0, react_jsx_runtime.jsx)("select", { className: "dsh-tc-editAction", value: row.action, onChange: (event) => setRow(index, "action", event.target.value), children: [
												(0, react_jsx_runtime.jsx)("option", { value: "copy", children: "复制文本" }),
												(0, react_jsx_runtime.jsx)("option", { value: "link", children: "打开链接" }),
														(0, react_jsx_runtime.jsx)("option", { value: "fill", children: "填入输入框" })
											] }),
											(0, react_jsx_runtime.jsx)("input", { className: "dsh-tc-in dsh-tc-editLabel", value: row.label, maxLength: 24, placeholder: "按钮文案", onChange: (event) => setRow(index, "label", event.target.value) }),
											(0, react_jsx_runtime.jsx)("input", { className: "dsh-tc-in dsh-tc-editValue", value: row.value, placeholder: row.action === "link" ? "https://…" : row.action === "fill" ? "要填入输入框的文本…" : "要复制的文本…", onChange: (event) => setRow(index, "value", event.target.value) }),
											(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn dsh-tc-iconDanger", title: "删除该按钮", onClick: () => removeRow(index), children: (0, react_jsx_runtime.jsx)("span", { children: "×" }) })
										]
									}, String(index))),
									(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-addBtn", onClick: addRow, children: buttons.length >= TASK_BUTTON_LIMIT ? "已达上限" : "+ 添加按钮" })
								] }),
								(0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-field", children: [
									(0, react_jsx_runtime.jsx)("label", { className: "dsh-tc-fieldLabel", children: "内嵌网页应用（可选：把其它网页应用关联进这张卡片）" }),
									embeds.map((row, index) => (0, react_jsx_runtime.jsxs)("div", {
										className: "dsh-tc-editRow dsh-tc-editEmbedRow",
										children: [
											(0, react_jsx_runtime.jsx)("input", { className: "dsh-tc-in dsh-tc-editUrl", value: row.url, maxLength: TASK_EMBED_URL_LIMIT, placeholder: "https://example.com/app 或 http://localhost:5173", onChange: (event) => setEmbedRow(index, "url", event.target.value) }),
											(0, react_jsx_runtime.jsx)("input", { className: "dsh-tc-in dsh-tc-editLabel", value: row.title, maxLength: 80, placeholder: "名称（可选）", onChange: (event) => setEmbedRow(index, "title", event.target.value) }),
											(0, react_jsx_runtime.jsx)("input", {
												className: "dsh-tc-in dsh-tc-editHeight",
												type: "number",
												min: TASK_EMBED_MIN_H,
												max: TASK_EMBED_MAX_H,
												step: 20,
												value: row.height,
												disabled: row.fill,
												title: "应用高度（像素）",
												onChange: (event) => setEmbedRow(index, "height", Number(event.target.value))
											}),
											(0, react_jsx_runtime.jsxs)("label", { className: "dsh-tc-editCheck", title: "让应用铺满卡片剩余高度（记得把卡片拖大一些）", children: [
												(0, react_jsx_runtime.jsx)("input", { type: "checkbox", checked: row.fill, onChange: (event) => setEmbedRow(index, "fill", event.target.checked) }),
												"填满"
											] }),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dsh-tc-cardIconBtn",
												title: "在新标签打开测试",
												disabled: cleanTaskEmbedUrl(row.url) === null,
												onClick: () => { if (typeof window !== "undefined") window.open(cleanTaskEmbedUrl(row.url), "_blank", "noopener,noreferrer"); },
												children: (0, react_jsx_runtime.jsx)("span", { children: "↗" })
											}),
											(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn dsh-tc-iconDanger", title: "删除该内嵌应用", onClick: () => removeEmbedRow(index), children: (0, react_jsx_runtime.jsx)("span", { children: "×" }) })
										]
									}, String(index))),
									(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-addBtn", onClick: addEmbedRow, children: embeds.length >= TASK_EMBED_LIMIT ? "已达上限" : "+ 内嵌网页应用" }),
									(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-fieldHint", children: "只接受 http:// 或 https:// 地址；应用在你的浏览器里以沙箱 iframe 加载（自己登录、自己联网）。若画面空白，多为该站点禁止被嵌入，可点 ↗ 用新标签打开。" })
								] })
							]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-editorFoot",
							children: [
								error !== null && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-editErr", children: error }),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onCancel, children: "取消" }),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btnPrimary", onClick: save, children: "保存" })
							]
						})
					]
				})
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
		/** Background jobs card body (live rows first, durations tick on their own 1s clock). */
		function TaskJobsBody(props) {
			const { jobs } = props;
			const [now, setNow] = (0, react.useState)(() => Date.now());
			const hasLiveJobs = jobs.some((job) => job.status === "running" || job.status === "stopping");
			(0, react.useEffect)(() => {
				if (!hasLiveJobs) return;
				setNow(Date.now());
				const timer = setInterval(() => setNow(Date.now()), 1e3);
				return () => clearInterval(timer);
			}, [hasLiveJobs]);
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
		/**
		 * Plugin management card body: the frame-wide dynamic Cordis inventory
		 * with stop/remove actions, refreshed on the remote dynamic-plugin events.
		 */
		function TaskPluginsBody(props) {
			const { plugins } = props;
			const [rows, setRows] = (0, react.useState)(null);
			const [error, setError] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(null);
			const [confirmId, setConfirmId] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (plugins === null || plugins === void 0) return;
				let alive = true;
				const refresh = () => {
					plugins.read().then((next) => {
						if (!alive) return;
						setRows(next);
						setError(null);
					}).catch((err) => {
						if (!alive) return;
						setError(err && err.message ? err.message : String(err));
					});
				};
				refresh();
				const off = plugins.subscribe(refresh);
				return () => { alive = false; off(); };
			}, [plugins]);
			if (plugins === null || plugins === void 0) {
				return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-empty", children: "插件管理服务不可用" });
			}
			if (error !== null) return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-empty", children: "读取失败：" + error });
			if (rows === null) return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-empty", children: "正在读取插件…" });
			if (rows.length === 0) return (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-empty", children: "还没有定义任何插件" });
			const act = (pluginId, fn) => {
				setBusy(pluginId);
				fn().then((result) => {
					if (result.ok) {
						setConfirmId(null);
						setError(null);
					} else {
						setError(result.message ?? "操作失败");
					}
					plugins.refresh();
				}).catch((err) => {
					setError(err && err.message ? err.message : String(err));
				}).finally(() => {
					setBusy(null);
				});
			};
			return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: rows.map((row) => {
				const last = row.packages && row.packages.length > 0 ? row.packages[row.packages.length - 1] : null;
				const name = last && last.name ? last.name : row.pluginId;
				const running = row.activeRun !== void 0 && row.activeRun !== null;
				const confirming = confirmId === row.pluginId;
				const isBusy = busy === row.pluginId;
				return (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-row",
					children: [
						(0, react_jsx_runtime.jsx)("span", { className: running ? "dsh-tc-dot dsh-tc-dot-ongoing" : "dsh-tc-dot dsh-tc-dot-done" }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-kind", children: "插件" }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-label", title: row.pluginId, children: name }),
						(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-meta", children: running ? "运行中" : "已停止" }),
						running ? (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-tc-plugBtn",
							disabled: isBusy,
							onClick: () => { void act(row.pluginId, () => plugins.stop(row.agentId, row.pluginId)); },
							children: isBusy ? "…" : "停止"
						}) : null,
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsh-tc-plugBtn" + (confirming ? " dsh-tc-plugBtnDanger" : ""),
							disabled: isBusy,
							onClick: () => {
								if (confirming) act(row.pluginId, () => plugins.remove(row.agentId, row.pluginId));
								else setConfirmId(row.pluginId);
							},
							children: isBusy ? "…" : (confirming ? "确认移除" : "移除")
						})
					]
				}, row.pluginId);
			}) });
		}
		//#endregion
		/**
		 * Memoized card bodies: a board re-render (session streaming, a gesture
		 * commit, an idle tick) must not rebuild every card's control tree.
		 */
		const TaskSessionBodyView = (0, react.memo)(TaskSessionBody);
		const TaskJobsBodyView = (0, react.memo)(TaskJobsBody);
		const TaskSubagentsBodyView = (0, react.memo)(TaskSubagentsBody);
		const TaskWorkspaceBodyView = (0, react.memo)(TaskWorkspaceBody);
		const TaskPluginsBodyView = (0, react.memo)(TaskPluginsBody);
		const TaskUserBodyView = (0, react.memo)(TaskUserBody);
		//#region temp conversation (card chat)
		/** Runtime sender installed by apply() that prompts the current main session. */
		let taskCardChatSend = null;
		function setTaskCardChatSender(sendFn) {
			taskCardChatSend = sendFn;
		}
		/** Prompt the current main session through the standard sessions service. */
		async function taskChatPromptViaSessions(ctx, text) {
			try {
				const sessions = ctx.get("sessions");
				if (sessions === null || sessions === void 0) return { ok: false, message: "sessions 服务不可用" };
				let state = null;
				const source = sessions.list;
				if (typeof source === "function") state = source();
				else if (source !== null && typeof source.getSnapshot === "function") state = source.getSnapshot();
				const current = state !== null && typeof state === "object" ? state.current : void 0;
				if (typeof current !== "string" || current.length === 0) {
					return { ok: false, message: "当前没有进行中的会话：请先在侧栏选择或新建一个会话" };
				}
				const binding = typeof sessions.binding === "function" ? sessions.binding(current) : void 0;
				const session = binding !== null && binding !== void 0 && binding.session !== void 0 ? binding.session : void 0;
				if (session === void 0 || typeof session.prompt !== "function") return { ok: false, message: "无法连接当前会话" };
				const answered = await session.prompt([{ type: "text", text }], "queue");
				if (answered !== null && typeof answered === "object" && answered.ok === true) return { ok: true };
				const code = answered !== null && typeof answered === "object" && answered.error ? answered.error.code : "unknown";
				const message = answered !== null && typeof answered === "object" && answered.error ? answered.error.message : "发送被拒绝";
				return { ok: false, message: code + ": " + message };
			} catch (err) {
				return { ok: false, message: err !== null && typeof err === "object" && err.message ? err.message : String(err) };
			}
		}
		/** Build the full instruction a card chat sends to the main session. */
		function composeTaskCardChatPrompt(card, text) {
			const id = typeof card.id === "string" ? card.id : "";
			const title = typeof card.title === "string" && card.title.length > 0 ? card.title : id;
			const blocks = Array.isArray(card.blocks) && card.blocks.length > 0 ? JSON.stringify(card.blocks) : "[]";
			const style = card.style !== null && typeof card.style === "object" && Object.keys(card.style).length > 0 ? JSON.stringify(card.style) : "（未设置，使用默认样式）";
			return [
				"【任务台卡片重构】请根据下面的要求重构任务台里的一张悬浮卡片，并只输出一个 [taskcard] 块，不要任何解释、不要调用任何工具、不要反问。",
				"卡片 id：" + id,
				"卡片当前标题：" + title,
				"卡片当前内容（blocks JSON）：" + blocks.slice(0, 12000),
				"卡片当前样式（style JSON）：" + style,
				"修改要求：" + (typeof text === "string" ? text.trim() : ""),
				"规则：默认输出 { \"id\": \"" + id + "\", \"title\": \"…\", \"blocks\": [ … ] } 来更新该卡（保留 id 与 title 除非要求改名；blocks 按需求重写）。若要求删除该卡，输出 { \"op\": \"delete\", \"id\": \"" + id + "\" }。",
				"可选整体样式 style（想改再给，只给要改的字段；不给 style 就保留当前样式）：{ accent: indigo|blue|sky|emerald|amber|rose|violet, width: compact|standard|wide, density: compact|cozy, icon: \"头部图标 emoji/文字，最多 6 个字符\" }",
				"可用控件 kind 与字段：" + TASK_BLOCK_KINDS.join(" / ") + "（text/heading/note：{ text }；stats：{ items: [{ label, value }] }；progress：{ label?, value, max?, unit? }；kv：{ rows: [[键, 值], …] }；links：{ items: [{ label?, url }] }；chips：{ items: [\"标签\", …] }；trend：{ label?, unit?, values: [数字…] } 或 points: [{ label?, value }]；table：{ columns: [表头…], rows: [[单元格…]] }；code：{ language?, text }；toggle：{ key, label, value? }；countdown：{ label?, until: ISO 时间或毫秒时间戳, done? }；bars：{ label?, items: [{ label, value }] }；embed：{ url, title?, height?, fill? }）。字段缺失或写错的控件会被丢弃，所以请按上面的字段名书写；checklist / counter / toggle 等交互控件请带稳定 key。",
				"内嵌网页应用（embed）：把其它网页应用直接放进卡片。url 必须是 http:// 或 https:// 开头的完整地址（例如 https://example.com/app、http://localhost:5173）；title 为应用名（可选，≤80 字）；height 为像素高度（120–1200，默认 300）；fill: true 表示让应用铺满卡片剩余高度（适合把卡片当成一个应用窗口，建议同时提示用户把卡片拖大）。需要时一张卡片可以放多个控件（例如 embed + text + button），最多 4 个 embed。若某个站点禁止被嵌入（X-Frame-Options/CSP），画面会空白，此时卡片上的 ↗ 可在新标签打开——不要因此改用别的控件。",
				"控件身份：每个控件可能带一个 \"bid\" 字段（卡片画布上该控件的身份）。请**原样保留**要保留的控件的 bid，这样它在卡片画布上的位置和尺寸不会变；只有新增的控件才省略 bid（由客户端分配）。控件上的 \"key\" 用于交互状态（勾选、计数），同样请保留。"
			].join("\n");
		}
		/** Popup that edits a card through a conversation with the main session. */
		/** Runtime bridge installed by apply(): refactor a card through a temporary agent session. */
		let taskCardAgentRefactor = null;
		function setTaskCardAgentRefactor(fn) {
			taskCardAgentRefactor = fn;
		}
		function hasTaskCardAgent() {
			return taskCardAgentRefactor !== null;
		}
		/** Concatenate the text blocks of one assistant message content array. */
		function assistantTextOfBlocks(blocks) {
			if (!Array.isArray(blocks)) return "";
			const parts = [];
			for (const block of blocks) {
				if (block !== null && typeof block === "object" && (block.type === "text" || block.kind === "text") && typeof block.text === "string") parts.push(block.text);
			}
			return parts.join("\n");
		}
		/** Text carried by one transient assistant live chunk (streaming row). */
		function assistantTextOfChunk(chunk) {
			if (chunk === null || typeof chunk !== "object") return "";
			if (chunk.type === "text-delta" && typeof chunk.text === "string") return chunk.text;
			return "";
		}
		/** Entries of one bound session's event window (empty when it is not open). */
		function taskEventEntries(eventSource) {
			let snapshot = null;
			try {
				if (eventSource !== null && eventSource !== void 0 && typeof eventSource.getSnapshot === "function") snapshot = eventSource.getSnapshot();
			} catch { snapshot = null; }
			return snapshot !== null && snapshot !== void 0 && Array.isArray(snapshot.entries) ? snapshot.entries : [];
		}
		/** Highest event seq currently in one bound session's window (fork baseline). */
		function latestTaskEventSeq(eventSource) {
			let seq = -1;
			for (const entry of taskEventEntries(eventSource)) {
				const event = entry !== null && typeof entry === "object" ? entry.event : null;
				if (event !== null && typeof event === "object" && typeof event.seq === "number" && event.seq > seq) seq = event.seq;
			}
			return seq;
		}
		/**
		 * Whether a seeded session tail carries work the child never asked for.
		 *
		 * `session.fork` extends its cut through trailing out-of-band appends up
		 * to the next `turn/start`, so a source message still waiting in the
		 * inbox is copied into the child as pending work: the child answers that
		 * message first and the caller's own prompt queues behind it. An open
		 * turn in the tail is the same hazard seen one step later.
		 * @param entries - the bound child's event-window entries.
		 * @returns true when the tail holds an unconsumed inbox insert or an open turn.
		 */
		function taskSeedCarriesPendingWork(entries) {
			for (let index = entries.length - 1; index >= 0; index--) {
				const entry = entries[index];
				const event = entry !== null && typeof entry === "object" ? entry.event : null;
				if (event === null || typeof event !== "object") continue;
				if (event.type === "turn/end") return false;
				if (event.type === "turn/start") return true;
				if (event.type !== "agent/inbox/spliced") continue;
				const data = event.data !== null && typeof event.data === "object" ? event.data : null;
				if (data !== null && data.target === "next-turn" && Array.isArray(data.inserted) && data.inserted.length > 0) return true;
			}
			return false;
		}
		/**
		 * Facts the read loop needs from the child's own window: whether the
		 * instruction it was just sent has become a user message, and whether a
		 * turn has ended since.
		 * @param eventSource - the child binding's event source.
		 * @param baselineSeq - highest seq inherited before the prompt was sent.
		 * @param marker - text identifying the instruction inside a user message.
		 * @returns `{ ownPrompt, turnEnded }`.
		 */
		function taskWindowPromptFacts(eventSource, baselineSeq, marker) {
			let ownPrompt = false;
			let turnEnded = false;
			for (const entry of taskEventEntries(eventSource)) {
				const event = entry !== null && typeof entry === "object" ? entry.event : null;
				if (event === null || typeof event !== "object") continue;
				if (typeof event.seq === "number" && event.seq <= baselineSeq) continue;
				if (event.type === "turn/end") { turnEnded = true; continue; }
				if (event.type !== "user/message") continue;
				const data = event.data !== null && typeof event.data === "object" ? event.data : null;
				if (data !== null && marker.length > 0 && assistantTextOfBlocks(data.content).indexOf(marker) !== -1) ownPrompt = true;
			}
			return { ownPrompt, turnEnded };
		}
		/**
		 * Fold one attempt's transient live-chunk rows into per-block text, the
		 * same way the chat view does: `text-delta` appends to its block and a
		 * text `block-end` replaces that block with the settled full text. Adding
		 * both together would double the block's text, so they share one slot.
		 * @param blocks - index → text accumulator, mutated in place.
		 */
		function applyTaskLiveChunk(blocks, chunk) {
			if (chunk === null || typeof chunk !== "object") return;
			const index = typeof chunk.index === "number" ? chunk.index : 0;
			const delta = assistantTextOfChunk(chunk);
			if (delta.length > 0) {
				blocks.set(index, (blocks.get(index) ?? "") + delta);
				return;
			}
			if (chunk.type === "block-end" && chunk.block !== null && typeof chunk.block === "object" && chunk.block.type === "text" && typeof chunk.block.text === "string") {
				blocks.set(index, chunk.block.text);
			}
		}
		/**
		 * Latest assistant text newer than the baseline in one bound session.
		 *
		 * The Session snapshot carries lifecycle state only — it has no `nodes`
		 * or `partial` transcript view — so the reply is assembled from the
		 * binding's event source instead: durable `assistant/message` events plus
		 * the transient `assistant/live-chunk` rows that precede each settlement.
		 * @param eventSource - binding.eventSource, or any SessionEventSource.
		 * @param baselineSeq - highest seq already inherited when the prompt was sent.
		 * @returns the latest assistant text, streamed text preferred while it grows.
		 */
		function latestTaskAssistantText(eventSource, baselineSeq) {
			let durable = "";
			const liveBlocks = new Map();
			for (const entry of taskEventEntries(eventSource)) {
				const event = entry !== null && typeof entry === "object" ? entry.event : null;
				if (event === null || typeof event !== "object") continue;
				if (typeof event.seq === "number" && event.seq <= baselineSeq) continue;
				if (event.type === "assistant/message") {
					const data = event.data !== null && typeof event.data === "object" ? event.data : null;
					const message = data !== null && data.message !== null && typeof data.message === "object" ? data.message : null;
					const text = assistantTextOfBlocks(message !== null ? message.content : null);
					if (text.trim().length > 0) durable = text;
					continue;
				}
				if (event.type === "assistant/live-chunk") {
					const data = event.data !== null && typeof event.data === "object" ? event.data : null;
					applyTaskLiveChunk(liveBlocks, data !== null ? data.chunk : null);
				}
			}
			const live = [...liveBlocks.entries()].sort((left, right) => left[0] - right[0]).map(([, text]) => text).join("\n");
			if (live.trim().length === 0) return durable;
			if (durable.trim().length === 0) return live;
			return live.length >= durable.length ? live : durable;
		}
		/** Current main-session id from the sessions service. */
		function currentTaskSessionId(sessions) {
			let state = null;
			const source = sessions.list;
			if (typeof source === "function") state = source();
			else if (source !== null && source !== void 0 && typeof source.getSnapshot === "function") state = source.getSnapshot();
			const current = state !== null && typeof state === "object" ? state.current : void 0;
			return typeof current === "string" && current.length > 0 ? current : null;
		}
		/** Working directory of one listed session, when the list knows it. */
		function taskSessionCwd(sessions, sessionId) {
			if (sessionId === null) return void 0;
			try {
				const state = sessions.list !== null && sessions.list !== void 0 && typeof sessions.list.getSnapshot === "function" ? sessions.list.getSnapshot() : null;
				const summary = state !== null && state !== void 0 && state.byId !== void 0 ? state.byId[sessionId] : void 0;
				return summary !== null && summary !== void 0 && typeof summary.cwd === "string" && summary.cwd.length > 0 ? summary.cwd : void 0;
			} catch { return void 0; }
		}
		/**
		 * Location payload for the temporary session's `sessions.create`.
		 *
		 * The UI's new-session path targets a workspace id, so a registered
		 * workspace owning the source session's cwd is preferred; a raw cwd is the
		 * documented alternative and the empty payload lets the host apply its own
		 * default.
		 * @param ctx - client root context (workspaces service).
		 * @param cwd - source session working directory, when known.
		 * @returns `{ workspaceId }`, `{ cwd }`, or `{}`.
		 */
		function taskTempCreateOptions(ctx, cwd) {
			if (cwd === void 0) return {};
			try {
				const workspaces = ctx.get("workspaces");
				const source = workspaces !== null && workspaces !== void 0 ? workspaces.list : void 0;
				const snapshot = source !== null && source !== void 0 && typeof source.getSnapshot === "function" ? source.getSnapshot() : null;
				const items = snapshot !== null && snapshot !== void 0 && Array.isArray(snapshot.items) ? snapshot.items : [];
				const target = cwd.toLowerCase();
				for (const item of items) {
					if (item !== null && typeof item === "object" && typeof item.path === "string" && item.path.toLowerCase() === target && typeof item.id === "string" && item.id.length > 0) {
						return { workspaceId: item.id };
					}
				}
			} catch { /* an unreadable workspace list just falls back to the raw cwd */ }
			return { cwd };
		}
		/** One session's lifecycle snapshot, or null when it cannot be read. */
		function taskSessionSnapshot(session) {
			try {
				if (typeof session.getSnapshot === "function") return session.getSnapshot();
			} catch { /* snapshot reads are best-effort */ }
			return null;
		}
		/**
		 * Drop every pending inbox item of one session.
		 *
		 * A forked child seeds its agent inbox from the inherited event prefix, so
		 * it can start life holding a *stale* prompt the source session had already
		 * consumed (its consuming splice sits past the fork cut). That stale turn
		 * must go, otherwise the card instruction simply queues behind it and the
		 * refactor never runs.
		 * @param session - the temporary session's face.
		 * @returns how many items were asked to be removed.
		 */
		async function purgeTaskSessionQueue(session) {
			if (typeof session.updateQueue !== "function") return 0;
			const snapshot = taskSessionSnapshot(session);
			const queue = snapshot !== null && snapshot !== void 0 && Array.isArray(snapshot.queue) ? snapshot.queue : [];
			let removed = 0;
			for (const item of queue) {
				if (item === null || typeof item !== "object" || typeof item.id !== "string") continue;
				if (item.placement === "context") continue;
				try {
					await session.updateQueue(item.id, { kind: "remove" });
					removed++;
				} catch { /* a queue mutation is best-effort cleanup */ }
			}
			return removed;
		}
		/** Wait until one session reports no running turn (bounded). */
		async function waitTaskSessionIdle(session, timeoutMs) {
			const deadline = Date.now() + timeoutMs;
			while (Date.now() < deadline) {
				const snapshot = taskSessionSnapshot(session);
				if (snapshot === null || snapshot.running !== true) return true;
				await taskDelay(300);
			}
			return (taskSessionSnapshot(session)?.running ?? false) !== true;
		}
		/** Human-readable message from an unknown thrown value. */
		function taskErrorMessage(err) {
			return err !== null && typeof err === "object" && typeof err.message === "string" && err.message.length > 0 ? err.message : String(err);
		}
		function taskDelay(ms) {
			return new Promise((resolve) => setTimeout(resolve, ms));
		}
		/**
		 * Open the temporary session the card refactor runs in.
		 *
		 * A brand-new **blank session** is the preferred helper. `session.fork`
		 * seeds the child from the source's event prefix, so a forked child
		 * inherits that conversation's whole history *and* the agent inbox
		 * reconstructed from it: a source message spliced in just before the cut
		 * arrives as pending work, the child answers that first, and the card
		 * instruction queues behind it. That is not theoretical — a forked helper
		 * spent minutes re-running a stale source prompt and never touched the
		 * card, and every fork of that conversation repeated it. A blank session
		 * inherits neither history nor inbox, runs on the deployment's default
		 * preset/model, and pays only for the card instruction.
		 *
		 * `session.fork` stays as the fallback for a host without `create` (or one
		 * that refuses it); the caller cleans that path up — dropping inherited
		 * queue items and stopping a stale inherited turn — before prompting.
		 * @param sessions - the client sessions service.
		 * @param ctx - client root context (workspaces service, for the target).
		 * @param sourceId - current session id, or null when there is none.
		 * @returns `{ ok: true, id, mode, note? }` or `{ ok: false, message }`.
		 */
		async function createTaskTempSession(sessions, ctx, sourceId) {
			const blank = await createTaskBlankSession(sessions, ctx, sourceId);
			if (blank.ok === true) return blank;
			let forkReason = "";
			if (sourceId !== null && typeof sessions.fork === "function") {
				try {
					const childId = await sessions.fork({ sessionId: sourceId });
					if (typeof childId === "string" && childId.length > 0) {
						return { ok: true, id: childId, mode: "fork", note: "无法新建空白临时会话（" + blank.message + "），已改用派生临时会话。" };
					}
					forkReason = "fork 没有返回会话 id";
				} catch (err) {
					forkReason = taskErrorMessage(err);
				}
			}
			return { ok: false, message: "无法创建临时 agent 会话：" + blank.message + (forkReason.length > 0 ? "；派生也失败：" + forkReason : "") };
		}
		/**
		 * Create a blank temporary session for the card refactor, in the source
		 * session's workspace (or cwd, or the host default).
		 * @param sessions - the client sessions service.
		 * @param ctx - client root context (workspaces service).
		 * @param sourceId - current session id, or null when there is none.
		 * @returns `{ ok: true, id, mode: "create" }` or `{ ok: false, message }`.
		 */
		async function createTaskBlankSession(sessions, ctx, sourceId) {
			if (typeof sessions.create !== "function") return { ok: false, message: "缺少会话服务" };
			try {
				const created = await sessions.create(taskTempCreateOptions(ctx, taskSessionCwd(sessions, sourceId)));
				if (typeof created === "string" && created.length > 0) return { ok: true, id: created, mode: "create" };
				return { ok: false, message: "create 没有返回会话 id" };
			} catch (err) {
				return { ok: false, message: taskErrorMessage(err) };
			}
		}
		/**
		 * Bind one child session and open its event window.
		 *
		 * The listing may land a beat after the id resolves, so binding retries
		 * briefly. A non-current session is not staged, so its event window is
		 * cold: open() pulls its tail page and subscribes to its live stream,
		 * which is where the agent's reply arrives. Failure there costs the live
		 * stream only — never the prompt.
		 * @param sessions - the client sessions service.
		 * @param childId - the session to bind.
		 * @returns `{ session, eventSource }`, or null when the child is unusable.
		 */
		async function openTaskChildSession(sessions, childId) {
			let binding = null;
			const bindingDeadline = Date.now() + 4000;
			while (Date.now() < bindingDeadline) {
				try { binding = sessions.binding(childId); } catch { binding = null; }
				if (binding !== null && binding !== void 0) break;
				await taskDelay(250);
			}
			const session = binding !== null && binding !== void 0 ? binding.session : void 0;
			if (session === void 0 || typeof session.prompt !== "function") return null;
			try {
				if (typeof session.open === "function") await session.open();
			} catch { /* the window may already be open, or the pull may fail */ }
			const eventSource = binding.eventSource !== void 0 ? binding.eventSource : session.eventSource;
			return { session, eventSource };
		}
		/**
		 * Build the agent-backed refactor bridge: open a temporary session, prompt
		 * it with the card instruction, capture its reply from that session's
		 * event window, apply the [taskcard] spec, then archive the helper session.
		 * @param ctx - client root context (sessions / workspaces services).
		 * @returns the refactor function, or null when the services are unavailable.
		 */
		function createTaskCardAgentBridge(ctx) {
			const archiveChild = (childId) => {
				try {
					const workspaces = ctx.get("workspaces");
					if (workspaces !== null && workspaces !== void 0 && typeof workspaces.archiveSession === "function") {
						void Promise.resolve(workspaces.archiveSession(childId)).catch(() => {});
					}
				} catch { /* cleanup is best-effort */ }
			};
			return async function refactorCardWithAgent(payload, onEvent) {
				const notify = typeof onEvent === "function" ? onEvent : () => {};
				let sessions = null;
				try { sessions = ctx.get("sessions"); } catch { sessions = null; }
				if (sessions === null || sessions === void 0 || typeof sessions.binding !== "function" || (typeof sessions.fork !== "function" && typeof sessions.create !== "function")) {
					return { ok: false, fallback: true, message: "agent 服务不可用（缺少会话服务）" };
				}
				let childId = null;
				try {
					const sourceId = currentTaskSessionId(sessions);
					const started = await createTaskTempSession(sessions, ctx, sourceId);
					if (started.ok !== true) return { ok: false, fallback: true, message: started.message };
					childId = started.id;
					let mode = started.mode;
					let note = started.note;
					const child = await openTaskChildSession(sessions, childId);
					if (child === null) {
						archiveChild(childId);
						return { ok: false, fallback: true, message: "临时 agent 会话不可用" };
					}
					const session = child.session;
					const eventSource = child.eventSource;
					let baselineSeq = latestTaskEventSeq(eventSource);
					if (mode === "fork") {
						// The fallback helper may have inherited source work: an unconsumed
						// inbox insert from the seed tail, or a stale turn already running.
						// Drop it, stop it, and re-baseline so that turn's partial answer can
						// never be mistaken for the card reply.
						const pending = taskSeedCarriesPendingWork(taskEventEntries(eventSource));
						const removed = await purgeTaskSessionQueue(session);
						const running = (taskSessionSnapshot(session)?.running ?? false) === true;
						if (running && typeof session.cancel === "function") {
							try { await session.cancel(); } catch { /* the stale turn may settle on its own */ }
							await waitTaskSessionIdle(session, 15000);
						}
						if (pending || removed > 0 || running) {
							baselineSeq = latestTaskEventSeq(eventSource);
							note = "派生会话携带了源会话尚未处理的排队消息，已清空该队列后再重构。";
						}
					}
					notify({ phase: "started", sessionId: childId, mode, note });
					const instruction = composeTaskCardChatPrompt(payload, payload.instruction);
					// The instruction embeds "卡片 id：<id>"; that line identifies our own
					// user message in the child's window even when several card prompts
					// pass through the same session.
					const ownPromptMarker = typeof payload.id === "string" && payload.id.length > 0 ? "卡片 id：" + payload.id : instruction.slice(0, 40);
					let accepted = null;
					try {
						accepted = await session.prompt([{ type: "text", text: instruction }], "queue");
					} catch (err) {
						archiveChild(childId);
						return { ok: false, message: "发送失败：" + taskErrorMessage(err) };
					}
					if (accepted === null || accepted === void 0 || accepted.ok !== true) {
						archiveChild(childId);
						const message = accepted !== null && accepted !== void 0 && accepted.error ? accepted.error.code + ": " + accepted.error.message : "发送被拒绝";
						return { ok: false, message };
					}
					const promptedAt = Date.now();
					const deadline = promptedAt + 210000;
					// An agent starts streaming within seconds, so an empty read this long
					// after acceptance means the helper's event window is not delivering
					// (it was never opened, or the stream failed) — degrade to the main
					// session instead of waiting out the full deadline in silence.
					const readDeadline = promptedAt + 60000;
					// A reply that starts before our own instruction shows up as a user
					// message belongs to a turn the child inherited; give the prompt a
					// few seconds to land, then stop waiting on work that is not ours.
					const ownPromptGrace = 4000;
					let latest = "";
					let spec = null;
					let lastChange = Date.now();
					let sawRunning = false;
					let sawOwnPrompt = false;
					while (Date.now() < deadline) {
						const text = latestTaskAssistantText(eventSource, baselineSeq);
						const facts = taskWindowPromptFacts(eventSource, baselineSeq, ownPromptMarker);
						if (facts.ownPrompt) sawOwnPrompt = true;
						if (text.length > 0 && text !== latest) {
							latest = text;
							lastChange = Date.now();
							notify({ phase: "assistant", text });
						}
						let snapshot = null;
						try {
							if (typeof session.getSnapshot === "function") snapshot = session.getSnapshot();
						} catch { snapshot = null; }
						if (snapshot !== null && snapshot !== void 0 && snapshot.running === true) sawRunning = true;
						if (!sawOwnPrompt && Date.now() - promptedAt > ownPromptGrace && (latest.length > 0 || sawRunning)) {
							archiveChild(childId);
							return { ok: false, fallback: true, message: latest.length > 0 ? "临时 agent 会话在回复源会话遗留的消息，已改用主会话" : "临时 agent 会话没有接住这条指令（可能被源会话的排队消息占用），已改用主会话" };
						}
						if (latest.length > 0) {
							const parsed = parseTaskCardSpec(latest);
							const settled = sawRunning === true ? Date.now() - lastChange > 1200 : Date.now() - lastChange > 2500;
							if (parsed !== null && settled) { spec = parsed; break; }
						} else if (facts.turnEnded) {
							archiveChild(childId);
							return { ok: false, fallback: true, message: "临时 agent 会话的回合已结束但没有产出 [taskcard]，已改用主会话" };
						} else if (Date.now() > readDeadline) {
							archiveChild(childId);
							return { ok: false, fallback: true, message: "临时 agent 会话在 60 秒内没有可读取的回复" };
						}
						await taskDelay(700);
					}
					if (latest.length === 0) {
						archiveChild(childId);
						return { ok: false, message: "agent 未返回内容（可能超时）" };
					}
					if (spec === null) spec = parseTaskCardSpec(latest);
					if (spec === null) {
						archiveChild(childId);
						return { ok: false, message: "agent 的回复里没有可用的 [taskcard] 定义", text: latest };
					}
					const target = { ...spec, id: payload.id };
					const applied = typeof payload.applySpec === "function" ? payload.applySpec(target) : applyTaskCardSpec(target);
					archiveChild(childId);
					if (applied === null || applied === void 0 || applied.ok !== true) {
						return { ok: false, message: "卡片更新失败：" + (applied !== null && applied !== void 0 && applied.reason ? applied.reason : "未知原因"), text: latest };
					}
					notify({ phase: "applied", id: payload.id });
					return { ok: true, text: latest };
				} catch (err) {
					if (childId !== null) archiveChild(childId);
					return { ok: false, fallback: true, message: "临时 agent 会话失败：" + taskErrorMessage(err) };
				}
			};
		}
		/** Popup that refactors a card through a conversation with a temporary agent session. */
		function TaskCardChat(props) {
			const { card, onClose, applySpec } = props;
			const agentMode = hasTaskCardAgent();
			const [text, setText] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const [hint, setHint] = (0, react.useState)(null);
			const [log, setLog] = (0, react.useState)([]);
			const bodyRef = (0, react.useRef)(null);
			const bootCountRef = (0, react.useRef)(-1);
			const appendLog = (entry) => setLog((previous) => [...previous, entry]);
			const upsertLog = (key, entry) => setLog((previous) => {
				const next = previous.slice();
				const index = next.findIndex((item) => item.key === key);
				if (index === -1) next.push(entry);
				else next[index] = entry;
				return next;
			});
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					event.preventDefault();
					onClose();
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey, true);
			}, [onClose]);
			(0, react.useEffect)(() => {
				if (agentMode) return;
				if (typeof document === "undefined") return;
				const refresh = () => {
					if (document.hidden === true) return;
					const anchors = Array.from(document.querySelectorAll("[data-chat-anchor-key]"));
					if (bootCountRef.current === -1) {
						bootCountRef.current = anchors.length;
						return;
					}
					const next = anchors.slice(bootCountRef.current).map((row, index) => {
						const kind = typeof row.getAttribute === "function" ? row.getAttribute("data-chat-flow-kind") : null;
						const label = kind === "user" ? "你" : isTaskChatTextKind(kind) ? "AI" : "系统";
						const raw = (row.textContent ?? "").replace(/\s+/g, " ").trim();
						const shown = raw.length > 500 ? raw.slice(0, 500) + "…" : raw;
						return { key: "dom" + index, label, text: shown };
					}).filter((item) => item.text.length > 0);
					setLog((previous) => {
						const currentText = next.map((item) => item.label + item.text).join("\n");
						const prevText = previous.map((item) => item.label + item.text).join("\n");
						return currentText === prevText ? previous : next;
					});
				};
				refresh();
				const timer = setInterval(refresh, 1000);
				return () => clearInterval(timer);
			}, [agentMode]);
			(0, react.useEffect)(() => {
				const body = bodyRef.current;
				if (body !== null) body.scrollTop = body.scrollHeight;
			}, [log]);
			const doSend = () => {
				const trimmed = text.trim();
				if (trimmed.length === 0 || busy) return;
				setBusy(true);
				setError(null);
				setHint(null);
				appendLog({ key: "u" + Date.now(), label: "你", text: trimmed });
				/** Fallback path: send into the current main session (the global watcher applies the reply). */
				const sendViaMain = () => {
					const sender = taskCardChatSend;
					const promptText = composeTaskCardChatPrompt(card, trimmed);
					const outcome = sender !== null ? sender(promptText) : Promise.resolve({ ok: false, message: "服务不可用" });
					Promise.resolve(outcome).then((result) => {
						if (result !== null && result !== void 0 && result.ok === true) setHint("已发送到主会话。助手回复后会自动更新这张卡片；也可切回主会话查看。");
						else setError("发送失败：" + (result !== null && result !== void 0 && result.message ? result.message : "未知原因"));
						setBusy(false);
					}, () => {
						setError("发送失败：连接中断");
						setBusy(false);
					});
				};
				if (agentMode && taskCardAgentRefactor !== null) {
					const outcome = taskCardAgentRefactor(
						{ id: card.id, title: card.title, blocks: card.blocks, style: card.style, instruction: trimmed, applySpec },
						(event) => {
							if (event.phase === "started") {
								appendLog({ key: "s" + Date.now(), label: "系统", text: "已创建临时 agent 会话，正在重构卡片…" });
								if (typeof event.note === "string" && event.note.length > 0) appendLog({ key: "n" + Date.now(), label: "系统", text: event.note });
							}
							else if (event.phase === "assistant") upsertLog("assistant", { key: "assistant", label: "AI", text: event.text.length > 1200 ? event.text.slice(0, 1200) + "…" : event.text });
							else if (event.phase === "applied") appendLog({ key: "d" + Date.now(), label: "系统", text: "已应用：卡片已按你的要求重构 ✓" });
						}
					);
					Promise.resolve(outcome).then((result) => {
						if (result !== null && result !== void 0 && result.fallback === true) {
							appendLog({ key: "m" + Date.now(), label: "系统", text: "临时 agent 不可用（" + (result.message ? result.message : "未知原因") + "），已改用主会话…" });
							sendViaMain();
							return;
						}
						if (result === null || result === void 0 || result.ok !== true) setError("重构失败：" + (result !== null && result !== void 0 && result.message ? result.message : "未知原因"));
						else setHint("卡片已更新，可继续描述进一步修改。");
						setBusy(false);
					}, () => {
						setError("重构失败：连接中断");
						setBusy(false);
					});
					return;
				}
				sendViaMain();
			};
			const onKeyDown = (event) => {
				if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					doSend();
				}
			};
			const isBlank = !Array.isArray(card.blocks) || card.blocks.length === 0;
			const subtitle = agentMode
				? "用语言描述要如何重构卡片；会调用一个临时 agent 会话完成重构并自动更新（不占用主会话记录）。"
				: isBlank
					? "新卡片：描述你想要的样式与控件，AI 生成后会自动成形。"
					: "用语言描述你想怎么改（样式 / 标题 / 内部控件）；回复会自动更新这张卡片。";
			const placeholder = agentMode ? "例如：重构为趋势看板——加趋势图、完成率进度和复制按钮…" : "例如：「周报样式，蓝色强调、宽卡片、头部图标 📊；内容给一个本周完成的勾选清单和复制按钮」。";
			return (0, react_jsx_runtime.jsx)("div", {
				className: "dsh-tc-chatOverlay",
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-chat",
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-chatHead",
							children: [
								(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chatTitle", children: "对话重构 · " + (typeof card.title === "string" && card.title.length > 0 ? card.title : card.id) }),
								(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chatSub", children: subtitle })
							]
						}),
						(0, react_jsx_runtime.jsx)("div", {
							ref: bodyRef,
							className: "dsh-tc-chatBody",
							children: log.length === 0
								? (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chatHint", children: agentMode ? "例如：「把这张卡重构为项目周报：标题、周期、完成清单、趋势图和复制按钮」。" : "例如：「周报样式，蓝色强调、宽卡片、头部图标 📊；内容给一个本周完成的勾选清单和复制按钮」。" })
								: log.map((item, index) => (0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-msg" + (item.label === "你" ? " dsh-tc-msg-user" : item.label === "AI" ? " dsh-tc-msg-ai" : ""), children: [
									(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-msg-label", children: item.label }),
									(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-msg-text", children: item.text })
								] }, item.key + "#" + index))
						}),
						error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chatErr", children: error }),
						hint !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chatHint", children: hint }),
						(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chatInputRow", children: [
							(0, react_jsx_runtime.jsx)("textarea", {
								className: "dsh-tc-chatTa",
								value: text,
								maxLength: 4000,
								placeholder,
								onChange: (event) => setText(event.target.value),
								onKeyDown
							})
						] }),
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-chatFoot",
							children: [
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onClose, children: "完成" }),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btnPrimary", disabled: busy, onClick: doSend, children: busy ? "重构中…" : "发送" })
							]
						})
					]
				})
			});
		}
		//#endregion
		//#region infinite canvas + collaboration
		const CANVAS_STORAGE_KEY = "dsh.taskconsole.canvas.v1";
		const CANVAS_NICK_KEY = "dsh.taskconsole.nick.v1";
		const CANVAS_VIEW_MIN = 0.2;
		const CANVAS_VIEW_MAX = 2.5;
		const CANVAS_SYNC_LIMIT = 900000;
		const CANVAS_IMAGE_LIMIT = 700000;
		const CANVAS_SHARE_PREFIX = "DSHCANVAS1:";
		/** Canvas id prefix of the per-card "instance" canvases opened by maximizing a card. */
		const CANVAS_INSTANCE_PREFIX = "cv-inst-";
		/** Width of one exploded control item (and of the wider embedded-app items). */
		const TASK_CANVAS_COLUMN = 340;
		const TASK_CANVAS_EMBED_W = 460;
		/** Fresh canvas state (no canvases yet). */
		function freshCanvasState() {
			return { canvases: {}, activeId: null, views: {}, relay: "", token: "", nickname: "" };
		}
		function nextCanvasId() {
			return "cv" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
		}
		function nextCanvasCardId() {
			return "cc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
		}
		function clampCanvasNumber(value, fallback, min, max) {
			return typeof value === "number" && Number.isFinite(value) ? Math.min(Math.max(min, value), max) : fallback;
		}
		/** Validate one canvas card (board card shape minus board-only fields). */
		function sanitizeCanvasCard(raw, fallbackId) {
			if (raw === null || typeof raw !== "object") return null;
			const id = typeof raw.id === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(raw.id) ? raw.id : fallbackId;
			if (typeof id !== "string" || id.length === 0) return null;
			const card = {
				id,
				title: typeof raw.title === "string" ? raw.title.slice(0, TASK_TITLE_LIMIT) : "",
				x: clampCanvasNumber(raw.x, 0, -1000000, 1000000),
				y: clampCanvasNumber(raw.y, 0, -1000000, 1000000),
				updatedAt: typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
				rev: typeof raw.rev === "string" ? raw.rev.slice(0, 64) : ""
			};
			if (Array.isArray(raw.blocks)) {
				const blocks = sanitizeTaskBlocks(raw.blocks);
				if (blocks.length > 0) card.blocks = blocks;
			}
			if (raw.style !== void 0) {
				const style = sanitizeTaskStyle(raw.style);
				if (style !== void 0) card.style = style;
			}
			if (raw.widgets !== void 0) {
				const widgets = sanitizeTaskWidgets(raw.widgets);
				if (widgets !== void 0) card.widgets = widgets;
			}
			if (typeof raw.w === "number" && Number.isFinite(raw.w)) card.w = Math.round(clampCanvasNumber(raw.w, 300, TASK_CARD_MIN_W, TASK_CARD_MAX_W));
			if (typeof raw.h === "number" && Number.isFinite(raw.h)) card.h = Math.round(clampCanvasNumber(raw.h, 220, TASK_CARD_MIN_H, TASK_CARD_MAX_H));
			// A bound item maps one control (by `bid`) of one board card.
			const from = raw.from;
			if (from !== null && typeof from === "object" && typeof from.card === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(from.card) && typeof from.bid === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(from.bid)) {
				card.from = { card: from.card, bid: from.bid };
			}
			// A bare item is a control without any card around it.
			if (raw.bare === true) card.bare = true;
			return card;
		}
		/** Validate one canvas (named board of cards). */
		function sanitizeCanvas(raw) {
			if (raw === null || typeof raw !== "object") return null;
			const id = typeof raw.id === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(raw.id) ? raw.id : "";
			if (id.length === 0) return null;
			const canvas = {
				id,
				name: typeof raw.name === "string" && raw.name.trim().length > 0 ? raw.name.trim().slice(0, 40) : "未命名画布",
				cards: {},
				updatedAt: typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now()
			};
			const rawCards = raw.cards;
			if (rawCards !== null && typeof rawCards === "object") {
				for (const [key, value] of Object.entries(rawCards)) {
					const card = sanitizeCanvasCard(value, key);
					if (card !== null) canvas.cards[card.id] = card;
				}
			}
			return canvas;
		}
		function sanitizeCanvasState(parsed) {
			const state = freshCanvasState();
			if (parsed === null || typeof parsed !== "object") return state;
			const rawCanvases = parsed.canvases;
			if (rawCanvases !== null && typeof rawCanvases === "object") {
				for (const [key, value] of Object.entries(rawCanvases)) {
					const canvas = sanitizeCanvas(value === null || typeof value !== "object" ? { id: key } : { ...value, id: typeof value.id === "string" ? value.id : key });
					if (canvas !== null) state.canvases[canvas.id] = canvas;
				}
			}
			if (typeof parsed.activeId === "string" && state.canvases[parsed.activeId] !== void 0) state.activeId = parsed.activeId;
			const rawViews = parsed.views;
			if (rawViews !== null && typeof rawViews === "object") {
				for (const [key, value] of Object.entries(rawViews)) {
					if (state.canvases[key] === void 0 || value === null || typeof value !== "object") continue;
					state.views[key] = {
						x: clampCanvasNumber(value.x, 40, -1e6, 1e6),
						y: clampCanvasNumber(value.y, 40, -1e6, 1e6),
						k: clampCanvasNumber(value.k, 1, CANVAS_VIEW_MIN, CANVAS_VIEW_MAX)
					};
				}
			}
			if (typeof parsed.relay === "string") state.relay = parsed.relay.trim().slice(0, 300);
			if (typeof parsed.token === "string") state.token = parsed.token.slice(0, 200);
			if (typeof parsed.nickname === "string") state.nickname = parsed.nickname.trim().slice(0, 24);
			return state;
		}
		function readCanvasState() {
			if (typeof localStorage === "undefined") return null;
			try {
				const raw = localStorage.getItem(CANVAS_STORAGE_KEY);
				if (raw === null) return null;
				return sanitizeCanvasState(JSON.parse(raw));
			} catch {
				return null;
			}
		}
		function writeCanvasState(state) {
			if (typeof localStorage === "undefined") return;
			try {
				localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(state));
			} catch {
				/* storage may be unavailable (private mode) */
			}
		}
		function readCanvasNickname() {
			if (typeof localStorage === "undefined") return "";
			try { return (localStorage.getItem(CANVAS_NICK_KEY) ?? "").slice(0, 24); } catch { return ""; }
		}
		function writeCanvasNickname(value) {
			if (typeof localStorage === "undefined") return;
			try { localStorage.setItem(CANVAS_NICK_KEY, value); } catch { /* storage may be unavailable */ }
		}
		/** Module-level canvas store shared by the canvas view, the sync client and cross-tab updates. */
		const canvasStore = { state: null, listeners: new Set() };
		function ensureCanvasLoaded() {
			if (canvasStore.state !== null) return;
			const loaded = readCanvasState();
			canvasStore.state = loaded !== null ? loaded : freshCanvasState();
			if (canvasStore.state.nickname.length === 0) canvasStore.state.nickname = readCanvasNickname();
		}
		function canvasSnapshot() {
			ensureCanvasLoaded();
			return canvasStore.state;
		}
		function subscribeCanvas(listener) {
			canvasStore.listeners.add(listener);
			return () => { canvasStore.listeners.delete(listener); };
		}
		function notifyCanvas() {
			for (const listener of [...canvasStore.listeners]) {
				try { listener(); } catch { /* a listener must never break the canvas */ }
			}
		}
		/** Persist + notify. `remote` marks an applied remote op so it is not echoed back. */
		function publishCanvasState(next, remote) {
			canvasStore.state = next;
			writeCanvasState(next);
			writeCanvasNickname(next.nickname);
			notifyCanvas();
			void remote;
		}
		function activeCanvas(state) {
			const source = state !== null && state !== void 0 ? state : canvasSnapshot();
			const id = source.activeId;
			return id !== null && source.canvases[id] !== void 0 ? source.canvases[id] : null;
		}
		function canvasCardStamp(card) {
			return (typeof card.updatedAt === "number" ? card.updatedAt : 0) + "|" + (typeof card.rev === "string" ? card.rev : "");
		}
		/** Last-writer-wins merge of one card (timestamp first, then the rev string as tie-break). */
		function mergeCanvasCard(left, right) {
			if (left === void 0 || left === null) return right;
			if (right === void 0 || right === null) return left;
			const a = typeof left.updatedAt === "number" ? left.updatedAt : 0;
			const b = typeof right.updatedAt === "number" ? right.updatedAt : 0;
			if (a !== b) return a > b ? left : right;
			return String(left.rev ?? "") >= String(right.rev ?? "") ? left : right;
		}
		/** Merge a remote canvas state into the local one, card by card. */
		function mergeCanvasState(local, remote) {
			const next = sanitizeCanvasState(local);
			for (const [id, remoteCanvas] of Object.entries(remote.canvases)) {
				const mine = next.canvases[id];
				if (mine === void 0) {
					next.canvases[id] = remoteCanvas;
					continue;
				}
				if (remoteCanvas.name !== mine.name && remoteCanvas.updatedAt > mine.updatedAt) {
					mine.name = remoteCanvas.name;
					mine.updatedAt = remoteCanvas.updatedAt;
				}
				for (const [cardId, remoteCard] of Object.entries(remoteCanvas.cards)) {
					if (remoteCard.deleted === true) {
						const mineCard = mine.cards[cardId];
						if (mineCard !== void 0 && mineCard.updatedAt <= remoteCard.updatedAt) delete mine.cards[cardId];
						continue;
					}
					mine.cards[cardId] = mergeCanvasCard(mine.cards[cardId], remoteCard);
				}
			}
			return next;
		}
		/** Copy a board card into a canvas card (independent copy). */
		function canvasCopyCard(source, x, y, nowTs) {
			const stamp = typeof nowTs === "number" ? nowTs : Date.now();
			const card = {
				id: nextCanvasCardId(),
				title: typeof source.title === "string" && source.title.length > 0 ? source.title : "未命名卡片",
				x: Math.round(x),
				y: Math.round(y),
				updatedAt: stamp,
				rev: canvasClientId + ":" + stamp.toString(36)
			};
			const blocks = effectiveTaskBlocks(source);
			if (blocks.length > 0) card.blocks = sanitizeTaskBlocks(blocks);
			if (source.style !== void 0) {
				const style = sanitizeTaskStyle(source.style);
				if (style !== void 0) card.style = style;
			}
			return card;
		}
		/** Control blocks produced by the manual editor: text, action buttons and embedded web apps. */
		function taskEditorBlocks(content) {
			const blocks = [];
			const text = typeof content.body === "string" ? content.body.trim() : "";
			if (text.length > 0) {
				const textBlock = sanitizeTaskBlock({ kind: "text", text }, blocks.length);
				if (textBlock !== null) blocks.push(textBlock);
			}
			for (const button of Array.isArray(content.buttons) ? content.buttons : []) {
				const buttonBlock = sanitizeTaskBlock({ kind: "button", action: button.action, label: button.label, value: button.value }, blocks.length);
				if (buttonBlock !== null) blocks.push(buttonBlock);
			}
			for (const embed of Array.isArray(content.embeds) ? content.embeds.slice(0, TASK_EMBED_LIMIT) : []) {
				const embedBlock = sanitizeTaskBlock({ kind: "embed", url: embed.url, title: embed.title, height: embed.height, fill: embed.fill === true }, blocks.length);
				if (embedBlock !== null) blocks.push(embedBlock);
			}
			return blocks;
		}
		/** Build canvas-card content from the manual editor result (keeps AI-authored controls). */
		function canvasCardFromEditor(prev, content) {
			const preserved = [];
			for (const block of effectiveTaskBlocks(prev)) {
				if (block.kind === "text" || block.kind === "button" || block.kind === "embed" || block.kind === "image") continue;
				preserved.push(block);
			}
			const blocks = taskEditorBlocks(content);
			const images = effectiveTaskBlocks(prev).filter((block) => block.kind === "image");
			return { ...prev, title: content.title, blocks: [...images, ...blocks, ...preserved], updatedAt: Date.now(), rev: canvasClientId + ":" + Date.now().toString(36) };
		}
		/** Share string: relay + canvas id + optional token + display name. */
		function encodeCanvasShare(info) {
			const payload = { r: info.relay, c: info.canvasId, n: info.name, t: info.token ?? "" };
			const json = JSON.stringify(payload);
			const base64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, "utf8").toString("base64");
			return CANVAS_SHARE_PREFIX + base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
		}
		function decodeCanvasShare(text) {
			if (typeof text !== "string") return null;
			const trimmed = text.trim();
			if (!trimmed.startsWith(CANVAS_SHARE_PREFIX)) return null;
			const base64 = trimmed.slice(CANVAS_SHARE_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/");
			let json = "";
			try {
				json = typeof atob === "function" ? decodeURIComponent(escape(atob(base64))) : Buffer.from(base64, "base64").toString("utf8");
			} catch {
				return null;
			}
			let parsed = null;
			try { parsed = JSON.parse(json); } catch { return null; }
			if (parsed === null || typeof parsed !== "object") return null;
			if (typeof parsed.r !== "string" || typeof parsed.c !== "string") return null;
			return {
				relay: parsed.r.trim().slice(0, 300),
				canvasId: parsed.c.trim().slice(0, 64),
				name: typeof parsed.n === "string" ? parsed.n.trim().slice(0, 40) : "共享画布",
				token: typeof parsed.t === "string" ? parsed.t.slice(0, 200) : ""
			};
		}
		/** Per-browser client identity used for rev tie-breaks and presence. */
		const canvasClientId = "c" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
		/** Downscale a dropped image to a bounded data URL (canvas cards are synced as JSON). */
		function canvasImageDataUrl(file, onDone) {
			if (typeof document === "undefined" || typeof FileReader === "undefined") { onDone(null); return; }
			const reader = new FileReader();
			reader.onerror = () => onDone(null);
			reader.onload = () => {
				const source = typeof reader.result === "string" ? reader.result : "";
				if (source.length === 0) { onDone(null); return; }
				const image = new Image();
				image.onerror = () => onDone(source.length <= CANVAS_SYNC_LIMIT ? source : null);
				image.onload = () => {
					try {
						const maxSide = 1600;
						const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
						const width = Math.max(1, Math.round(image.width * scale));
						const height = Math.max(1, Math.round(image.height * scale));
						const canvas = document.createElement("canvas");
						canvas.width = width;
						canvas.height = height;
						const context = canvas.getContext("2d");
						if (context === null) { onDone(source); return; }
						context.drawImage(image, 0, 0, width, height);
						const encoded = canvas.toDataURL("image/jpeg", 0.85);
						onDone(encoded.length < source.length ? encoded : source);
					} catch {
						onDone(source);
					}
				};
				image.src = source;
			};
			reader.readAsDataURL(file);
		}
		/** Tiny WebSocket sync client: room join, snapshot merge, op broadcast, presence, reconnect. */
		function createCanvasSyncClient() {
			const client = {
				socket: null,
				status: "offline",
				peers: [],
				relay: "",
				canvasId: null,
				token: "",
				queue: [],
				retry: 0,
				timer: null,
				pending: new Set(),
				listeners: new Set(),
				onMessage: null
			};
			const setStatus = (status, detail) => {
				client.status = status;
				client.detail = detail ?? null;
				for (const listener of [...client.listeners]) {
					try { listener(client); } catch { /* a listener must never break sync */ }
				}
				notifyCanvas();
			};
			client.subscribe = (listener) => {
				client.listeners.add(listener);
				return () => { client.listeners.delete(listener); };
			};
			client.connect = (relay, canvasId, token, nickname) => {
				client.close();
				if (typeof WebSocket === "undefined" || typeof relay !== "string" || relay.length === 0) {
					setStatus("offline", "未配置中继地址");
					return;
				}
				client.relay = relay;
				client.canvasId = canvasId;
				client.token = token ?? "";
				let url = relay;
				try {
					const parsed = new URL(relay, typeof location !== "undefined" ? location.href : void 0);
					parsed.searchParams.set("canvas", canvasId);
					if (client.token.length > 0) parsed.searchParams.set("token", client.token);
					url = parsed.toString();
				} catch {
					setStatus("offline", "中继地址无效");
					return;
				}
				setStatus("connecting", null);
				let socket = null;
				try {
					socket = new WebSocket(url);
				} catch {
					setStatus("offline", "无法建立连接");
					return;
				}
				client.socket = socket;
				socket.onopen = () => {
					client.retry = 0;
					setStatus("online", null);
					client.send({
						type: "hello",
						clientId: canvasClientId,
						name: typeof nickname === "string" && nickname.length > 0 ? nickname : "匿名"
					});
					const canvas = activeCanvas();
					if (canvas !== null && canvas.id === canvasId) {
						client.sendOp({ kind: "canvas.snapshot", canvas });
					}
					for (const op of client.queue.splice(0, client.queue.length)) client.send({ type: "op", op });
				};
				socket.onmessage = (event) => {
					let message = null;
					try { message = JSON.parse(typeof event.data === "string" ? event.data : ""); } catch { return; }
					if (message === null || typeof message !== "object") return;
					if (message.type === "snapshot" && message.canvas !== void 0) {
						const merged = mergeCanvasState(canvasSnapshot(), { canvases: { [message.canvas.id]: message.canvas } });
						if (merged.activeId === null) merged.activeId = message.canvas.id;
						publishCanvasState(merged, true);
					} else if (message.type === "op" && message.op !== void 0) {
						applyCanvasRemoteOp(message.op);
					} else if (message.type === "peers" && Array.isArray(message.peers)) {
						client.peers = message.peers;
						for (const listener of [...client.listeners]) {
							try { listener(client); } catch { /* ignore */ }
						}
						notifyCanvas();
					}
				};
				socket.onerror = () => setStatus("offline", "连接出错");
				socket.onclose = () => {
					if (client.socket !== socket) return;
					client.socket = null;
					setStatus("offline", "已断开");
					if (client.canvasId !== null) {
						client.retry += 1;
						const delay = Math.min(15000, 800 * Math.pow(1.6, Math.min(6, client.retry)));
						client.timer = setTimeout(() => {
							client.timer = null;
							if (client.canvasId !== null) client.connect(client.relay, client.canvasId, client.token, canvasSnapshot().nickname);
						}, delay);
					}
				};
			};
			client.send = (message) => {
				const socket = client.socket;
				if (socket === null || socket.readyState !== 1) return false;
				try {
					socket.send(JSON.stringify(message));
					return true;
				} catch {
					return false;
				}
			};
			/** Queue or send one op (ops larger than the relay limit stay local). */
			client.sendOp = (op) => {
				let encoded = "";
				try { encoded = JSON.stringify(op); } catch { return; }
				if (encoded.length > CANVAS_SYNC_LIMIT) { setStatus(client.status, "内容超出同步上限，仅保存在本机"); return; }
				if (!client.send({ type: "op", op })) {
					if (client.queue.length < 200) client.queue.push(op);
				}
			};
			client.close = () => {
				if (client.timer !== null) { clearTimeout(client.timer); client.timer = null; }
				client.canvasId = null;
				const socket = client.socket;
				client.socket = null;
				if (socket !== null) {
					try { socket.close(); } catch { /* already closed */ }
				}
			};
			client.disconnect = () => {
				client.close();
				setStatus("offline", null);
			};
			return client;
		}
		const canvasSync = createCanvasSyncClient();
		/** Apply one remote op into the local canvas store. */
		function applyCanvasRemoteOp(op) {
			if (op === null || typeof op !== "object" || typeof op.kind !== "string") return;
			const state = canvasSnapshot();
			if (op.kind === "canvas.snapshot" && op.canvas !== void 0) {
				const canvas = sanitizeCanvas(op.canvas);
				if (canvas === null) return;
				const merged = mergeCanvasState(state, { canvases: { [canvas.id]: canvas } });
				if (state.activeId === null) merged.activeId = canvas.id;
				publishCanvasState(merged, true);
				return;
			}
			if (op.kind === "card.upsert" && typeof op.canvasId === "string" && op.card !== void 0) {
				const canvas = state.canvases[op.canvasId];
				const card = sanitizeCanvasCard(op.card, op.card !== null && typeof op.card === "object" ? op.card.id : void 0);
				if (canvas === void 0 || card === null) return;
				const mine = canvas.cards[card.id];
				if (mine !== void 0 && mergeCanvasCard(mine, card) === mine) return;
				const next = { ...state, canvases: { ...state.canvases, [canvas.id]: { ...canvas, cards: { ...canvas.cards, [card.id]: card }, updatedAt: Date.now() } } };
				publishCanvasState(next, true);
				return;
			}
			if (op.kind === "card.delete" && typeof op.canvasId === "string" && typeof op.cardId === "string") {
				const canvas = state.canvases[op.canvasId];
				if (canvas === void 0 || canvas.cards[op.cardId] === void 0) return;
				const cards = { ...canvas.cards };
				delete cards[op.cardId];
				publishCanvasState({ ...state, canvases: { ...state.canvases, [canvas.id]: { ...canvas, cards, updatedAt: Date.now() } } }, true);
				return;
			}
			if (op.kind === "canvas.rename" && typeof op.canvasId === "string" && typeof op.name === "string") {
				const canvas = state.canvases[op.canvasId];
				if (canvas === void 0) return;
				publishCanvasState({ ...state, canvases: { ...state.canvases, [canvas.id]: { ...canvas, name: op.name.slice(0, 40), updatedAt: Date.now() } } }, true);
			}
		}
		/** Local mutations (persist + notify + broadcast). */
		function canvasCreate(name) {
			const state = canvasSnapshot();
			const canvas = { id: nextCanvasId(), name: typeof name === "string" && name.trim().length > 0 ? name.trim().slice(0, 40) : "新画布", cards: {}, updatedAt: Date.now() };
			const next = { ...state, canvases: { ...state.canvases, [canvas.id]: canvas }, activeId: canvas.id, views: { ...state.views, [canvas.id]: { x: 40, y: 40, k: 1 } } };
			publishCanvasState(next, false);
			canvasSync.sendOp({ kind: "canvas.snapshot", canvas });
			return canvas;
		}
		function canvasSetActive(id) {
			const state = canvasSnapshot();
			if (state.canvases[id] === void 0) return;
			publishCanvasState({ ...state, activeId: id }, true);
		}
		function canvasRename(id, name) {
			const state = canvasSnapshot();
			const canvas = state.canvases[id];
			if (canvas === void 0) return;
			const clean = typeof name === "string" && name.trim().length > 0 ? name.trim().slice(0, 40) : canvas.name;
			publishCanvasState({ ...state, canvases: { ...state.canvases, [id]: { ...canvas, name: clean, updatedAt: Date.now() } } }, false);
			canvasSync.sendOp({ kind: "canvas.rename", canvasId: id, name: clean });
		}
		function canvasDelete(id) {
			const state = canvasSnapshot();
			if (state.canvases[id] === void 0) return;
			const canvases = { ...state.canvases };
			delete canvases[id];
			const views = { ...state.views };
			delete views[id];
			const ids = Object.keys(canvases);
			publishCanvasState({ ...state, canvases, views, activeId: state.activeId === id ? (ids[0] ?? null) : state.activeId }, false);
		}
		/** Ensure a canvas exists, then insert a published copy of a board card into it. */
		function canvasPublishCard(source, canvasId) {
			let state = canvasSnapshot();
			let targetId = typeof canvasId === "string" && state.canvases[canvasId] !== void 0 ? canvasId : state.activeId;
			let created = false;
			if (targetId === null || state.canvases[targetId] === void 0) {
				const canvas = canvasCreate("分享画布");
				state = canvasSnapshot();
				targetId = canvas.id;
				created = true;
			}
			const canvas = state.canvases[targetId];
			const view = state.views[targetId] ?? { x: 40, y: 40, k: 1 };
			const offset = Object.keys(canvas.cards).length;
			const card = canvasCopyCard(source, -view.x / view.k + 60 + (offset % 4) * 40, -view.y / view.k + 60 + Math.floor(offset / 4) * 40);
			const next = {
				...state,
				// Publishing into an explicitly named canvas (a card instance) must not
				// steal the "active canvas" seat from the main canvas view.
				activeId: created ? targetId : state.activeId,
				canvases: { ...state.canvases, [targetId]: { ...canvas, cards: { ...canvas.cards, [card.id]: card }, updatedAt: Date.now() } }
			};
			publishCanvasState(next, false);
			canvasSync.sendOp({ kind: "card.upsert", canvasId: targetId, card });
			return { canvasId: targetId, cardId: card.id };
		}
		/** Canvas id bound to one board card ("instance" canvas created by maximizing the card). */
		function canvasInstanceId(cardId) {
			const safe = String(cardId ?? "").replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 48);
			return CANVAS_INSTANCE_PREFIX + safe;
		}
		/** True for the per-card instance canvases (hidden from the normal canvas switcher). */
		function isCanvasInstance(canvasId) {
			return typeof canvasId === "string" && canvasId.startsWith(CANVAS_INSTANCE_PREFIX);
		}
		/** Bound canvas item: it maps one control (by `bid`) of one board card. */
		function canvasCardBinding(card) {
			if (card === null || typeof card !== "object") return null;
			const from = card.from;
			if (from === null || typeof from !== "object") return null;
			if (typeof from.card !== "string" || typeof from.bid !== "string") return null;
			return { card: from.card, bid: from.bid };
		}
		/** Rough height of one control, used only to lay out an explosion sensibly. */
		function estimateTaskBlockHeight(block) {
			if (block === null || typeof block !== "object") return 110;
			if (block.kind === "embed") return clampTaskEmbedHeight(block.height) + 90;
			if (block.kind === "image") return 240;
			if (block.kind === "code") return 210;
			if (block.kind === "table") return 110 + Math.min(Array.isArray(block.rows) ? block.rows.length : 0, 12) * 26;
			if (block.kind === "checklist") return 70 + Math.min(Array.isArray(block.items) ? block.items.length : 0, 12) * 26;
			if (block.kind === "bars") return 80 + Math.min(Array.isArray(block.items) ? block.items.length : 0, 12) * 24;
			if (block.kind === "trend") return 180;
			if (block.kind === "stats" || block.kind === "chips" || block.kind === "links") return 130;
			if (block.kind === "heading" || block.kind === "note" || block.kind === "button") return 92;
			if (block.kind === "text") return 60 + Math.ceil(Math.min((block.text ?? "").length, 400) / 46) * 19;
			return 120;
		}
		/**
		 * Unroll one board card's controls into individual canvas items — the card's own
		 * canvas holds its controls, each draggable and editable, while the board card stays
		 * a compact thumbnail of them (its block order follows the canvas arrangement).
		 */
		function canvasExplodeBlocks(canvasId, cardId, blocks, style, startY) {
			const state = canvasSnapshot();
			const canvas = state.canvases[canvasId];
			if (canvas === void 0 || !Array.isArray(blocks) || blocks.length === 0) return 0;
			const cards = { ...canvas.cards };
			// Two columns, each item under the previous one, so the unrolled controls read
			// like the card laid out on the plane (the user rearranges from there).
			const baseY = typeof startY === "number" && Number.isFinite(startY) ? Math.round(startY) : 40;
			const columnY = [baseY, baseY];
			const columnX = [60, 60 + TASK_CANVAS_COLUMN + 28];
			let created = 0;
			for (let index = 0; index < blocks.length; index++) {
				const column = columnY[0] <= columnY[1] ? 0 : 1;
				const block = blocks[index];
				const item = {
					id: nextCanvasCardId(),
					title: taskBlockLabel(block),
					x: columnX[column],
					y: columnY[column],
					createdAt: Date.now(),
					updatedAt: Date.now(),
					blocks: [block],
					from: { card: cardId, bid: block.bid },
					w: block.kind === "embed" ? TASK_CANVAS_EMBED_W : TASK_CANVAS_COLUMN
				};
				if (index === 0 && baseY <= 40 && style !== void 0 && typeof style.icon === "string" && style.icon.length > 0) item.style = { icon: style.icon };
				columnY[column] += estimateTaskBlockHeight(block) + 24;
				const clean = sanitizeCanvasCard(item, item.id);
				if (clean === null) continue;
				cards[clean.id] = clean;
				created += 1;
			}
			if (created === 0) return 0;
			publishCanvasState({ ...state, canvases: { ...state.canvases, [canvasId]: { ...canvas, cards, updatedAt: Date.now() } } }, false);
			for (const item of Object.values(cards)) {
				if (canvas.cards[item.id] === void 0) canvasSync.sendOp({ kind: "card.upsert", canvasId, card: item });
			}
			return created;
		}
		/**
		 * Keep one card's instance canvas in step with the card itself — the canvas holds the
		 * card's controls, so after a conversation refactor (or an edit anywhere else) the
		 * plane must show exactly them: controls that disappeared lose their item, surviving
		 * items keep their place but take the control's current content and label, and newly
		 * added controls get a fresh item under the existing ones.
		 */
		function canvasSyncInstanceWithCard(canvasId, cardId) {
			const state = canvasSnapshot();
			const canvas = state.canvases[canvasId];
			const empty = { removed: 0, refreshed: 0, created: 0 };
			if (canvas === void 0) return empty;
			const stamped = stampTaskCardBlocks(cardId);
			if (stamped === null) return empty;
			const byBid = new Map();
			for (const block of stamped.blocks) if (typeof block.bid === "string") byBid.set(block.bid, block);
			const cards = { ...canvas.cards };
			const removed = [];
			const refreshedCards = [];
			const seen = new Set();
			let lowest = 40;
			for (const [id, item] of Object.entries(canvas.cards)) {
				const binding = canvasCardBinding(item);
				if (binding === null || binding.card !== cardId) continue;
				const block = byBid.get(binding.bid);
				if (block === undefined) {
					delete cards[id];
					removed.push(id);
					continue;
				}
				seen.add(binding.bid);
				lowest = Math.max(lowest, item.y);
				const label = taskBlockLabel(block);
				if (JSON.stringify([item.blocks, item.title]) !== JSON.stringify([[block], label])) {
					const next = { ...item, blocks: [block], title: label, updatedAt: Date.now() };
					cards[id] = next;
					refreshedCards.push(next);
				}
			}
			const added = stamped.blocks.filter((block) => typeof block.bid === "string" && !seen.has(block.bid));
			if (removed.length > 0 || refreshedCards.length > 0) {
				publishCanvasState({ ...state, canvases: { ...state.canvases, [canvasId]: { ...canvas, cards, updatedAt: Date.now() } } }, false);
				for (const id of removed) canvasSync.sendOp({ kind: "card.delete", canvasId, cardId: id });
				for (const item of refreshedCards) canvasSync.sendOp({ kind: "card.upsert", canvasId, card: item });
			}
			const created = added.length > 0 ? canvasExplodeBlocks(canvasId, cardId, added, stamped.card.style, lowest + 24) : 0;
			return { removed: removed.length, refreshed: refreshedCards.length, created };
		}
		/** Reconcile the instance canvas of one card, when it has one. */
		function syncTaskCardInstance(cardId) {
			const canvasId = canvasInstanceId(cardId);
			if (canvasSnapshot().canvases[canvasId] === void 0) return { removed: 0, refreshed: 0, created: 0 };
			return canvasSyncInstanceWithCard(canvasId, cardId);
		}
		/** Board card's blocks carrying stable ids (stamped in place, so a canvas item can bind). */
		function stampTaskCardBlocks(cardId, fallbackCard) {
			ensureTaskCardsLoaded();
			const stored = taskCardsStore.cards[cardId];
			const card = stored !== void 0 && isUserTaskCard(stored) ? stored : (fallbackCard ?? null);
			if (card === null || !isUserTaskCard(card)) return null;
			const blocks = effectiveTaskBlocks(card);
			let changed = false;
			const stamped = blocks.map((block) => {
				if (typeof block.bid === "string" && block.bid.length > 0) return block;
				changed = true;
				return { ...block, bid: nextTaskBlockId() };
			});
			if (!changed || stored === void 0) return { card, blocks: stamped };
			const cards = { ...taskCardsStore.cards, [cardId]: { ...card, blocks: stamped, updatedAt: Date.now() } };
			publishTaskCards(cards, taskCardsStore.order);
			return { card: cards[cardId], blocks: stamped };
		}
		/** Update one control of a board card in place (content written back from its canvas item). */
		function canvasWriteBackBlock(cardId, bid, blocks) {
			ensureTaskCardsLoaded();
			const card = taskCardsStore.cards[cardId];
			if (card === void 0 || !isUserTaskCard(card)) return false;
			const current = effectiveTaskBlocks(card);
			const index = current.findIndex((block) => block.bid === bid);
			if (index === -1) return false;
			const next = [...current.slice(0, index), ...blocks.map((block) => (block.bid === bid ? block : { ...block, bid })), ...current.slice(index + 1)];
			const sanitized = sanitizeTaskBlocks(next);
			if (JSON.stringify(sanitized) === JSON.stringify(sanitizeTaskBlocks(current))) return false;
			const cards = { ...taskCardsStore.cards, [cardId]: { ...card, blocks: sanitized, updatedAt: Date.now() } };
			publishTaskCards(cards, taskCardsStore.order);
			return true;
		}
		/**
		 * Re-order a board card's controls to match how their canvas items are arranged,
		 * so the card on the board is a true thumbnail of what is on the plane.
		 */
		function canvasSyncBlockOrder(canvasId, cardId) {
			const canvas = canvasSnapshot().canvases[canvasId];
			if (canvas === void 0) return false;
			ensureTaskCardsLoaded();
			const card = taskCardsStore.cards[cardId];
			if (card === void 0 || !isUserTaskCard(card)) return false;
			const items = Object.values(canvas.cards).filter((item) => {
				const binding = canvasCardBinding(item);
				return binding !== null && binding.card === cardId;
			});
			if (items.length < 2) return false;
			const current = effectiveTaskBlocks(card);
			const byBid = new Map();
			for (const block of current) if (typeof block.bid === "string") byBid.set(block.bid, block);
			const sorted = [...items].sort((left, right) => (left.y - right.y) || (left.x - right.x));
			const ordered = [];
			for (const item of sorted) {
				const block = byBid.get(canvasCardBinding(item).bid);
				if (block !== void 0) ordered.push(block);
			}
			if (ordered.length !== current.filter((block) => typeof block.bid === "string").length) return false;
			const rest = current.filter((block) => typeof block.bid !== "string" || !ordered.includes(block));
			const next = [...ordered, ...rest];
			if (next.every((block, index) => block === current[index])) return false;
			const cards = { ...taskCardsStore.cards, [cardId]: { ...card, blocks: next, updatedAt: Date.now() } };
			publishTaskCards(cards, taskCardsStore.order);
			return true;
		}
		/** Drop the canvas items bound to one board card (used before re-exploding it). */
		function canvasUnbindCard(canvasId, cardId) {
			const state = canvasSnapshot();
			const canvas = state.canvases[canvasId];
			if (canvas === void 0) return 0;
			const cards = { ...canvas.cards };
			let removed = 0;
			for (const [id, item] of Object.entries(canvas.cards)) {
				const binding = canvasCardBinding(item);
				if (binding !== null && binding.card === cardId) {
					delete cards[id];
					removed += 1;
				}
			}
			if (removed === 0) return 0;
			publishCanvasState({ ...state, canvases: { ...state.canvases, [canvasId]: { ...canvas, cards, updatedAt: Date.now() } } }, false);
			return removed;
		}
		/**
		 * Mirror one bound canvas item back onto its board card: the item's content becomes
		 * that control (or removes it when emptied), and the card's control order follows the
		 * arrangement on the plane.
		 */
		function canvasPushBinding(canvasId, item) {
			const binding = canvasCardBinding(item);
			if (binding === null) return false;
			const wrote = canvasWriteBackBlock(binding.card, binding.bid, effectiveTaskBlocks(item));
			const reordered = canvasSyncBlockOrder(canvasId, binding.card);
			// Keep the item's label in step with the control it maps, then re-reconcile the
			// whole instance (a refactor may have turned one control into several).
			const block = effectiveTaskBlocks(item)[0];
			if (block !== void 0) {
				const label = taskBlockLabel(block);
				if (label !== item.title) canvasUpsertCard(canvasId, { ...item, title: label }, false);
			}
			canvasSyncInstanceWithCard(canvasId, binding.card);
			return wrote || reordered;
		}
		/** Remove one control from its board card (its canvas item was deleted). */
		function canvasRemoveBoundBlock(item) {
			const binding = canvasCardBinding(item);
			if (binding === null) return false;
			return canvasWriteBackBlock(binding.card, binding.bid, []);
		}
		/**
		 * Maximize one card into its own canvas — a private workspace whose items are the
		 * card's own controls (draggable and editable there), like entering an instance: the
		 * card on the board stays a thumbnail of them. Created on first use and reused
		 * afterwards, so the instance keeps its arrangement.
		 */
		function canvasOpenInstance(card) {
			if (card === null || typeof card !== "object") return null;
			const cardId = typeof card.id === "string" && card.id.length > 0 ? card.id : "";
			// Bound to a real card id: two cards must never share one instance canvas.
			if (cardId.length === 0) return null;
			const state = canvasSnapshot();
			const id = canvasInstanceId(cardId);
			if (state.canvases[id] !== void 0) return id;
			const title = typeof card.title === "string" && card.title.trim().length > 0 ? card.title.trim() : "卡片";
			const canvas = { id, name: ("副本 · " + title).slice(0, 40), cards: {}, updatedAt: Date.now() };
			publishCanvasState({
				...state,
				canvases: { ...state.canvases, [id]: canvas },
				views: { ...state.views, [id]: { x: 60, y: 40, k: 1 } }
			}, false);
			canvasSync.sendOp({ kind: "canvas.snapshot", canvas });
			const stamped = stampTaskCardBlocks(cardId, card);
			if (stamped !== null && stamped.blocks.length > 0) canvasExplodeBlocks(id, cardId, stamped.blocks, stamped.card.style);
			return id;
		}
		/** Re-unroll a card's current controls into its instance (drops the old items first). */
		function canvasRebuildInstance(canvasId, cardId) {
			const stamped = stampTaskCardBlocks(cardId);
			if (stamped === null) return 0;
			canvasUnbindCard(canvasId, cardId);
			if (stamped.blocks.length === 0) return 0;
			return canvasExplodeBlocks(canvasId, cardId, stamped.blocks, stamped.card.style);
		}
		/** Duplicate one canvas card in place (deriving variants inside an instance). */
		function canvasDuplicateCard(canvasId, card) {
			if (card === null || typeof card !== "object") return null;
			const clone = canvasCopyCard(card, (typeof card.x === "number" ? card.x : 0) + 44, (typeof card.y === "number" ? card.y : 0) + 44);
			if (card.bare === true) clone.bare = true;
			canvasUpsertCard(canvasId, clone, true);
			return clone.id;
		}
		/**
		 * Add any control straight onto a canvas — no card around it. The item is a bare
		 * control (draggable, resizable, editable) exactly like the ones a card unrolls into.
		 */
		function canvasAddControl(canvasId, kind, x, y) {
			const state = canvasSnapshot();
			const canvas = state.canvases[canvasId];
			if (canvas === void 0) return null;
			const block = sanitizeTaskBlock({ ...taskBlockDefault(kind), bid: nextTaskBlockId() }, 0);
			if (block === null) return null;
			const stack = Object.keys(canvas.cards).length % 6;
			const item = {
				id: nextCanvasCardId(),
				title: taskBlockLabel(block),
				bare: true,
				x: Math.round((typeof x === "number" ? x : 60) + stack * 26),
				y: Math.round((typeof y === "number" ? y : 60) + stack * 26),
				createdAt: Date.now(),
				updatedAt: Date.now(),
				blocks: [block],
				w: block.kind === "embed" ? TASK_CANVAS_EMBED_W : TASK_CANVAS_COLUMN
			};
			const clean = sanitizeCanvasCard(item, item.id);
			if (clean === null) return null;
			canvasUpsertCard(canvasId, clean, true);
			return clean.id;
		}
		/** Switch a single-control canvas item between the card look and the bare control look. */
		function canvasSetBare(canvasId, card, bare) {
			if (card === null || typeof card !== "object" || !isBareCandidate(card)) return false;
			const next = { ...card };
			if (bare === true) next.bare = true;
			else delete next.bare;
			canvasUpsertCard(canvasId, next, true);
			return true;
		}
		/** True for items that may be shown as a bare control (exactly one control inside). */
		function isBareCandidate(card) {
			const blocks = effectiveTaskBlocks(card);
			return blocks.length === 1 && blocks[0].kind !== "unknown";
		}
		/** Replace the single control of a canvas item (quick editor / JSON editor). */
		function canvasUpdateControl(canvasId, card, block) {
			if (card === null || typeof card !== "object") return { ok: false, reason: "invalid" };
			const clean = sanitizeTaskBlock(block, 0);
			if (clean === null) return { ok: false, reason: "invalid-block" };
			const next = { ...card, blocks: [clean], title: taskBlockLabel(clean), updatedAt: Date.now() };
			canvasUpsertCard(canvasId, next, true);
			canvasPushBinding(canvasId, next);
			return { ok: true, id: card.id };
		}
		/** Send one canvas card back to the task board (creates it, or updates the same title). */
		function canvasSendToBoard(card) {
			if (card === null || typeof card !== "object") return { ok: false, reason: "invalid" };
			return applyTaskCardSpec({
				op: "upsert",
				title: typeof card.title === "string" && card.title.trim().length > 0 ? card.title.trim() : "画布卡片",
				blocks: Array.isArray(card.blocks) ? card.blocks : [],
				style: card.style
			});
		}
		function canvasUpsertCard(canvasId, card, broadcast) {
			const state = canvasSnapshot();
			const canvas = state.canvases[canvasId];
			if (canvas === void 0) return;
			const clean = sanitizeCanvasCard(card, card !== null && typeof card !== "object" ? void 0 : card.id);
			if (clean === null) return;
			clean.updatedAt = Date.now();
			clean.rev = canvasClientId + ":" + clean.updatedAt.toString(36);
			publishCanvasState({ ...state, canvases: { ...state.canvases, [canvasId]: { ...canvas, cards: { ...canvas.cards, [clean.id]: clean }, updatedAt: clean.updatedAt } } }, broadcast === false);
			if (broadcast !== false) canvasSync.sendOp({ kind: "card.upsert", canvasId, card: clean });
		}
		function canvasDeleteCard(canvasId, cardId) {
			const state = canvasSnapshot();
			const canvas = state.canvases[canvasId];
			if (canvas === void 0 || canvas.cards[cardId] === void 0) return;
			const cards = { ...canvas.cards };
			delete cards[cardId];
			publishCanvasState({ ...state, canvases: { ...state.canvases, [canvasId]: { ...canvas, cards, updatedAt: Date.now() } } }, false);
			canvasSync.sendOp({ kind: "card.delete", canvasId, cardId });
		}
		function canvasSetView(canvasId, view) {
			const state = canvasSnapshot();
			publishCanvasState({
				...state,
				views: { ...state.views, [canvasId]: { x: view.x, y: view.y, k: clampCanvasNumber(view.k, 1, CANVAS_VIEW_MIN, CANVAS_VIEW_MAX) } }
			}, true);
		}
		/** Adopt a share string: create/locate the canvas locally and connect. */
		function canvasJoinShare(share) {
			const info = decodeCanvasShare(share);
			if (info === null) return { ok: false, message: "分享串无法识别" };
			const state = canvasSnapshot();
			const existing = state.canvases[info.canvasId];
			const canvas = existing ?? { id: info.canvasId, name: info.name, cards: {}, updatedAt: Date.now() };
			const next = {
				...state,
				canvases: { ...state.canvases, [canvas.id]: canvas },
				activeId: canvas.id,
				views: { ...state.views, [canvas.id]: state.views[canvas.id] ?? { x: 40, y: 40, k: 1 } },
				relay: info.relay,
				token: info.token
			};
			publishCanvasState(next, true);
			canvasSync.connect(info.relay, canvas.id, info.token, next.nickname);
			return { ok: true, canvasId: canvas.id };
		}
		function canvasShareString() {
			const state = canvasSnapshot();
			const canvas = activeCanvas(state);
			if (canvas === null) return null;
			return encodeCanvasShare({ relay: state.relay, canvasId: canvas.id, name: canvas.name, token: state.token });
		}
		//#endregion
		//#region canvas view
		/** Apply an agent/editor spec to one canvas card. */
		function canvasApplySpec(canvasId, card, spec) {
			if (spec === null || typeof spec !== "object") return { ok: false, reason: "invalid" };
			if (spec.op === "delete") {
				canvasDeleteCard(canvasId, card.id);
				return { ok: true, op: "delete", id: card.id };
			}
			const next = { ...card };
			if (typeof spec.title === "string" && spec.title.trim().length > 0) next.title = spec.title.trim().slice(0, TASK_TITLE_LIMIT);
			if (Array.isArray(spec.blocks)) {
				const blocks = sanitizeTaskBlocks(spec.blocks);
				if (blocks.length > 0) next.blocks = blocks;
			}
			if (spec.style !== void 0) {
				const style = sanitizeTaskStyle(spec.style);
				if (style !== void 0) next.style = style;
				else delete next.style;
			}
			canvasUpsertCard(canvasId, next, true);
			return { ok: true, op: "upsert", id: card.id };
		}
		/** Cross-tab: another window of the same browser changed the canvas store. */
		function startCanvasCrossTab() {
			if (typeof window === "undefined" || typeof window.addEventListener !== "function") return () => {};
			const onStorage = (event) => {
				if (event.key !== CANVAS_STORAGE_KEY || event.newValue === null) return;
				let parsed = null;
				try { parsed = sanitizeCanvasState(JSON.parse(event.newValue)); } catch { return; }
				publishCanvasState(mergeCanvasState(canvasSnapshot(), parsed), true);
			};
			window.addEventListener("storage", onStorage);
			return () => window.removeEventListener("storage", onStorage);
		}
		/**
		 * One control living on a canvas without a card around it: the block itself is the item,
		 * a hover toolbar carries its grip / actions, and dragging or resizing works exactly
		 * like a card (the toolbar and the item's padding are the drag surface).
		 */
		function CanvasControlView(props) {
			const { card, onMove, onResize, onEdit, onChat, onDelete, onWidgetState, onBlockResize, onDuplicate, onBoard, onToggleBare, canvasId } = props;
			const ref = (0, react.useRef)(null);
			const gesture = (0, react.useRef)(null);
			const frame = (0, react.useRef)(0);
			const begin = (mode, event) => {
				const node = ref.current;
				if (node === null) return;
				event.preventDefault();
				event.stopPropagation();
				gesture.current = { mode, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: card.x, y: card.y, w: node.offsetWidth, h: node.offsetHeight };
				node.classList.add("dsh-tc-cardBusy");
				try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already released */ }
			};
			/**
			 * Pointer moves update the gesture state synchronously and only *paint* inside
			 * requestAnimationFrame: a throttled or skipped frame (background tab, reduced
			 * motion) must never lose the drag — the commit reads the latest values.
			 */
			const paint = () => {
				frame.current = 0;
				const state = gesture.current;
				const node = ref.current;
				if (state === null || node === null) return;
				if (state.mode === "move") {
					node.style.transform = "translate3d(" + (state.nextX - state.x) + "px," + (state.nextY - state.y) + "px,0)";
					return;
				}
				node.style.width = state.nextW + "px";
				node.style.height = state.nextH + "px";
			};
			const move = (event) => {
				const state = gesture.current;
				const node = ref.current;
				if (state === null || node === null) return;
				const dx = event.clientX - state.startX;
				const dy = event.clientY - state.startY;
				if (state.mode === "move") {
					state.nextX = Math.round(state.x + dx);
					state.nextY = Math.round(state.y + dy);
				} else {
					state.nextW = Math.max(TASK_CARD_MIN_W, Math.round(state.w + dx));
					state.nextH = Math.max(48, Math.round(state.h + dy));
				}
				if (frame.current !== 0) return;
				if (typeof requestAnimationFrame === "function") frame.current = requestAnimationFrame(paint);
				else paint();
			};
			const end = (event) => {
				const state = gesture.current;
				const node = ref.current;
				gesture.current = null;
				if (frame.current !== 0) {
					cancelAnimationFrame(frame.current);
					frame.current = 0;
				}
				if (node !== null) {
					node.classList.remove("dsh-tc-cardBusy");
					node.style.transform = "";
					if (state !== null && state.mode === "resize") {
						node.style.removeProperty("width");
						node.style.removeProperty("height");
					}
				}
				try {
					if (typeof event.currentTarget.releasePointerCapture === "function") event.currentTarget.releasePointerCapture(event.pointerId);
				} catch { /* already released */ }
				if (state === null) return;
				if (state.mode === "move" && typeof state.nextX === "number") onMove(card.id, state.nextX, state.nextY);
				if (state.mode === "resize" && typeof state.nextW === "number") onResize(card.id, state.nextW, state.nextH);
			};
			const style = { left: card.x, top: card.y };
			if (typeof card.w === "number") style.width = card.w;
			if (typeof card.h === "number") style.height = card.h;
			const label = taskBlockLabel(effectiveTaskBlocks(card)[0] ?? {});
			return (0, react_jsx_runtime.jsxs)("div", {
				ref,
				className: "dsh-tc-bare",
				"data-kind": effectiveTaskBlocks(card)[0]?.kind ?? "unknown",
				style,
				onPointerDown: (event) => event.stopPropagation(),
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-bareTools",
						onPointerDown: (event) => begin("move", event),
						onPointerMove: move,
						onPointerUp: end,
						onPointerCancel: end,
						title: "按住拖动这个控件",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-bareGrip", children: "⠿" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-bareLabel", children: label }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-bareSpacer" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-bareBtn", title: "编辑这个控件", onPointerDown: (event) => event.stopPropagation(), onClick: () => onEdit(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "✎" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-bareBtn", title: "对话重构这个控件", onPointerDown: (event) => event.stopPropagation(), onClick: () => onChat(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "💬" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-bareBtn", title: "复制这个控件", onPointerDown: (event) => event.stopPropagation(), onClick: () => onDuplicate(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "⧉" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-bareBtn", title: "发回任务台（作为一张卡片）", onPointerDown: (event) => event.stopPropagation(), onClick: () => onBoard(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "📥" }) }),
							onToggleBare !== void 0 && (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-bareBtn", title: "套上卡片外观", onPointerDown: (event) => event.stopPropagation(), onClick: () => onToggleBare(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "▣" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-bareBtn dsh-tc-iconDanger", title: "从画布删除这个控件", onPointerDown: (event) => event.stopPropagation(), onClick: () => onDelete(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "🗑" }) })
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: "dsh-tc-bareBody",
						onPointerDown: (event) => {
							// Dragging anywhere that is not an interactive control moves the item.
							const target = event.target;
							if (target !== event.currentTarget && typeof target.closest === "function" && target.closest("input,button,a,select,textarea,.dsh-tc-app") !== null) return;
							begin("move", event);
						},
						onPointerMove: move,
						onPointerUp: end,
						onPointerCancel: end,
						children: (0, react_jsx_runtime.jsx)(TaskUserBodyView, {
							card,
							cardId: card.id,
							onWidgetState,
							onBlockResize: onBlockResize !== void 0 ? (id, index, height) => onBlockResize(id, index, height) : void 0
						})
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: "dsh-tc-bareResize",
						title: "拖动调整控件大小",
						onPointerDown: (event) => begin("resize", event),
						onPointerMove: move,
						onPointerUp: end,
						onPointerCancel: end
					})
				]
			});
		}
		/**
		 * One canvas card: drag/resize in world coordinates, edit or refactor through the existing pipelines.
		 */
		function CanvasCardView(props) {
			const { card, scale, onMove, onResize, onEdit, onChat, onDelete, onWidgetState, onBlockResize, onFull, onDuplicate, onBoard, onToggleBare } = props;
			const ref = (0, react.useRef)(null);
			const gesture = (0, react.useRef)(null);
			const frame = (0, react.useRef)(0);
			const begin = (mode, event) => {
				const node = ref.current;
				if (node === null) return;
				event.preventDefault();
				event.stopPropagation();
				gesture.current = {
					mode,
					pointerId: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					x: card.x,
					y: card.y,
					w: node.offsetWidth,
					h: node.offsetHeight
				};
				node.classList.add("dsh-tc-cardBusy");
				if (typeof document !== "undefined" && document.body !== void 0) document.body.classList.add("dsh-tc-interacting");
				try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already released */ }
			};
			const apply = () => {
				frame.current = 0;
				const state = gesture.current;
				const node = ref.current;
				if (state === null || node === null) return;
				const dx = (state.pendingX - state.startX) / (scale > 0 ? scale : 1);
				const dy = (state.pendingY - state.startY) / (scale > 0 ? scale : 1);
				if (state.mode === "move") {
					state.nextX = Math.round(state.x + dx);
					state.nextY = Math.round(state.y + dy);
					node.style.transform = "translate3d(" + Math.round(state.nextX - state.x) + "px," + Math.round(state.nextY - state.y) + "px,0)";
					return;
				}
				state.nextW = Math.round(Math.min(Math.max(TASK_CARD_MIN_W, state.w + dx), TASK_CARD_MAX_W));
				state.nextH = Math.round(Math.min(Math.max(TASK_CARD_MIN_H, state.h + dy), TASK_CARD_MAX_H));
				node.style.width = state.nextW + "px";
				node.style.height = state.nextH + "px";
			};
			const move = (event) => {
				const state = gesture.current;
				if (state === null) return;
				state.pendingX = event.clientX;
				state.pendingY = event.clientY;
				if (frame.current !== 0) return;
				if (typeof requestAnimationFrame === "function") frame.current = requestAnimationFrame(apply);
				else apply();
			};
			const end = (event) => {
				const state = gesture.current;
				if (state === null) return;
				state.pendingX = event.clientX;
				state.pendingY = event.clientY;
				if (frame.current !== 0) {
					if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame.current);
					frame.current = 0;
				}
				apply();
				gesture.current = null;
				const node = ref.current;
				if (node !== null) {
					node.classList.remove("dsh-tc-cardBusy");
					node.style.transform = "";
					node.style.removeProperty("width");
					node.style.removeProperty("height");
				}
				if (typeof document !== "undefined" && document.body !== void 0) document.body.classList.remove("dsh-tc-interacting");
				try {
					if (typeof event.currentTarget.releasePointerCapture === "function") event.currentTarget.releasePointerCapture(event.pointerId);
				} catch { /* already released */ }
				if (state.mode === "move" && typeof state.nextX === "number") onMove(card.id, state.nextX, state.nextY);
				if (state.mode === "resize" && typeof state.nextW === "number") onResize(card.id, state.nextW, state.nextH);
			};
			const style = { left: card.x, top: card.y };
			if (typeof card.w === "number") style.width = card.w;
			if (typeof card.h === "number") style.height = card.h;
			const accent = card.style !== void 0 && typeof card.style.accent === "string" ? taskStyleAccentColor(card.style.accent) : void 0;
			if (accent !== void 0) style["--dsh-tc-acc"] = accent;
			return (0, react_jsx_runtime.jsxs)("div", {
				ref,
				className: "dsh-tc-card dsh-tc-canvasCard" + (card.style !== void 0 && typeof card.style.width === "string" && typeof card.w !== "number" ? " dsh-tc-card--" + card.style.width : ""),
				"data-sized": (typeof card.w === "number" || typeof card.h === "number") || void 0,
				"data-acc": accent !== void 0 ? "1" : void 0,
				"data-density": card.style !== void 0 && typeof card.style.density === "string" ? card.style.density : void 0,
				style,
				onPointerDown: (event) => event.stopPropagation(),
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-cardHead",
						onPointerDown: (event) => begin("move", event),
						onPointerMove: move,
						onPointerUp: end,
						onPointerCancel: end,
						title: "按住拖动卡片（画布内自由摆放）",
						children: [
							card.style !== void 0 && typeof card.style.icon === "string" && card.style.icon.length > 0 && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardIcon", children: card.style.icon }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-cardTitle", children: card.title.length > 0 ? card.title : "未命名卡片" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "全屏显示这张卡片（Esc 退出）", onPointerDown: (event) => event.stopPropagation(), onClick: () => onFull(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "⛶" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "复制这张卡片（在原地衍生一份）", onPointerDown: (event) => event.stopPropagation(), onClick: () => onDuplicate(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "⧉" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "发回任务台（新建或更新同名卡片）", onPointerDown: (event) => event.stopPropagation(), onClick: () => onBoard(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "📥" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "对话重构卡片", onPointerDown: (event) => event.stopPropagation(), onClick: () => onChat(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "💬" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "编辑这张卡片", onPointerDown: (event) => event.stopPropagation(), onClick: () => onEdit(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "✎" }) }),
							onToggleBare !== void 0 && isBareCandidate(card) && (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "去掉卡片外观，只留控件", onPointerDown: (event) => event.stopPropagation(), onClick: () => onToggleBare(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "▢" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn dsh-tc-iconDanger", title: canvasCardBinding(card) === null ? "从画布删除" : "删除该控件（同时从卡片上移除）", onPointerDown: (event) => event.stopPropagation(), onClick: () => onDelete(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "🗑" }) })
						]
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-cardBody", children: (0, react_jsx_runtime.jsx)(TaskUserBodyView, { card, cardId: card.id, onWidgetState, onBlockResize }) }),
					(0, react_jsx_runtime.jsx)("div", {
						className: "dsh-tc-cardResize",
						title: "拖动调整卡片大小",
						onPointerDown: (event) => begin("resize", event),
						onPointerMove: move,
						onPointerUp: end,
						onPointerCancel: end
					})
				]
			});
		}
		/** Fullscreen infinite canvas: pan/zoom, published card copies, images and live collaboration. */
		function TaskCanvasView(props) {
			const { onClose, instance } = props;
			/** Instance mode: the canvas is bound to one board card ("副本"), not the active canvas. */
			const boundId = instance !== null && instance !== void 0 && typeof instance.canvasId === "string" ? instance.canvasId : null;
			const [state, setState] = (0, react.useState)(() => canvasSnapshot());
			const [editingId, setEditingId] = (0, react.useState)(null);
			const [chatId, setChatId] = (0, react.useState)(null);
			const [fullId, setFullId] = (0, react.useState)(null);
			const [collabOpen, setCollabOpen] = (0, react.useState)(false);
			const [addOpen, setAddOpen] = (0, react.useState)(false);
			const [blockEditId, setBlockEditId] = (0, react.useState)(null);
			const [joinText, setJoinText] = (0, react.useState)("");
			const [hint, setHint] = (0, react.useState)(null);
			const [syncTick, setSyncTick] = (0, react.useState)(0);
			const scrollRef = (0, react.useRef)(null);
			const planeRef = (0, react.useRef)(null);
			const liveView = (0, react.useRef)(null);
			const panGesture = (0, react.useRef)(null);
			const frame = (0, react.useRef)(0);
			const commitTimer = (0, react.useRef)(null);
			(0, react.useEffect)(() => subscribeCanvas(() => setState(canvasSnapshot())), []);
			(0, react.useEffect)(() => canvasSync.subscribe(() => setSyncTick((value) => value + 1)), []);
			/**
			 * Escape closes the canvas unless something is layered above it. The guard reads
			 * refs, not the closure, so the very first keydown after an overlay opens is
			 * already judged correctly (no stale listener while effects catch up).
			 */
			const escapeBlockedRef = (0, react.useRef)(false);
			escapeBlockedRef.current = editingId !== null || chatId !== null || fullId !== null || collabOpen;
			const onCloseRef = (0, react.useRef)(onClose);
			onCloseRef.current = onClose;
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return void 0;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					if (escapeBlockedRef.current) return;
					event.stopPropagation();
					event.preventDefault();
					onCloseRef.current();
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey);
			}, []);
			const canvas = boundId !== null ? (state.canvases[boundId] ?? null) : activeCanvas(state);
			const canvasId = canvas !== null ? canvas.id : null;
			const view = canvasId !== null ? (state.views[canvasId] ?? { x: 40, y: 40, k: 1 }) : { x: 40, y: 40, k: 1 };
			/** Write the live view straight to the DOM (no React render per frame) and commit when idle. */
			const paintView = (next) => {
				liveView.current = next;
				const plane = planeRef.current;
				if (plane !== null) plane.style.transform = "translate(" + next.x + "px," + next.y + "px) scale(" + next.k + ")";
				const scroll = scrollRef.current;
				if (scroll !== null) {
					const grid = 24 * next.k;
					scroll.style.backgroundSize = grid + "px " + grid + "px";
					scroll.style.backgroundPosition = next.x + "px " + next.y + "px";
				}
			};
			const currentView = () => liveView.current ?? view;
			const commitView = () => {
				if (commitTimer.current !== null) { clearTimeout(commitTimer.current); commitTimer.current = null; }
				if (canvasId === null) return;
				const next = currentView();
				canvasSetView(canvasId, { x: Math.round(next.x), y: Math.round(next.y), k: Number(next.k.toFixed(3)) });
			};
			const scheduleCommitView = () => {
				if (commitTimer.current !== null) clearTimeout(commitTimer.current);
				commitTimer.current = setTimeout(commitView, 400);
			};
			(0, react.useEffect)(() => {
				paintView({ x: view.x, y: view.y, k: view.k });
				return () => {
					if (commitTimer.current !== null) { clearTimeout(commitTimer.current); commitTimer.current = null; }
				};
			}, [canvasId, view.x, view.y, view.k]);
			// Wheel zoom must be non-passive to cancel page scrolling.
			(0, react.useEffect)(() => {
				const scroll = scrollRef.current;
				if (scroll === null || typeof scroll.addEventListener !== "function") return;
				const onWheel = (event) => {
					event.preventDefault();
					const rect = scroll.getBoundingClientRect();
					const px = event.clientX - rect.left;
					const py = event.clientY - rect.top;
					const base = currentView();
					const factor = Math.exp(-event.deltaY * 0.0015);
					const k = Math.min(Math.max(CANVAS_VIEW_MIN, base.k * factor), CANVAS_VIEW_MAX);
					const ratio = k / base.k;
					paintView({ x: px - (px - base.x) * ratio, y: py - (py - base.y) * ratio, k });
					scheduleCommitView();
				};
				scroll.addEventListener("wheel", onWheel, { passive: false });
				return () => scroll.removeEventListener("wheel", onWheel);
			}, [canvasId]);
			const onPanDown = (event) => {
				if (event.button !== 0) return;
				const target = event.target;
				if (target !== event.currentTarget && target.closest !== void 0 && target.closest(".dsh-tc-canvasCard") !== null) return;
				event.preventDefault();
				const base = currentView();
				panGesture.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: base.x, y: base.y, k: base.k };
				try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* already released */ }
			};
			const onPanMove = (event) => {
				const pan = panGesture.current;
				if (pan === null) return;
				pan.lastX = pan.x + (event.clientX - pan.startX);
				pan.lastY = pan.y + (event.clientY - pan.startY);
				if (frame.current !== 0) return;
				const flush = () => {
					frame.current = 0;
					const current = panGesture.current;
					if (current !== null) paintView({ x: current.lastX, y: current.lastY, k: current.k });
				};
				if (typeof requestAnimationFrame === "function") frame.current = requestAnimationFrame(flush);
				else flush();
			};
			const onPanUp = (event) => {
				if (panGesture.current === null) return;
				panGesture.current = null;
				try {
					if (typeof event.currentTarget.releasePointerCapture === "function") event.currentTarget.releasePointerCapture(event.pointerId);
				} catch { /* already released */ }
				commitView();
			};
			const worldPoint = (clientX, clientY) => {
				const scroll = scrollRef.current;
				const base = currentView();
				if (scroll === null) return { x: clientX / base.k, y: clientY / base.k };
				const rect = scroll.getBoundingClientRect();
				return { x: (clientX - rect.left - base.x) / base.k, y: (clientY - rect.top - base.y) / base.k };
			};
			/** Paste or drop an image: downscale it and put a bare image control at the drop point. */
			const addImageFile = (file, clientX, clientY) => {
				if (file === null || typeof file !== "object" || typeof file.type !== "string" || !file.type.startsWith("image/")) return;
				const point = worldPoint(clientX, clientY);
				canvasImageDataUrl(file, (dataUrl) => {
					if (dataUrl === null) { setHint("图片无法读取或过大，未添加"); return; }
					if (dataUrl.length > CANVAS_IMAGE_LIMIT) { setHint("图片过大（超过 " + Math.round(CANVAS_IMAGE_LIMIT / 1024) + "KB 数据），未添加"); return; }
					if (canvasId === null) return;
					const nowTs = Date.now();
					const item = {
						id: nextCanvasCardId(),
						title: file.name !== void 0 && file.name.length > 0 ? String(file.name).slice(0, TASK_TITLE_LIMIT) : "图片",
						bare: true,
						x: Math.round(point.x),
						y: Math.round(point.y),
						updatedAt: nowTs,
						blocks: [{ kind: "image", src: dataUrl, bid: nextTaskBlockId() }]
					};
					canvasUpsertCard(canvasId, item, dataUrl.length <= CANVAS_SYNC_LIMIT);
					setHint(dataUrl.length <= CANVAS_SYNC_LIMIT ? "已添加图片控件" : "已添加图片控件（超过同步上限，仅在本地）");
				});
			};
			const onPaste = (event) => {
				const items = event.clipboardData !== void 0 && event.clipboardData !== null && event.clipboardData.files !== void 0 ? Array.from(event.clipboardData.files) : [];
				const file = items.find((item) => typeof item.type === "string" && item.type.startsWith("image/"));
				if (file === void 0) return;
				event.preventDefault();
				const scroll = scrollRef.current;
				const rect = scroll !== null ? scroll.getBoundingClientRect() : null;
				addImageFile(file, rect !== null ? rect.left + rect.width / 2 : 0, rect !== null ? rect.top + rect.height / 2 : 0);
			};
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return;
				const handler = (event) => onPaste(event);
				document.addEventListener("paste", handler);
				return () => document.removeEventListener("paste", handler);
			});
			const onDrop = (event) => {
				const files = event.dataTransfer !== void 0 && event.dataTransfer !== null && event.dataTransfer.files !== void 0 ? Array.from(event.dataTransfer.files) : [];
				const file = files.find((item) => typeof item.type === "string" && item.type.startsWith("image/"));
				if (file === void 0) return;
				event.preventDefault();
				addImageFile(file, event.clientX, event.clientY);
			};
			const editingCard = editingId !== null && canvas !== null && canvas.cards[editingId] !== void 0 ? canvas.cards[editingId] : null;
			const blockEditCard = blockEditId !== null && canvas !== null && canvas.cards[blockEditId] !== void 0 ? canvas.cards[blockEditId] : null;
			const chattingCard = chatId !== null && canvas !== null && canvas.cards[chatId] !== void 0 ? canvas.cards[chatId] : null;
			const fullCard = fullId !== null && canvas !== null && canvas.cards[fullId] !== void 0 ? canvas.cards[fullId] : null;
			const peers = canvasSync.peers;
			const share = canvasShareString();
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-canvasView",
				onPaste,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-canvasBar",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-canvasBarTitle", children: boundId === null ? "无限画布" : "副本画布" }),
							canvas !== null && (0, react_jsx_runtime.jsx)("input", {
								className: "dsh-tc-in dsh-tc-canvasName",
								value: canvas.name,
								maxLength: 40,
								onChange: (event) => canvasRename(canvas.id, event.target.value)
							}),
							// A card instance is bound to its card: no canvas switching or creation here.
							boundId === null && (0, react_jsx_runtime.jsx)("select", {
								className: "dsh-tc-editAction",
								value: canvasId ?? "",
								onChange: (event) => canvasSetActive(event.target.value),
								children: Object.values(state.canvases).filter((item) => !isCanvasInstance(item.id)).map((item) => (0, react_jsx_runtime.jsx)("option", { value: item.id, children: item.name }, item.id))
							}),
							canvas !== null && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-btn" + (addOpen ? " dsh-tc-iconOn" : ""),
								title: "往画布上直接加一个控件（不必先建卡片）",
								onClick: () => setAddOpen((value) => !value),
								children: "+ 控件"
							}),
							boundId === null && (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => { const created = canvasCreate("新画布"); setHint("已创建「" + created.name + "」"); }, children: "+ 新画布" }),
							boundId === null && canvas !== null && (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => canvasDelete(canvas.id), children: "删除画布" }),
							boundId !== null && instance.source !== void 0 && instance.source !== null && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-btn",
								title: "按任务台上这张卡片的当前控件重新展开一次（会替换画布上已绑定的控件卡）",
								onClick: () => {
									if (canvasId === null) return;
									const count = canvasRebuildInstance(canvasId, instance.cardId);
									setHint(count > 0 ? "已重新展开 " + count + " 个控件" : "这张卡片还没有控件");
								},
								children: "⟲ 重新展开控件"
							}),
							boundId !== null && instance.source !== void 0 && instance.source !== null && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-btn",
								title: "把任务台上这张卡片的当前内容再复制一份进副本",
								onClick: () => {
									if (canvasId === null) return;
									canvasPublishCard(instance.source, canvasId);
									setHint("已放入源卡片副本");
								},
								children: "⟲ 放入源卡副本"
							}),
							boundId !== null && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-btn",
								title: "删除这个副本画布（任务台上的卡片不受影响）",
								onClick: () => { if (canvasId !== null) canvasDelete(canvasId); onClose(); },
								children: "删除副本"
							}),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-boardSpacer" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-canvasSync", title: canvasSync.detail ?? "", children: canvasSync.status === "online" ? "已连接" : canvasSync.status === "connecting" ? "连接中…" : "未连接" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-canvasZoom", children: Math.round(view.k * 100) + "%" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => { if (canvasId !== null) { canvasSetView(canvasId, { x: 40, y: 40, k: 1 }); setHint("视图已复位"); } }, children: "复位视图" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => { void copyTaskText(share ?? "").then((ok) => setHint(ok ? "分享串已复制，发给别人粘贴加入" : "复制失败")); }, children: "复制分享串" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn" + (collabOpen ? " dsh-tc-iconOn" : ""), onClick: () => setCollabOpen((value) => !value), children: "协作" + (peers.length > 0 ? " · " + peers.length + " 人在线" : "") }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onClose, children: boundId === null ? "关闭画布" : "返回任务台" })
						]
					}),
					hint !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-canvasHint", children: hint }),
					addOpen && canvas !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-addPanel",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-addHint", children: "点一个控件，直接放到画布中央（不套卡片）：" }),
							TASK_CANVAS_ADD_KINDS.map((kind) => (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dsh-tc-addChip",
								title: "添加「" + (TASK_BLOCK_LABELS[kind] ?? kind) + "」",
								onClick: () => {
									if (canvasId === null) return;
									const scroll = scrollRef.current;
									const base = currentView();
									const rect = scroll !== null ? scroll.getBoundingClientRect() : null;
									const centerX = rect !== null ? (rect.width / 2 - base.x) / base.k - 120 : 80;
									const centerY = rect !== null ? (rect.height / 2 - base.y) / base.k - 60 : 80;
									const added = canvasAddControl(canvasId, kind, centerX, centerY);
									setHint(added === null ? "这个控件无法添加" : "已添加控件：" + (TASK_BLOCK_LABELS[kind] ?? kind) + "（拖动标题条移动，✎ 编辑）");
								},
								children: TASK_BLOCK_LABELS[kind] ?? kind
							}, kind))
						]
					}),
					collabOpen && (0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-canvasCollab",
						children: [
							(0, react_jsx_runtime.jsxs)("label", { className: "dsh-tc-field", children: [
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-fieldLabel", children: "中继地址（ws:// 或 wss://）" }),
								(0, react_jsx_runtime.jsx)("input", {
									className: "dsh-tc-in",
									value: state.relay,
									placeholder: "ws://127.0.0.1:8787",
									onChange: (event) => publishCanvasState({ ...canvasSnapshot(), relay: event.target.value.trim() }, true)
								})
							] }),
							(0, react_jsx_runtime.jsxs)("label", { className: "dsh-tc-field", children: [
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-fieldLabel", children: "昵称（在线列表显示）" }),
								(0, react_jsx_runtime.jsx)("input", {
									className: "dsh-tc-in",
									value: state.nickname,
									maxLength: 24,
									onChange: (event) => publishCanvasState({ ...canvasSnapshot(), nickname: event.target.value.slice(0, 24) }, true)
								})
							] }),
							(0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-canvasCollabRow", children: [
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-tc-btn",
									onClick: () => {
										if (canvasId === null) { setHint("请先新建画布"); return; }
										const current = canvasSnapshot();
										canvasSync.connect(current.relay, canvasId, current.token, current.nickname);
										setHint("正在连接 " + current.relay);
									},
									children: "连接"
								}),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => { canvasSync.disconnect(); setHint("已断开连接"); }, children: "断开" }),
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-chatHint", children: peers.length > 0 ? "在线：" + peers.map((peer) => (peer !== null && typeof peer === "object" && typeof peer.name === "string" && peer.name.length > 0 ? peer.name : "匿名")).join("、") : "暂无其他参与者" })
							] }),
							(0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-canvasCollabRow", children: [
								(0, react_jsx_runtime.jsx)("input", {
									className: "dsh-tc-in",
									value: joinText,
									placeholder: "粘贴别人的分享串（DSHCANVAS1:…）",
									onChange: (event) => setJoinText(event.target.value)
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsh-tc-btn",
									onClick: () => {
										const result = canvasJoinShare(joinText);
										setHint(result.ok ? "已加入共享画布" : result.message);
										if (result.ok) setJoinText("");
									},
									children: "加入"
								})
							] }),
							(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-chatHint", children: "协作基于你自建的中继：先在仓库用 `node relay/server.mjs` 起服务，再把分享串发给别人；同一画布内的卡片变更按“最后写入获胜”合并。" })
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						ref: scrollRef,
						className: "dsh-tc-canvasScroll",
						onPointerDown: onPanDown,
						onPointerMove: onPanMove,
						onPointerUp: onPanUp,
						onPointerCancel: onPanUp,
						onDragOver: (event) => event.preventDefault(),
						onDrop,
						children: (0, react_jsx_runtime.jsx)("div", {
							ref: planeRef,
							className: "dsh-tc-canvasPlane",
							children: canvas === null
								? (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-canvasEmpty", children: "还没有画布：点「+ 新画布」，或从任务台卡片上点 📤 发布为副本。" })
								: Object.values(canvas.cards).map((card) => card.bare === true
									? (0, react_jsx_runtime.jsx)(CanvasControlView, {
										card,
										onMove: (id, x, y) => {
											const current = canvas.cards[id];
											if (current === void 0) return;
											canvasUpsertCard(canvasId, { ...current, x, y }, true);
											canvasSyncBlockOrder(canvasId, canvasCardBinding(current)?.card ?? "");
										},
										onResize: (id, w, h) => { const current = canvas.cards[id]; if (current !== void 0) canvasUpsertCard(canvasId, { ...current, w, h }, true); },
										onEdit: (id) => { setChatId(null); setEditingId(null); setBlockEditId(id); },
										onChat: (id) => { setEditingId(null); setBlockEditId(null); setChatId(id); },
										onDuplicate: (id) => {
											const current = canvas.cards[id];
											if (current === void 0 || canvasId === null) return;
											if (canvasDuplicateCard(canvasId, current) !== null) setHint("已复制这个控件");
										},
										onBoard: (id) => {
											const current = canvas.cards[id];
											if (current === void 0) return;
											const outcome = canvasSendToBoard(current);
											setHint(outcome.ok === true ? "已发回任务台：" + (outcome.created === true ? "新建" : "更新") + "「" + (current.title || "控件") + "」" : "发回任务台失败");
										},
										onToggleBare: (id) => {
											const current = canvas.cards[id];
											if (current === void 0) return;
											if (canvasSetBare(canvasId, current, false)) setHint("已套上卡片外观");
										},
										onDelete: (id) => {
											const current = canvas.cards[id];
											canvasDeleteCard(canvasId, id);
											if (current !== void 0 && canvasRemoveBoundBlock(current)) setHint("已从卡片上移除该控件");
										},
										onWidgetState: (id, scope, value) => {
											const current = canvas.cards[id];
											if (current === void 0) return;
											const widgets = current.widgets !== null && typeof current.widgets === "object" ? { ...current.widgets } : {};
											widgets[scope] = value;
											canvasUpsertCard(canvasId, { ...current, widgets }, true);
										},
										onBlockResize: (id, blockIndex, height) => {
											const current = canvas.cards[id];
											if (current === void 0) return;
											const next = patchTaskEmbedHeight(current, blockIndex, height);
											if (next === null) return;
											canvasUpsertCard(canvasId, next, true);
											canvasPushBinding(canvasId, next);
										}
									}, card.id)
									: (0, react_jsx_runtime.jsx)(CanvasCardView, {
										card,
										scale: view.k,
									onMove: (id, x, y) => {
										const current = canvas.cards[id];
										if (current === void 0) return;
										canvasUpsertCard(canvasId, { ...current, x, y }, true);
										// The board card mirrors the arrangement, so a move may reorder controls.
										canvasSyncBlockOrder(canvasId, canvasCardBinding(current)?.card ?? "");
									},
									onResize: (id, w, h) => { const current = canvas.cards[id]; if (current !== void 0) canvasUpsertCard(canvasId, { ...current, w, h }, true); },
									onEdit: (id) => {
										const current = canvas.cards[id];
										// A single control gets the control editor; a real card gets the card editor.
										if (current !== void 0 && isBareCandidate(current)) { setChatId(null); setEditingId(null); setBlockEditId(id); return; }
										setBlockEditId(null);
										setChatId(null);
										setEditingId(id);
									},
									onChat: (id) => { setEditingId(null); setChatId(id); },
									onFull: (id) => { setEditingId(null); setChatId(null); setFullId(id); },
									onDuplicate: (id) => {
										const current = canvas.cards[id];
										if (current === void 0 || canvasId === null) return;
										const cloneId = canvasDuplicateCard(canvasId, current);
										if (cloneId !== null) setHint("已复制一张卡片");
									},
									onBoard: (id) => {
										const current = canvas.cards[id];
										if (current === void 0) return;
										const outcome = canvasSendToBoard(current);
										setHint(outcome.ok === true ? "已发回任务台：" + (outcome.created === true ? "新建" : "更新") + "「" + (current.title || "未命名卡片") + "」" : "发回任务台失败");
									},
									onDelete: (id) => {
										const current = canvas.cards[id];
										canvasDeleteCard(canvasId, id);
										// Deleting a bound item removes that control from the card it maps.
										if (current !== void 0 && canvasRemoveBoundBlock(current)) setHint("已从卡片上移除该控件");
									},
									onWidgetState: (id, scope, value) => {
										const current = canvas.cards[id];
										if (current === void 0) return;
										const widgets = current.widgets !== null && typeof current.widgets === "object" ? { ...current.widgets } : {};
										widgets[scope] = value;
										canvasUpsertCard(canvasId, { ...current, widgets }, true);
									},
									onBlockResize: (id, blockIndex, height) => {
										const current = canvas.cards[id];
										if (current === void 0) return;
										const next = patchTaskEmbedHeight(current, blockIndex, height);
										if (next === null) return;
										canvasUpsertCard(canvasId, next, true);
										canvasPushBinding(canvasId, next);
									},
									onToggleBare: (id) => {
										const current = canvas.cards[id];
										if (current === void 0) return;
										if (canvasSetBare(canvasId, current, true)) setHint("已变成裸控件（点 ▣ 可再套回卡片）");
									}
								}, card.id))
						})
					}),
					blockEditCard !== null && (0, react_jsx_runtime.jsx)(TaskBlockQuickEdit, {
						block: effectiveTaskBlocks(blockEditCard)[0] ?? { kind: "text", text: "" },
						onCancel: () => setBlockEditId(null),
						onSave: (block) => {
							if (canvasId !== null) {
								const outcome = canvasUpdateControl(canvasId, blockEditCard, block);
								setHint(outcome.ok === true ? "控件已更新" : "控件内容不合法，未保存");
							}
							setBlockEditId(null);
						}
					}),
					editingCard !== null && (0, react_jsx_runtime.jsx)(TaskCardEditor, {
						initial: editingCard,
						onCancel: () => setEditingId(null),
						onSave: (content) => {
							const next = canvasCardFromEditor(editingCard, content);
							canvasUpsertCard(canvasId, next, true);
							canvasPushBinding(canvasId, next);
							setEditingId(null);
						}
					}),
					chattingCard !== null && (0, react_jsx_runtime.jsx)(TaskCardChat, {
						card: { ...chattingCard, id: chattingCard.id },
						onClose: () => setChatId(null),
						applySpec: (spec) => {
							const outcome = canvasApplySpec(canvasId, chattingCard, spec);
							const applied = canvasSnapshot().canvases[canvasId]?.cards[chattingCard.id];
							if (applied !== void 0) canvasPushBinding(canvasId, applied);
							return outcome;
						}
					}),
					fullCard !== null && (0, react_jsx_runtime.jsx)(TaskCardFullscreen, {
						title: fullCard.title.length > 0 ? fullCard.title : "未命名卡片",
						badge: void 0,
						layout: fullCard,
						fill: (fullCard.blocks ?? []).some((block) => block.kind === "embed" && block.fill === true),
						actions: [
							{ key: "edit", icon: "✎", title: "编辑卡片", onClick: () => { setFullId(null); setEditingId(fullCard.id); } },
							{ key: "chat", icon: "💬", title: "对话重构卡片", onClick: () => { setFullId(null); setChatId(fullCard.id); } }
						],
						onClose: () => setFullId(null),
						children: (0, react_jsx_runtime.jsx)(TaskUserBodyView, {
							card: fullCard,
							cardId: fullCard.id,
							onWidgetState: (id, scope, value) => {
								const current = canvasSnapshot().canvases[canvasId]?.cards[id];
								if (current === void 0) return;
								const widgets = current.widgets !== null && typeof current.widgets === "object" ? { ...current.widgets } : {};
								widgets[scope] = value;
								canvasUpsertCard(canvasId, { ...current, widgets }, true);
							},
							onBlockResize: (id, blockIndex, height) => {
								const current = canvasSnapshot().canvases[canvasId]?.cards[id];
								if (current === void 0) return;
								const next = patchTaskEmbedHeight(current, blockIndex, height);
								if (next === null) return;
								canvasUpsertCard(canvasId, next, true);
							}
						})
					})
				]
			});
		}
		/**
		 * Quick editor for one control: the common kinds get a plain text field, every kind
		 * also exposes its raw JSON so anything on a canvas stays hand-editable.
		 */
		function TaskBlockQuickEdit(props) {
			const { block, onSave, onCancel } = props;
			const kind = typeof block.kind === "string" ? block.kind : "text";
			const field = TASK_BLOCK_TEXT_FIELD[kind] ?? "";
			const urlKind = kind === "embed" || kind === "image";
			const urlField = kind === "embed" ? "url" : "src";
			const [text, setText] = (0, react.useState)(field.length > 0 && typeof block[field] === "string" ? block[field] : "");
			const [url, setUrl] = (0, react.useState)(urlKind && typeof block[urlField] === "string" ? block[urlField] : "");
			const [json, setJson] = (0, react.useState)(() => JSON.stringify(block, null, 2));
			const [jsonOpen, setJsonOpen] = (0, react.useState)(field.length === 0 && !urlKind);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return void 0;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					event.preventDefault();
					onCancel();
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey, true);
			}, [onCancel]);
			const save = () => {
				let candidate = { ...block };
				if (jsonOpen) {
					try {
						const parsed = JSON.parse(json);
						if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("需要 JSON 对象");
						candidate = parsed;
					} catch (failure) {
						setError("JSON 无法解析：" + (failure !== null && typeof failure === "object" && failure.message ? failure.message : String(failure)));
						return;
					}
				} else {
					if (field.length > 0) candidate[field] = text;
					if (urlKind) candidate[urlField] = url.trim();
				}
				const clean = sanitizeTaskBlock(candidate, 0);
				if (clean === null) {
					setError("内容不合法，控件会被丢弃（" + (kind === "embed" ? "地址必须是 http/https" : kind === "image" ? "需要 https 或 data:image 地址" : "请检查必填字段") + "）");
					return;
				}
				onSave(clean);
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-editorWrap",
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: "dsh-tc-editor dsh-tc-quickEdit",
					children: [
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-editorHead",
							children: [
								(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-editorTitle", children: "编辑控件 · " + (TASK_BLOCK_LABELS[kind] ?? kind) }),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => setJsonOpen((value) => !value), children: jsonOpen ? "简单编辑" : "JSON 编辑" })
							]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-editorScroll",
							children: [
								jsonOpen
									? (0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-field", children: [
										(0, react_jsx_runtime.jsx)("label", { className: "dsh-tc-fieldLabel", children: "控件 JSON（保存时会按控件规则校验）" }),
										(0, react_jsx_runtime.jsx)("textarea", { className: "dsh-tc-ta dsh-tc-quickJson", value: json, spellCheck: false, onChange: (event) => setJson(event.target.value) })
									] })
									: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										field.length > 0 && (0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-field", children: [
											(0, react_jsx_runtime.jsx)("label", { className: "dsh-tc-fieldLabel", children: TASK_BLOCK_FIELD_LABEL[field] ?? field }),
											field === "text" && kind === "text"
												? (0, react_jsx_runtime.jsx)("textarea", { className: "dsh-tc-ta", value: text, maxLength: TASK_WIDGET_TEXT_LIMIT, onChange: (event) => setText(event.target.value) })
												: (0, react_jsx_runtime.jsx)("input", { className: "dsh-tc-in", value: text, maxLength: 200, onChange: (event) => setText(event.target.value) })
										] }),
										urlKind && (0, react_jsx_runtime.jsxs)("div", { className: "dsh-tc-field", children: [
											(0, react_jsx_runtime.jsx)("label", { className: "dsh-tc-fieldLabel", children: TASK_BLOCK_FIELD_LABEL[urlField] ?? urlField }),
											(0, react_jsx_runtime.jsx)("input", { className: "dsh-tc-in", value: url, placeholder: kind === "embed" ? "https://example.com/app" : "https://…", onChange: (event) => setUrl(event.target.value) })
										] })
									] })
							]
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: "dsh-tc-editorFoot",
							children: [
								error !== null && (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-editErr", children: error }),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onCancel, children: "取消" }),
								(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btnPrimary", onClick: save, children: "保存" })
							]
						})
					]
				})
			});
		}
		//#endregion
		//#region architecture diagram dock
		const TASK_DIAGRAM_DOCK_WIDTH_KEY = "dsh.taskconsole.dockwidth.v1";
		/** sha256 of the decoded docs/architecture.html, asserted by the smoke test. */
		const TASK_DIAGRAM_SHA256 = "bffff19fc641f0058c4e0a8f16d67d05adc58bde6e8e40ce189c31c0fd51c529";
		/** docs/architecture.html (archify output) gzipped + base64 so the diagram travels inside
		 *  this single-file bundle; decoded lazily on the first open and then cached. */
		const TASK_DIAGRAM_GZIP_B64 = "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";
		let taskDiagramHtmlCache = null;
		let taskDiagramHtmlPromise = null;
		/** Decompress the embedded architecture diagram into HTML text. */
		function taskDiagramHtml() {
			if (taskDiagramHtmlCache !== null) return Promise.resolve(taskDiagramHtmlCache);
			if (taskDiagramHtmlPromise !== null) return taskDiagramHtmlPromise;
			const pending = (async () => {
				if (typeof DecompressionStream !== "function" || typeof atob !== "function") throw new Error("当前浏览器不支持 DecompressionStream，无法内嵌渲染框图；可在新标签页打开 docs/architecture.html 查看");
				const binary = atob(TASK_DIAGRAM_GZIP_B64);
				const bytes = new Uint8Array(binary.length);
				for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
				const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
				const html = await new Response(stream).text();
				if (typeof html !== "string" || html.length === 0) throw new Error("框图内容为空");
				taskDiagramHtmlCache = html;
				return html;
			})();
			taskDiagramHtmlPromise = pending;
			pending.catch(() => {
				if (taskDiagramHtmlPromise === pending) taskDiagramHtmlPromise = null;
			});
			return pending;
		}
		function taskDiagramWidthClamp(value) {
			const max = typeof window === "undefined" ? 1800 : Math.max(380, Math.min(window.innerWidth - 160, 1800));
			return Math.min(Math.max(Math.round(value), 380), max);
		}
		function loadTaskDiagramWidth() {
			const fallback = typeof window === "undefined" ? 760 : Math.round(window.innerWidth * 0.52);
			try {
				const raw = window.localStorage.getItem(TASK_DIAGRAM_DOCK_WIDTH_KEY);
				const stored = raw === null ? Number.NaN : Number(raw);
				if (Number.isFinite(stored)) return taskDiagramWidthClamp(stored);
			} catch (error) {
				// storage blocked (private mode): keep the default width
			}
			return taskDiagramWidthClamp(fallback);
		}
		/** Right-hand dock showing the project architecture diagram (archify artifact) beside the board. */
		function TaskDiagramDock(props) {
			const { onClose } = props;
			const dockRef = (0, react.useRef)(null);
			const [width, setWidth] = (0, react.useState)(loadTaskDiagramWidth);
			const [html, setHtml] = (0, react.useState)(taskDiagramHtmlCache);
			const [status, setStatus] = (0, react.useState)(taskDiagramHtmlCache === null ? "loading" : "ready");
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (taskDiagramHtmlCache !== null) {
					setHtml(taskDiagramHtmlCache);
					setStatus("ready");
					return void 0;
				}
				let alive = true;
				taskDiagramHtml().then((text) => {
					if (!alive) return;
					setHtml(text);
					setStatus("ready");
				}, (failure) => {
					if (!alive) return;
					setError(failure !== null && typeof failure === "object" && typeof failure.message === "string" ? failure.message : String(failure));
					setStatus("error");
				});
				return () => { alive = false; };
			}, []);
			// The width follows the pointer on the compositor (no React state per move) and
			// commits — plus persists — once the button is released.
			const beginResize = (event) => {
				if (event.button !== 0) return;
				const dock = dockRef.current;
				if (dock === null) return;
				event.preventDefault();
				const right = dock.getBoundingClientRect().right;
				let latest = width;
				const move = (moveEvent) => {
					latest = taskDiagramWidthClamp(right - moveEvent.clientX);
					dock.style.width = latest + "px";
				};
				const end = () => {
					window.removeEventListener("pointermove", move);
					window.removeEventListener("pointerup", end);
					setWidth(latest);
					try {
						window.localStorage.setItem(TASK_DIAGRAM_DOCK_WIDTH_KEY, String(latest));
					} catch (error) {
						// storage blocked: the width still applies for this session
					}
				};
				window.addEventListener("pointermove", move);
				window.addEventListener("pointerup", end);
			};
			const openInTab = () => {
				taskDiagramHtml().then((text) => {
					const url = URL.createObjectURL(new Blob([text], { type: "text/html" }));
					window.open(url, "_blank", "noopener");
					setTimeout(() => URL.revokeObjectURL(url), 60000);
				}, () => {});
			};
			return (0, react_jsx_runtime.jsxs)("aside", {
				ref: dockRef,
				className: "dsh-tc-diagramDock",
				"data-status": status,
				style: { width: width + "px" },
				children: [
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-diagramGrip", title: "拖动调整框图宽度", onPointerDown: beginResize }),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-diagramBar",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-diagramTitle", children: "项目逻辑框图" }),
							(0, react_jsx_runtime.jsx)("span", {
								className: "dsh-tc-diagramMeta",
								title: "archify · docs/architecture.html（可缩放 / 点击节点 / 切换明暗）",
								children: status === "ready" ? Math.round(html.length / 1024) + "KB · archify" : status === "error" ? "读取失败" : "解压中…"
							}),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-boardSpacer" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", disabled: status !== "ready", title: "在新标签页全屏打开框图", onClick: openInTab, children: "新标签打开" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onClose, children: "关闭" })
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-diagramBody",
						children: [
							status === "ready" ? (0, react_jsx_runtime.jsx)("iframe", {
								className: "dsh-tc-diagramFrame",
								title: "项目逻辑框图",
								sandbox: "allow-scripts allow-downloads allow-modals allow-popups",
								srcDoc: html
							}) : (0, react_jsx_runtime.jsxs)("div", {
								className: "dsh-tc-diagramState",
								children: [
									(0, react_jsx_runtime.jsx)("span", { children: status === "error" ? "框图无法内嵌显示" : "正在解压内嵌框图…" }),
									status === "error" ? (0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-diagramErr", children: error ?? "" }) : null
								]
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region back panel
		/** The full-screen "back of the page" task board: header + draggable glass cards over the live session state. */
		function TaskBackPanel(props) {
			const { useSessions, onClose, plugins } = props;
			const current = useSessions((state) => state.current);
			const byId = useSessions((state) => state.byId);
			const jobs = useSessions((state) => state.current === void 0 ? void 0 : state.jobsBySession[state.current]);
			const catalog = useSessions((state) => state.current === void 0 ? void 0 : state.subagentsByParent[state.current]);
			const phase = useSessions((state) => state.phase);
			const boardRef = (0, react.useRef)(null);
			const [state, setState] = (0, react.useState)(() => snapshotTaskCards());
			const [editor, setEditor] = (0, react.useState)(null);
			const [chatCardId, setChatCardId] = (0, react.useState)(null);
			const [canvasOpen, setCanvasOpen] = (0, react.useState)(false);
			const [diagramOpen, setDiagramOpen] = (0, react.useState)(false);
			const [confirmDeleteId, setConfirmDeleteId] = (0, react.useState)(null);
			const [fullCardId, setFullCardId] = (0, react.useState)(null);
			const [instance, setInstance] = (0, react.useState)(null);
			const [dark, setDark] = (0, react.useState)(() => typeof document !== "undefined" && document.body.hasAttribute("data-ds-dark-theme"));
			const stateRef = (0, react.useRef)(state);
			stateRef.current = state;
			(0, react.useEffect)(() => subscribeTaskCards(() => setState(snapshotTaskCards())), []);
			(0, react.useEffect)(() => {
				const body = document.body;
				const update = () => setDark(body.hasAttribute("data-ds-dark-theme"));
				const observer = new MutationObserver(update);
				observer.observe(body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
				return () => observer.disconnect();
			}, []);
			/** Commit a next board state to React and the module store (single source). */
			const commit = (0, react.useCallback)((cards, order) => {
				const next = { cards, order };
				setState(next);
				publishTaskCards(cards, order);
			}, []);			/** Raise one card to the front of the stacking order. */
			const raisedOrder = (order, id) => [...order.filter((key) => key !== id), id];
			// Gestures commit once on release: the card moves/sizes on the compositor
			// while the pointer is down (see TaskCard.beginGesture), so grabbing never
			// re-renders the board.
			const onDragCommit = (0, react.useCallback)((id, x, y) => {
				const previous = stateRef.current;
				const card = previous.cards[id];
				if (card === void 0) return;
				if (card.x === x && card.y === y) return;
				commit({ ...previous.cards, [id]: { ...card, x, y } }, raisedOrder(previous.order, id));
			}, [commit]);
			const onResizeCommit = (0, react.useCallback)((id, w, h) => {
				const previous = stateRef.current;
				const card = previous.cards[id];
				if (card === void 0) return;
				let next = { ...card, w, h };
				if (card.style !== null && typeof card.style === "object" && typeof card.style.width === "string") {
					// A manual size wins over the width preset: drop the preset so the drag sticks.
					const style = { ...card.style };
					delete style.width;
					if (Object.keys(style).length > 0) next.style = style;
					else delete next.style;
				}
				commit({ ...previous.cards, [id]: next }, raisedOrder(previous.order, id));
			}, [commit]);
			const setCardFlag = (0, react.useCallback)((id, field, value) => {
				const previous = stateRef.current;
				const cards = { ...previous.cards, [id]: { ...previous.cards[id], [field]: value } };
				commit(cards, previous.order);
			}, [commit]);
			const pinCard = (0, react.useCallback)((id) => {
				const previous = stateRef.current;
				const card = previous.cards[id];
				if (card === void 0) return;
				const nextPinned = card.pinned !== true;
				const cards = { ...previous.cards, [id]: { ...card, pinned: nextPinned } };
				const order = nextPinned ? [...previous.order.filter((key) => key !== id), id] : previous.order;
				commit(cards, order);
			}, [commit]);
			const removeUserCard = (0, react.useCallback)((id) => {
				const previous = stateRef.current;
				if (!isUserTaskCard(previous.cards[id])) return;
				const cards = { ...previous.cards };
				delete cards[id];
				commit(cards, previous.order.filter((key) => key !== id));
				// The card's instance canvas must not keep ghost controls.
				canvasUnbindCard(canvasInstanceId(id), id);
			}, [commit]);
			const createUserCardAndChat = (0, react.useCallback)(() => {
				const previous = stateRef.current;
				const nowTs = Date.now();
				const spot = cascadeTaskCardSpot(previous.cards);
				const id = nextUserTaskCardId();
				const entry = { x: spot.x, y: spot.y, collapsed: false, hidden: false, pinned: false, title: "未命名卡片", blocks: [], createdAt: nowTs, updatedAt: nowTs };
				const cards = { ...previous.cards, [id]: entry };
				const order = [...previous.order, id];
				commit(cards, order);
				setEditor(null);
				setChatCardId(id);
			}, [commit]);
			const saveUserCard = (0, react.useCallback)((id, content) => {
				const previous = stateRef.current;
				const nowTs = Date.now();
				const cards = { ...previous.cards };
				const order = [...previous.order];
				const buildBlocks = (prev) => {
					const preserved = [];
					if (prev !== null) {
						for (const block of effectiveTaskBlocks(prev)) {
							if (block.kind === "text" || block.kind === "button" || block.kind === "embed") continue;
							preserved.push(block);
						}
					}
					return [...taskEditorBlocks(content), ...preserved];
				};
				const blocks = sanitizeTaskBlocks(buildBlocks(id !== null && isUserTaskCard(cards[id]) ? cards[id] : null));
				const scopeSet = new Set();
				for (let index = 0; index < blocks.length; index++) scopeSet.add(taskBlockScope(blocks[index], index));
				const keepWidgets = (existing) => {
					if (existing.widgets === null || typeof existing.widgets !== "object") return void 0;
					const kept = {};
					for (const [scope, value] of Object.entries(existing.widgets)) {
						if (scopeSet.has(scope)) kept[scope] = value;
					}
					return Object.keys(kept).length > 0 ? kept : void 0;
				};
				if (id !== null && isUserTaskCard(cards[id])) {
					const prev = cards[id];
					const next = { ...prev, title: content.title, pinned: content.pinned, blocks, hidden: false, updatedAt: nowTs };
					const widgets = keepWidgets(prev);
					if (widgets !== void 0) next.widgets = widgets;
					else delete next.widgets;
					delete next.body;
					delete next.buttons;
					cards[id] = next;
				} else {
					const key = id !== null ? id : nextUserTaskCardId();
					const spot = cascadeTaskCardSpot(previous.cards);
					cards[key] = { x: spot.x, y: spot.y, collapsed: false, hidden: false, pinned: content.pinned, title: content.title, blocks, createdAt: nowTs, updatedAt: nowTs };
					if (order.indexOf(key) === -1) order.push(key);
				}
				commit(cards, order);
				// The manual editor changes the card's controls too: keep its canvas in step,
				// and mirror an embed height dragged on the board into the plane.
				if (id !== null) syncTaskCardInstance(id);
			}, [commit]);
			const setWidgetState = (0, react.useCallback)((id, scope, value) => {
				const previous = stateRef.current;
				const card = previous.cards[id];
				if (card === void 0 || !isUserTaskCard(card)) return;
				const widgets = card.widgets !== null && typeof card.widgets === "object" ? { ...card.widgets } : {};
				widgets[scope] = value;
				const cards = { ...previous.cards, [id]: { ...card, widgets } };
				commit(cards, previous.order);
			}, [commit]);
			/** Persist a drag-resized embedded web app (its block height) on a board card. */
			const resizeEmbedBlock = (0, react.useCallback)((id, blockIndex, height) => {
				const previous = stateRef.current;
				const card = previous.cards[id];
				if (card === void 0 || !isUserTaskCard(card)) return;
				const next = patchTaskEmbedHeight(card, blockIndex, height);
				if (next === null) return;
				commit({ ...previous.cards, [id]: { ...next, updatedAt: Date.now() } }, previous.order);
				// The same control lives on the card's canvas: keep both in step.
				syncTaskCardInstance(id);
			}, [commit]);
			const reset = (0, react.useCallback)(() => {
				const previous = stateRef.current;
				const cards = freshTaskCards();
				const order = builtinTaskCardIds();
				for (const key of Object.keys(previous.cards)) {
					if (isUserTaskCard(previous.cards[key])) {
						cards[key] = previous.cards[key];
						order.push(key);
					}
				}
				commit(cards, order);
			}, [commit]);
			const summary = current === void 0 ? void 0 : byId[current];
			const jobList = jobs ?? [];
			const liveJobs = jobList.filter((job) => job.status === "running" || job.status === "stopping").length;
			const entries = catalog?.entries ?? [];
			const runningSubagents = entries.filter((entry) => entry.activity === "running").length;
			const editing = editor === null ? void 0 : (editor.id === null ? null : isUserTaskCard(state.cards[editor.id]) ? state.cards[editor.id] : null);
			const chatting = chatCardId !== null && isUserTaskCard(state.cards[chatCardId]) ? state.cards[chatCardId] : null;
			/** Title/badge/body/actions of one card — shared by the board and its fullscreen view. */
			const cardView = (id) => {
				const layout = state.cards[id];
				if (layout === void 0) return null;
				let title = id;
				let badge;
				let body;
				if (id === "session") {
					title = "会话概览";
					body = (0, react_jsx_runtime.jsx)(TaskSessionBodyView, { summary, current, phase, liveJobs, totalJobs: jobList.length, runningSubagents, totalSubagents: entries.length });
				} else if (id === "jobs") {
					title = "后台任务";
					badge = liveJobs > 0 ? liveJobs + " 运行中" : String(jobList.length);
					body = (0, react_jsx_runtime.jsx)(TaskJobsBodyView, { jobs: jobList });
				} else if (id === "subagents") {
					title = "子代理";
					badge = runningSubagents > 0 ? runningSubagents + " 运行中" : String(entries.length);
					body = (0, react_jsx_runtime.jsx)(TaskSubagentsBodyView, { entries });
				} else if (id === "plugins") {
					title = "插件管理";
					body = (0, react_jsx_runtime.jsx)(TaskPluginsBodyView, { plugins });
				} else if (isUserTaskCard(layout)) {
					title = layout.title ?? id;
					badge = layout.pinned === true ? "置顶" : void 0;
					body = (0, react_jsx_runtime.jsx)(TaskUserBodyView, { card: layout, cardId: id, onWidgetState: setWidgetState, onBlockResize: resizeEmbedBlock, thumbnail: true });
				} else {
					title = "工作区";
					body = (0, react_jsx_runtime.jsx)(TaskWorkspaceBodyView, { summary, current, updatedAt: summary?.updatedAt ?? 0 });
				}
				const isUser = isUserTaskCard(layout);
				const confirming = confirmDeleteId === id;
				const actions = [
					{
						key: "full",
						icon: "⛶",
						// A user card maximizes into its own canvas instance (seeded with a copy of
						// the card); a read-only built-in card just gets the big fullscreen view.
						title: isUser ? "最大化：进入这张卡片的副本画布（自由摆放 / 衍生 / 协作）" : "全屏显示这张卡片（Esc 退出）",
						onClick: () => {
							if (!isUser) {
								setFullCardId(id);
								return;
							}
							// The stored card entry carries no id of its own: bind it explicitly.
							const canvasId = canvasOpenInstance({ ...layout, id });
							if (canvasId === null) {
								setFullCardId(id);
								return;
							}
							setFullCardId(null);
							setCanvasOpen(false);
							setInstance({ canvasId, cardId: id, title: layout.title ?? id, source: layout });
						}
					},
					{ key: "collapse", icon: layout.collapsed ? "▾" : "▴", title: layout.collapsed ? "展开" : "收起", onClick: () => setCardFlag(id, "collapsed", !layout.collapsed) }
				];
				if (isUser) {
					actions.push(
						{ key: "pin", icon: "📌", title: layout.pinned === true ? "取消置顶" : "置顶", active: layout.pinned === true, onClick: () => pinCard(id) },
						{ key: "publish", icon: "📤", title: "发布为副本到无限画布", onClick: () => { canvasPublishCard(layout); setCanvasOpen(true); } },
						{ key: "chat", icon: "💬", title: "对话修改卡片（用语言描述修改）", onClick: () => { setEditor(null); setChatCardId(id); } },
						{ key: "edit", icon: "✎", title: "编辑卡片", onClick: () => { setChatCardId(null); setEditor({ id }); } },
						{ key: "delete", icon: confirming ? "确认" : "🗑", title: confirming ? "再次点击确认删除该卡片" : "删除卡片", danger: true, onClick: () => {
							if (confirming) { setConfirmDeleteId(null); removeUserCard(id); }
							else setConfirmDeleteId(id);
						} }
					);
				} else {
					actions.push({ key: "close", icon: "×", title: "隐藏卡片", onClick: () => setCardFlag(id, "hidden", true) });
				}
				const hasFillApp = effectiveTaskBlocks(layout).some((block) => block.kind === "embed" && block.fill === true);
				return { layout, title, badge, body, actions, isUser, confirmDeleteId, hasFillApp };
			};
			const fullView = fullCardId === null ? null : cardView(fullCardId);
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
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn" + (canvasOpen ? " dsh-tc-iconOn" : ""), title: "打开无限画布（发布副本 / 多人协作）", onClick: () => setCanvasOpen(true), children: "🖼 画布" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn" + (diagramOpen ? " dsh-tc-iconOn" : ""), title: "在右侧显示当前项目的逻辑框图（archify 生成，可拖动改宽）", onClick: () => setDiagramOpen((value) => !value), children: "🗺 框图" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: createUserCardAndChat, children: "+ 新建卡片" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: reset, children: "复位卡片" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onClose, children: "返回会话" })
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						ref: boardRef,
						className: "dsh-tc-canvas",
						children: [
							state.order.map((id) => {
								const view = cardView(id);
								if (view === null || view.layout.hidden) return null;
								const zIndex = 10 + state.order.indexOf(id);
								return (0, react_jsx_runtime.jsx)(TaskCard, {
									id,
									title: view.title,
									badge: view.badge,
									layout: view.layout,
									zIndex,
									boardRef,
									actions: view.actions,
									onDragCommit,
									onResizeCommit,
									children: view.body
								}, id);
							}),
							editor !== null && (0, react_jsx_runtime.jsx)(TaskCardEditor, {
								initial: editing === void 0 ? null : editing,
								onCancel: () => setEditor(null),
								onSave: (content) => {
									saveUserCard(editor.id, content);
									setEditor(null);
									setConfirmDeleteId(null);
								}
							}),
							chatting !== null && (0, react_jsx_runtime.jsx)(TaskCardChat, {
								card: { ...chatting, id: chatCardId },
								onClose: () => setChatCardId(null)
							}),
							canvasOpen && (0, react_jsx_runtime.jsx)(TaskCanvasView, { onClose: () => setCanvasOpen(false) }),
							instance !== null && (0, react_jsx_runtime.jsx)(TaskCanvasView, { instance, onClose: () => setInstance(null) }),
							diagramOpen && (0, react_jsx_runtime.jsx)(TaskDiagramDock, { onClose: () => setDiagramOpen(false) }),
							fullView !== null && (0, react_jsx_runtime.jsx)(TaskCardFullscreen, {
								title: fullView.title,
								badge: fullView.badge,
								layout: fullView.layout,
								fill: fullView.hasFillApp,
								actions: fullView.actions.filter((action) => action.key !== "collapse" && action.key !== "full" && action.key !== "delete"),
								onClose: () => setFullCardId(null),
								children: fullView.body
							})
						]
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
				"data-open": open || void 0,
				onClick: onFlip,
				title: open ? "返回页面正面" : "翻到页面背面 · 任务控制台",
				children: [
					(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-toggleIcon", children: open ? "◀" : "⇄" }, "icon"),
					(0, react_jsx_runtime.jsx)("span", { children: open ? "返回正面" : "任务台" }, "label")
				]
			});
		}
		/**
		 * shell.overlay occupant root: the floating toggle plus the flip card.
		 * The main interface and the task board are the two faces of one page:
		 * opening flips the REAL app frame (its [data-shell-overlay] parent)
		 * and the workbench card together 0→180° around the page center, so the
		 * chat turns over and the board is revealed as its back; closing
		 * reverses it. The card is portaled to body because the frame's
		 * overflow flattens descendants. The overlay layer is click-through;
		 * this entry opts back into pointer events on its own surfaces only.
		 * @param props - framework standard props (useSessions is the standard feed).
		 */
		function TaskConsoleRoot(props) {
			const { useSessions } = props;
			const [open, setOpen] = (0, react.useState)(false);
			const [closing, setClosing] = (0, react.useState)(false);
			const [opening, setOpening] = (0, react.useState)(false);
			/** True once the open flip finished: the card drops its 3D transform so the board is flat and fully interactive. */
			const [settled, setSettled] = (0, react.useState)(false);
			const pendingClose = (0, react.useRef)(false);
			/** Holds the floating-input drag listeners so restore can detach them. */
			const inputDragRef = (0, react.useRef)(null);
			/** Holds the floating transcript strip + its refresh timer. */
			const transcriptRef = (0, react.useRef)(null);
			/** The seat's original rect, so the close can morph the window back into place. */
			const inputHomeRectRef = (0, react.useRef)(null);
			/** The chat scrollport's state before the flip, restored on close so the history never jumps. */
			const chatScrollRef = (0, react.useRef)(null);
			/** Defer close requests while the open flip is running so the CSS animations never restart mid-flight. */
			const requestClose = (0, react.useCallback)(() => {
				if (opening) {
					pendingClose.current = true;
					return;
				}
				setClosing(true);
			}, [opening]);
			const flip = (0, react.useCallback)(() => {
				if (open) requestClose();
				else {
					setClosing(false);
					setSettled(false);
					setOpen(true);
				}
			}, [open, requestClose]);
			/**
			 * Float the REAL composer seat ([data-composer-seat], the harness's
			 * sticky input bar) over the board WITHOUT moving it: fixed positioning
			 * at its exact rect plus a z-index above the workbench card. It stays
			 * inside #root, so React's delegated events keep working (typing,
			 * sending, attachments all live). This only works while the frame
			 * itself is not transformed — the page flip below rotates the frame's
			 * children around the shared screen center instead.
			 */
			const moveInputFloating = (0, react.useCallback)(() => {
				const seat = typeof document !== "undefined" ? document.querySelector("[data-composer-seat]") : null;
				if (seat === null || typeof window === "undefined") return;
				if (seat.style.position === "fixed") return; // already floating
				const dark = typeof document !== "undefined" && document.body !== void 0 && document.body.hasAttribute("data-ds-dark-theme");
				const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				const phase = seat.closest !== undefined ? seat.closest("[data-phase]")?.getAttribute("data-phase") ?? null : null;
				const hero = phase !== "active";
				// One unified floating window for both states: same initial size
				// (smaller than the page layout), centered on the seat's old spot.
				const rect = seat.getBoundingClientRect();
				const WIN_W = 440;
				const WIN_H = 480;
				const glass = hero
					? (dark ? "rgba(24,30,54,.72)" : "rgba(236,241,255,.68)")
					: (dark ? "rgba(28,32,48,.7)" : "rgba(255,255,255,.62)");
				// Home rect = where the window comes from and returns to. For a
				// live conversation that is the visible input card (plus the
				// composer root's padding); for the new-session welcome it is the
				// visible hero stack box. NEVER the seat's full-column box —
				// morphing to the full column is what stretched the window and
				// snapped at restore.
				const card = seat.querySelector("[data-composer-card]");
				const glow = seat.querySelector('svg[viewBox="0 0 1051 468"]');
				const heroStack = glow !== null && glow.parentElement !== null ? glow.parentElement : null;
				// Remember the chat scrollport's state before the seat leaves the
				// flow: ChatView's composer ResizeObserver re-pins the scroller
				// while the seat resizes, which otherwise shifts the history on
				// restore.
				const scroller = seat.closest !== undefined ? seat.closest("[data-conversation-scroll]") : null;
				if (scroller !== null) {
					chatScrollRef.current = {
						scrollTop: scroller.scrollTop,
						atBottom: scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1,
					};
				}
				let homeRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
				if (hero && heroStack !== null) {
					const sr = heroStack.getBoundingClientRect();
					homeRect = { left: sr.left, top: sr.top, width: sr.width, height: sr.height };
				} else if (!hero && card !== null) {
					const cardRect = card.getBoundingClientRect();
					const root = card.parentElement;
					const pad = root !== null ? getComputedStyle(root) : null;
					const padL = pad !== null ? (Number.parseFloat(pad.paddingLeft) || 0) : 16;
					const padR = pad !== null ? (Number.parseFloat(pad.paddingRight) || 0) : 16;
					const padB = pad !== null ? (Number.parseFloat(pad.paddingBottom) || 0) : 8;
					homeRect = {
						left: cardRect.left - padL,
						top: cardRect.top,
						width: cardRect.width + padL + padR,
						height: cardRect.height + padB,
					};
				}
				inputHomeRectRef.current = homeRect;
				// Step 1 — pin the seat at the home rect (no transition), so
				// nothing moves yet; the window chrome and content exist at the
				// input bar's own size.
				seat.style.setProperty("position", "fixed");
				seat.style.setProperty("left", `${homeRect.left}px`);
				seat.style.setProperty("top", `${homeRect.top}px`);
				seat.style.setProperty("width", `${homeRect.width}px`);
				seat.style.setProperty("height", `${homeRect.height}px`);
				seat.style.setProperty("z-index", "2147483000");
				seat.style.setProperty("background", "transparent");
				seat.style.setProperty("backdrop-filter", "blur(20px) saturate(170%)");
				seat.style.setProperty("-webkit-backdrop-filter", "blur(20px) saturate(170%)");
				seat.style.setProperty("transition", "none");
				seat.classList.add("dsh-tc-float");
				let header = null;
				if (hero) {
					// New session: the welcome content fills the window — the
					// headline acts as its title header (divider under it), the
					// workspace row and input sit at the bottom.
					seat.setAttribute("data-dsh-hero", "");
					if (heroStack !== null) {
						for (const key of ["background", "backdrop-filter", "-webkit-backdrop-filter", "border", "border-radius", "box-shadow", "padding", "align-self"]) {
							heroStack.style.removeProperty(key);
						}
						heroStack.style.setProperty("flex", "1");
						heroStack.style.setProperty("min-height", "0");
						heroStack.style.setProperty("padding", "0 16px");
						heroStack.style.setProperty("align-self", "stretch");
						heroStack.style.setProperty("justify-content", "flex-start");
					}
					if (glow !== null) glow.style.setProperty("opacity", "0");
					const shell = glow !== null && glow.nextElementSibling !== null ? glow.nextElementSibling : null;
					if (shell !== null) {
						shell.style.setProperty("width", "100%");
						shell.style.setProperty("height", "auto");
						shell.style.setProperty("flex", "1");
						shell.style.setProperty("justify-content", "flex-start");
						shell.style.setProperty("padding", "14px 0 12px");
						shell.style.setProperty("border-bottom", `1px solid ${dark ? "rgba(148,163,184,.2)" : "rgba(148,163,184,.25)"}`);
						shell.style.setProperty("margin-bottom", "10px");
						const headline = shell.firstElementChild !== null ? shell.firstElementChild.firstElementChild : null;
						if (headline !== null) {
							headline.style.setProperty("font-size", "15px");
							headline.style.setProperty("line-height", "22px");
							headline.style.setProperty("font-weight", "600");
							const fish = headline.firstElementChild !== null ? headline.firstElementChild.firstElementChild : null;
							if (fish !== null) {
								fish.style.setProperty("width", "20px");
								fish.style.setProperty("height", "20px");
							}
						}
					}
				} else {
					// Active session: a title bar (drag zone), the brief live
					// transcript, and the real input at the bottom — one window.
					header = document.createElement("div");
					header.className = "dsh-tc-headbar";
					header.textContent = "对话";
					seat.insertBefore(header, seat.firstChild);
					const transcript = document.createElement("div");
					transcript.className = "dsh-tc-transcript";
					seat.insertBefore(transcript, header.nextSibling);
					const renderTranscript = () => {
						if (document.hidden === true) return;
						const nodes = document.querySelectorAll("[data-chat-anchor-key]");
						const total = nodes.length;
						const brief = [];
						for (let index = Math.max(0, total - 6); index < total; index++) {
							const row = nodes[index];
							const kind = row.getAttribute("data-chat-flow-kind") ?? "text";
							const text = (row.textContent ?? "").replace(/\s+/g, " ").trim();
							if (text.length > 0) brief.push({ kind, text: text.length > 90 ? `${text.slice(0, 90)}…` : text });
						}
						transcript.textContent = "";
						if (brief.length === 0) {
							const empty = document.createElement("div");
							empty.className = "dsh-tc-msg-empty";
							empty.textContent = "发送消息后，这里会显示简略的对话";
							transcript.appendChild(empty);
							return;
						}
						for (const item of brief) {
							const rowEl = document.createElement("div");
							rowEl.className = `dsh-tc-msg ${item.kind === "user" ? "dsh-tc-msg-user" : item.kind === "assistant" ? "dsh-tc-msg-ai" : "dsh-tc-msg-sys"}`;
							const label = document.createElement("span");
							label.className = "dsh-tc-msg-label";
							label.textContent = item.kind === "user" ? "你" : item.kind === "assistant" ? "AI" : "系统";
							const textEl = document.createElement("span");
							textEl.className = "dsh-tc-msg-text";
							textEl.textContent = item.text;
							rowEl.append(label, textEl);
							transcript.appendChild(rowEl);
						}
						transcript.scrollTop = transcript.scrollHeight;
					};
					renderTranscript();
					const timer = setInterval(renderTranscript, 1500);
					transcriptRef.current = { el: transcript, timer, header };
				}
				// Step 2 — morph: grow from the input bar's original rect into the
				// unified floating window (and fade in the glass) while the page
				// flips. Reduced motion jumps straight to the window.
				const winLeft = Math.min(Math.max(8, rect.left + (rect.width - WIN_W) / 2), Math.max(8, window.innerWidth - WIN_W - 8));
				const winTop = Math.min(Math.max(8, rect.top + (rect.height - WIN_H) / 2), Math.max(8, window.innerHeight - WIN_H - 8));
				if (reduced) {
					seat.style.setProperty("left", `${winLeft}px`);
					seat.style.setProperty("top", `${winTop}px`);
					seat.style.setProperty("width", `${WIN_W}px`);
					seat.style.setProperty("height", `${WIN_H}px`);
					seat.style.setProperty("background", glass);
				} else {
					void seat.offsetWidth;
					seat.style.setProperty("transition", "left .55s cubic-bezier(.4,0,.2,1),top .55s cubic-bezier(.4,0,.2,1),width .55s cubic-bezier(.4,0,.2,1),height .55s cubic-bezier(.4,0,.2,1),background .45s ease");
					seat.style.setProperty("left", `${winLeft}px`);
					seat.style.setProperty("top", `${winTop}px`);
					seat.style.setProperty("width", `${WIN_W}px`);
					seat.style.setProperty("height", `${WIN_H}px`);
					seat.style.setProperty("background", glass);
				}
				// Gestures: drag by the top band (move), drag the bottom-right
				// corner (resize); both clamped to the viewport.
				let mode = null;
				let drag = null;
				let resize = null;
				const onPointerDown = (event) => {
					if (event.button !== 0) return;
					const box = seat.getBoundingClientRect();
					const inResize = event.clientX >= box.right - 18 && event.clientY >= box.bottom - 18;
					const inMove = event.clientY <= box.top + (hero ? 40 : 32);
					if (!inResize && !inMove) return;
					if (inResize) {
						mode = "resize";
						resize = { x: event.clientX, y: event.clientY, w: box.width, h: box.height };
					} else {
						mode = "move";
						drag = { dx: event.clientX - box.left, dy: event.clientY - box.top };
					}
					try { seat.setPointerCapture(event.pointerId); } catch { /* already released */ }
					event.preventDefault();
				};
				const onPointerMove = (event) => {
					if (mode === "move" && drag !== null) {
						const box = seat.getBoundingClientRect();
						const left = event.clientX - drag.dx;
						const top = event.clientY - drag.dy;
						const maxLeft = Math.max(8, window.innerWidth - box.width - 8);
						const maxTop = Math.max(8, window.innerHeight - box.height - 8);
						seat.style.setProperty("left", `${Math.min(Math.max(8, left), maxLeft)}px`);
						seat.style.setProperty("top", `${Math.min(Math.max(8, top), maxTop)}px`);
					} else if (mode === "resize" && resize !== null) {
						const w = Math.min(Math.max(320, resize.w + (event.clientX - resize.x)), Math.max(320, window.innerWidth - 24));
						const h = Math.min(Math.max(300, resize.h + (event.clientY - resize.y)), Math.max(300, window.innerHeight - 48));
						seat.style.setProperty("width", `${w}px`);
						seat.style.setProperty("height", `${h}px`);
					}
				};
				const onPointerUp = (event) => {
					if (mode === null) return;
					mode = null;
					drag = null;
					resize = null;
					try { seat.releasePointerCapture(event.pointerId); } catch { /* not captured */ }
				};
				seat.addEventListener("pointerdown", onPointerDown);
				seat.addEventListener("pointermove", onPointerMove);
				seat.addEventListener("pointerup", onPointerUp);
				inputDragRef.current = { seat, onPointerDown, onPointerMove, onPointerUp };
			}, []);
			/** Clear the floating styles and drag wiring (idempotent; safe to call any time). */
			const restoreInput = (0, react.useCallback)(() => {
				const wiring = inputDragRef.current;
				inputDragRef.current = null;
				if (wiring !== null && wiring.seat !== null) {
					wiring.seat.removeEventListener("pointerdown", wiring.onPointerDown);
					wiring.seat.removeEventListener("pointermove", wiring.onPointerMove);
					wiring.seat.removeEventListener("pointerup", wiring.onPointerUp);
				}
				const transcript = transcriptRef.current;
				transcriptRef.current = null;
				if (transcript !== null) {
					clearInterval(transcript.timer);
					transcript.el.remove();
					if (transcript.header !== null) transcript.header.remove();
				}
				const seat = typeof document !== "undefined" ? document.querySelector("[data-composer-seat]") : null;
				if (seat === null) return;
				seat.classList.remove("dsh-tc-float");
				seat.removeAttribute("data-dsh-hero");
				// New-session welcome: revert its restyled appearance SMOOTHLY —
				// set transitions, then drop the inline styles so the compact
				// window title grows back, the glow fades in and the layout
				// settles, instead of snapping.
				const glow = seat.querySelector('svg[viewBox="0 0 1051 468"]');
				const stack = glow !== null && glow.parentElement !== null ? glow.parentElement : null;
				const shell = glow !== null && glow.nextElementSibling !== null ? glow.nextElementSibling : null;
				const headline = shell !== null && shell.firstElementChild !== null ? shell.firstElementChild.firstElementChild : null;
				const fish = headline !== null && headline.firstElementChild !== null ? headline.firstElementChild.firstElementChild : null;
				const HERO_TR = "all .3s cubic-bezier(.25,.8,.25,1)";
				if (glow !== null) {
					glow.style.setProperty("transition", "opacity .3s ease");
					glow.style.setProperty("opacity", "1");
				}
				if (stack !== null) {
					stack.style.setProperty("transition", HERO_TR);
					for (const key of ["background", "backdrop-filter", "-webkit-backdrop-filter", "border", "border-radius", "box-shadow", "padding", "align-self", "flex", "min-height", "justify-content"]) {
						stack.style.removeProperty(key);
					}
				}
				if (shell !== null) {
					shell.style.setProperty("transition", HERO_TR);
					for (const key of ["width", "height", "padding", "border-bottom", "margin-bottom", "flex", "justify-content"]) {
						shell.style.removeProperty(key);
					}
				}
				if (headline !== null) {
					headline.style.setProperty("transition", HERO_TR);
					for (const key of ["font-size", "line-height", "font-weight"]) {
						headline.style.removeProperty(key);
					}
				}
				if (fish !== null) {
					fish.style.setProperty("transition", "width .3s ease,height .3s ease");
					fish.style.removeProperty("width");
					fish.style.removeProperty("height");
				}
				// Drop the hero transitions once the revert has settled.
				if (glow !== null || stack !== null || shell !== null || headline !== null || fish !== null) {
					setTimeout(() => {
						for (const el of [glow, stack, shell, headline, fish]) {
							if (el !== null) el.style.removeProperty("transition");
						}
					}, 380);
				}
				// Geometry + glass background first, while the seat's own
				// transition is still active (the background fades out instead of
				// snapping). The blur and the transition itself are dropped a
				// beat later, once the glass is gone — so the messages behind the
				// seat never pop from blurred to sharp at the very end.
				for (const key of ["position", "left", "top", "bottom", "width", "height", "z-index", "background", "transform", "opacity"]) {
					seat.style.removeProperty(key);
				}
				setTimeout(() => {
					seat.style.removeProperty("backdrop-filter");
					seat.style.removeProperty("-webkit-backdrop-filter");
					seat.style.removeProperty("transition");
				}, 420);
			}, []);
			/**
			 * Collect the page's rotatable surfaces: the frame's columns and
			 * handles, plus the conversation header and chat view — everything
			 * except the composer seat (it floats) and the overlay layer. Slot
			 * wrappers are display:contents (no box, transforms inert), so the
			 * real boxes are the wrapper's first child.
			 */
			const collectPageTargets = (0, react.useCallback)((frame) => {
				const targets = [];
				const centerCol = Array.from(frame.children).find((child) => child.querySelector("[data-composer-seat]") !== null);
				for (const child of Array.from(frame.children)) {
					if (child === centerCol || child.matches("[data-shell-overlay]")) continue;
					targets.push(child);
				}
				if (centerCol !== undefined) {
					const header = centerCol.querySelector("[data-slot='conversation.session.header']");
					if (header !== null && header.firstElementChild !== null) targets.push(header.firstElementChild);
					const session = centerCol.querySelector("[data-slot='conversation.session']");
					if (session !== null && session.firstElementChild !== null) targets.push(session.firstElementChild);
				}
				return targets;
			}, []);
			/** Rotate the page surfaces around the viewport center as one rigid front face (away = open flip). */
			const pageFlip = (0, react.useCallback)((away) => {
				const overlay = typeof document !== "undefined" ? document.querySelector("[data-shell-overlay]") : null;
				const frame = overlay !== null && overlay.parentElement !== null ? overlay.parentElement : null;
				if (frame === null || typeof window === "undefined") return;
				const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				const vw = window.innerWidth;
				const vh = window.innerHeight;
				for (const el of collectPageTargets(frame)) {
					const rect = el.getBoundingClientRect();
					el.style.setProperty("transform-origin", `${vw / 2 - rect.left}px ${vh / 2 - rect.top}px`);
					el.style.setProperty("backface-visibility", "hidden");
					el.style.setProperty("will-change", "transform");
					el.style.setProperty("pointer-events", "none");
					if (reduced) {
						el.style.setProperty("transition", "none");
						el.style.setProperty("transform", away ? "perspective(2200px) rotateY(180deg)" : "none");
						continue;
					}
					// Two-step inline transition: commit the start angle, then the
					// target, so the browser animates 0→180 (open) or 180→0 (close).
					// Inline styles survive React re-renders (class names do not).
					el.style.setProperty("transition", away ? "transform .85s cubic-bezier(.4,0,.2,1)" : "transform .65s cubic-bezier(.4,0,.2,1)");
					el.style.setProperty("transform", away ? "perspective(2200px) rotateY(0deg)" : "perspective(2200px) rotateY(180deg)");
					void el.offsetWidth;
					el.style.setProperty("transform", away ? "perspective(2200px) rotateY(180deg)" : "perspective(2200px) rotateY(0deg)");
				}
			}, [collectPageTargets]);
			/** Show/hide the rotated front face. Hiding it once the flip settles frees its compositor layers and layout. */
			const setPageTargetsVisibility = (0, react.useCallback)((visible) => {
				const overlay = typeof document !== "undefined" ? document.querySelector("[data-shell-overlay]") : null;
				const frame = overlay !== null && overlay.parentElement !== null ? overlay.parentElement : null;
				if (frame === null) return;
				for (const el of collectPageTargets(frame)) {
					if (visible) {
						el.style.removeProperty("visibility");
						el.style.removeProperty("content-visibility");
					} else {
						// Never cull a surface that hosts the floating composer.
						if (el.querySelector("[data-composer-seat]") !== null) continue;
						el.style.setProperty("visibility", "hidden");
						el.style.setProperty("content-visibility", "hidden");
					}
				}
			}, [collectPageTargets]);
			/** Remove the flip styles after the page is back. */
			const clearPageFlip = (0, react.useCallback)(() => {
				const overlay = typeof document !== "undefined" ? document.querySelector("[data-shell-overlay]") : null;
				const frame = overlay !== null && overlay.parentElement !== null ? overlay.parentElement : null;
				if (frame === null) return;
				for (const el of collectPageTargets(frame)) {
					for (const key of ["transform-origin", "backface-visibility", "will-change", "pointer-events", "transition", "transform", "visibility", "content-visibility"]) {
						el.style.removeProperty(key);
					}
				}
			}, [collectPageTargets]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				setOpening(true);
				const timer = setTimeout(() => {
					// The morph is done: drop the transition so dragging/resizing
					// stays instant.
					const seat = typeof document !== "undefined" ? document.querySelector("[data-composer-seat]") : null;
					if (seat !== null) seat.style.setProperty("transition", "none");
					setOpening(false);
					setSettled(true);
					setPageTargetsVisibility(false);
					if (pendingClose.current) {
						pendingClose.current = false;
						setClosing(true);
					}
				}, reduced ? 0 : 900);
				return () => {
					clearTimeout(timer);
					setOpening(false);
				};
			}, [open, setPageTargetsVisibility]);
			(0, react.useEffect)(() => {
				if (!closing) return;
				// Close: the window smoothly morphs back into the input bar's
				// original spot — the reverse of the open morph. The title bar
				// and transcript (added chrome) come off first so the shrinking
				// box holds only the input and never clips, and the final
				// restore lands on the same box — no snap.
				const seat = typeof document !== "undefined" ? document.querySelector("[data-composer-seat]") : null;
				const home = inputHomeRectRef.current;
				const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				const ui = transcriptRef.current;
				transcriptRef.current = null;
				if (ui !== null) {
					clearInterval(ui.timer);
					if (ui.header !== null) ui.header.remove();
					ui.el.remove();
				}
				if (seat !== null && home !== null && !reduced) {
					seat.style.setProperty("transition", "left .4s cubic-bezier(.25,.8,.25,1),top .4s cubic-bezier(.25,.8,.25,1),width .4s cubic-bezier(.25,.8,.25,1),height .4s cubic-bezier(.25,.8,.25,1),background .35s ease");
					seat.style.setProperty("left", `${home.left}px`);
					seat.style.setProperty("top", `${home.top}px`);
					seat.style.setProperty("width", `${home.width}px`);
					seat.style.setProperty("height", `${home.height}px`);
					seat.style.setProperty("background", "transparent");
				}
				const timer = setTimeout(() => {
					// The composer re-enters the flow during restore, and
					// ChatView's pinned-follow writes scrollTop directly. Put the
					// scrollport in smooth-behavior mode around that so every
					// programmatic scroll (including the follow) glides; drop it
					// once the glide has landed.
					const seatNow = typeof document !== "undefined" ? document.querySelector("[data-composer-seat]") : null;
					const scroller = seatNow !== null && seatNow.closest !== undefined ? seatNow.closest("[data-conversation-scroll]") : null;
					if (scroller !== null && !reduced) scroller.style.scrollBehavior = "smooth";
					restoreInput();
					const saved = chatScrollRef.current;
					chatScrollRef.current = null;
					if (saved !== null && scroller !== null) {
						scroller.scrollTo({ top: saved.atBottom ? scroller.scrollHeight : saved.scrollTop, behavior: reduced ? "auto" : "smooth" });
					}
					if (scroller !== null && !reduced) {
						setTimeout(() => { scroller.style.removeProperty("scroll-behavior"); }, 450);
					}
					inputHomeRectRef.current = null;
					setOpen(false);
					setClosing(false);
				}, reduced ? 0 : 460);
				return () => clearTimeout(timer);
			}, [closing, restoreInput]);
			/** Defensive: if this occupant ever unmounts while the seat is floating, put it back and drop the z-boost. */
			(0, react.useEffect)(() => () => {
				restoreInput();
				setPageTargetsVisibility(true);
				if (typeof document !== "undefined" && document.body !== void 0) {
					document.body.classList.remove("dsh-tc-open");
				}
			}, [restoreInput, setPageTargetsVisibility]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onKeyDown = (event) => {
					if (event.key === "Escape") requestClose();
				};
				document.addEventListener("keydown", onKeyDown);
				return () => document.removeEventListener("keydown", onKeyDown);
			}, [open, requestClose]);
			/**
			 * The page flip: rotate the frame's surfaces (columns, handles,
			 * conversation header and chat view) around the viewport center with
			 * the same animation the workbench card uses, so front and back stay
			 * one rigid body. The frame itself must NOT be transformed — that
			 * would turn the composer seat's fixed positioning into frame-relative
			 * and carry the input away with the page. The input floats via its own
			 * fixed styles instead, above the workbench card.
			 */
			(0, react.useLayoutEffect)(() => {
				if (open) {
					// While the board is open, body-level portaled menus/overlays
					// (workspace picker, command menu, …) get a z-index boost so
					// the board card cannot bury them (their own z-index is ~100).
					if (typeof document !== "undefined" && document.body !== void 0) {
						document.body.classList.add("dsh-tc-open");
					}
					if (!closing) {
						pageFlip(true);
						moveInputFloating();
					} else {
						// The front face comes back before it rotates into view again.
						setPageTargetsVisibility(true);
						pageFlip(false);
					}
				} else {
					clearPageFlip();
					if (typeof document !== "undefined" && document.body !== void 0) {
						document.body.classList.remove("dsh-tc-open");
					}
				}
			}, [open, closing, pageFlip, moveInputFloating, clearPageFlip, setPageTargetsVisibility]);
			/**
			 * Both the flip card and the toggle are portaled to body with
			 * React's createPortal: the card must leave the (flattened) frame
			 * to stand in 3D, and the toggle must stay a fixed, always-clickable
			 * control — inside the rotating frame its own compositor layer
			 * survives the frame's backface hide, but its pointer events get
			 * entangled with the frame's transform. At body level it is
			 * permanently visible at the bottom-right so the user can flip back
			 * and forth freely.
			 */
			const portalTarget = typeof document !== "undefined" && document.body !== void 0 ? document.body : null;
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				portalTarget !== null ? (0, react_dom.createPortal)((0, react_jsx_runtime.jsx)(TaskFlipToggle, { open, onFlip: flip }), portalTarget) : null,
				(open || closing) && portalTarget !== null ? (0, react_dom.createPortal)((0, react_jsx_runtime.jsx)("div", {
					className: "dsh-tc-flip",
					"data-closing": closing || void 0,
					"data-settled": settled || void 0,
					children: (0, react_jsx_runtime.jsx)(TaskBackPanel, { useSessions, onClose: requestClose, plugins: taskPluginsPort })
				}), portalTarget) : null
			] });
		}
		//#endregion
		//#region plugin entry
		/** Required services: slots (shell.overlay), remote, and the nested dynamic Cordis runner service. */
		const inject = ["slots", "remote", "remote.dynamicCordisRunner"];
		/**
		 * Client plugin body: register the task console as a shell.overlay
		 * occupant (additive, click-through until opted in) and build the
		 * plugin-management port over the frame-wide dynamic Cordis inventory.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			startTaskCardWatcher();
			const stopCanvasCrossTab = startCanvasCrossTab();
			setTaskCardChatSender((text) => taskChatPromptViaSessions(ctx, text));
			setTaskCardAgentRefactor(createTaskCardAgentBridge(ctx));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "task-console",
				order: 100,
				label: "任务控制台"
			}, TaskConsoleRoot));
			// Plugin-management port: entirely optional. Any failure here — an
			// absent remote, a missing runner, an unknown event, a bad RPC
			// envelope — degrades the card to "服务不可用" and can never break
			// the console itself.
			let dispose = null;
			try {
				const remote = ctx.get("remote");
				const runner = remote === void 0 ? void 0 : remote.dynamicCordisRunner;
				if (runner === void 0) return null;
				const listeners = new Set();
				let inFlight = null;
				const read = () => {
					if (inFlight !== null) return inFlight;
					inFlight = runner.inventory().then((answered) => {
						inFlight = null;
						if (!answered || !answered.ok) {
							const code = answered && answered.error ? answered.error.code : "unknown";
							const message = answered && answered.error ? answered.error.message : "读取插件清单失败";
							throw new Error(`${code}: ${message}`);
						}
						return Array.isArray(answered.value) ? answered.value : [];
					}, (err) => {
						inFlight = null;
						throw err;
					});
					return inFlight;
				};
				const refresh = () => {
					read().then(() => {
						for (const fn of [...listeners]) fn();
					}).catch(() => {
						for (const fn of [...listeners]) fn();
					});
				};
				const disposers = [];
				if (typeof remote.$on === "function") {
					for (const name of ["cordis/dynamic-package", "cordis/dynamic-retract", "cordis/request-run", "cordis/request-run-resolved"]) {
						try {
							const off = remote.$on(name, refresh);
							if (typeof off === "function") disposers.push(off);
						} catch {
							/* the event may be unavailable — the manual refresh still works */
						}
					}
				}
				taskPluginsPort = {
					read,
					refresh,
					subscribe: (fn) => {
						listeners.add(fn);
						return () => { listeners.delete(fn); };
					},
					stop: async (agentId, pluginId) => {
						const answered = await runner.stopFromPanel(agentId, pluginId);
						if (!answered.ok) return { ok: false, message: `${answered.error.code}: ${answered.error.message}` };
						if (answered.value.ok || answered.value.reason === "not-running") return { ok: true };
						return { ok: false, message: answered.value.message };
					},
					remove: async (agentId, pluginId) => {
						const answered = await runner.undefineFromPanel(agentId, pluginId);
						if (!answered.ok) return { ok: false, message: `${answered.error.code}: ${answered.error.message}` };
						return answered.value.ok ? { ok: true } : { ok: false, message: answered.value.message };
					}
				};
				dispose = () => {
					for (const off of disposers) {
						try { off(); } catch { /* ignore */ }
					}
				};
			} catch {
				taskPluginsPort = null;
			}
			const finalize = () => {
				if (typeof dispose === "function") dispose();
				setTaskCardChatSender(null);
				setTaskCardAgentRefactor(null);
				canvasSync.disconnect();
				stopCanvasCrossTab();
				stopTaskCardWatcher();
			};
			return finalize;
		}
		//#endregion
		/* test hooks (harmless exports used by smoke.mjs) */
		exports.__dshTestHooks = { TaskConsoleRoot, TaskBackPanel, TaskCard, TaskFlipToggle, TaskUserBody, TaskBlockView, TaskCardChat, TaskCardEditor, TaskCardFullscreen, TaskCanvasView, TaskDiagramDock, TaskEmbedView, taskDiagramHtml, taskDiagramWidthClamp, TASK_DIAGRAM_SHA256, cleanTaskEmbedUrl, taskEmbedHost, taskEmbedIsSameOrigin, clampTaskEmbedHeight, patchTaskEmbedHeight, taskEditorBlocks, TASK_EMBED_LIMIT, TASK_EMBED_SANDBOX, TASK_EMBED_SANDBOX_OPAQUE, TASK_BLOCK_KINDS, isTaskChatTextKind, assistantTextOfBlocks, assistantTextOfChunk, latestTaskAssistantText, latestTaskEventSeq, taskSeedCarriesPendingWork, taskWindowPromptFacts, taskSessionSnapshot, purgeTaskSessionQueue, waitTaskSessionIdle, taskTempCreateOptions, composeTaskCardChatPrompt, currentTaskSessionId, createTaskTempSession, createTaskBlankSession, openTaskChildSession, createTaskCardAgentBridge, canvasSnapshot, canvasCreate, canvasPublishCard, canvasOpenInstance, canvasInstanceId, isCanvasInstance, canvasDuplicateCard, canvasAddControl, canvasSetBare, canvasUpdateControl, isBareCandidate, taskBlockDefault, TASK_CANVAS_ADD_KINDS, CanvasControlView, TaskBlockQuickEdit, canvasSendToBoard, canvasExplodeBlocks, canvasRebuildInstance, canvasUnbindCard, canvasWriteBackBlock, canvasRemoveBoundBlock, canvasSyncBlockOrder, canvasSyncInstanceWithCard, syncTaskCardInstance, canvasPushBinding, canvasCardBinding, stampTaskCardBlocks, estimateTaskBlockHeight, taskBlockLabel, snapshotTaskCards, sanitizeCanvasCard, canvasUpsertCard, canvasDeleteCard, canvasSetActive, canvasRename, canvasJoinShare, canvasShareString, canvasApplySpec, canvasCopyCard, canvasCardFromEditor, mergeCanvasCard, mergeCanvasState, sanitizeCanvas, sanitizeCanvasState, encodeCanvasShare, decodeCanvasShare, freshTaskCards, loadTaskCards, saveTaskCards, fmtTaskDuration, taskJobDot, orderedTaskJobs, parseTaskCardSpec, sanitizeTaskButton, sanitizeTaskBlocks, sanitizeTaskStyle, nextUserTaskCardId, builtinTaskCardIds, cascadeTaskCardSpot, applyTaskCardSpec };
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});


