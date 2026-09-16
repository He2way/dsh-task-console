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
			".dsh-tc-canvasCollab{flex:none;display:flex;flex-direction:column;gap:8px;padding:10px 14px;border-bottom:1px solid rgba(148,163,184,.2);background:rgba(255,255,255,.4)}",
			".dsh-tc-panel[data-theme=dark] .dsh-tc-canvasCollab{background:rgba(255,255,255,.05)}",
			".dsh-tc-canvasCollabRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".dsh-tc-canvasScroll{position:relative;flex:1;min-height:0;overflow:hidden;cursor:grab;background-image:radial-gradient(rgba(148,163,184,.32) 1px,transparent 1px);background-size:24px 24px;background-position:0 0}",
			".dsh-tc-canvasScroll:active{cursor:grabbing}",
			".dsh-tc-canvasPlane{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}",
			".dsh-tc-card.dsh-tc-canvasCard{width:320px}",
			".dsh-tc-canvasEmpty{position:absolute;left:40px;top:40px;font-size:12px;color:var(--dsw-alias-label-tertiary)}",
			".dsh-tc-imgWrap{margin:0;display:flex;flex-direction:column;gap:3px;min-width:0}",
			".dsh-tc-img{display:block;width:100%;height:auto;border-radius:10px}",
			".dsh-tc-imgCap{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}"
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
		const TASK_BLOCK_KINDS = ["text", "heading", "note", "stats", "progress", "trend", "kv", "links", "chips", "checklist", "counter", "button", "table", "code", "toggle", "countdown", "bars"];
		const TASK_WIDGET_TEXT_LIMIT = 4000;
		function cleanTaskBlockText(value, limit) {
			return typeof value === "string" ? value.slice(0, limit) : "";
		}
		/** Stable scope key for one block's interactive state (the card.widgets map). */
		function taskBlockScope(block, index) {
			if (block !== null && typeof block === "object" && typeof block.key === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(block.key)) return block.key;
			return "b" + index;
		}
		/**
		 * Validate one control block into its persisted shape. Unknown kinds are
		 * kept as an explicit unsupported placeholder so a conversation never
		 * silently loses content.
		 */
		function sanitizeTaskBlock(raw, index) {
			if (raw === null || typeof raw !== "object") return null;
			const kind = typeof raw.kind === "string" ? raw.kind : "";
			const key = typeof raw.key === "string" && /^[A-Za-z0-9._:-]{1,64}$/.test(raw.key.trim()) ? raw.key.trim() : void 0;
			const base = key !== void 0 ? { key } : {};
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
				return { ok: true, op: "upsert", id: key, created: false };
			}
			const id = key !== null ? key : nextUserTaskCardId();
			const spot = cascadeTaskCardSpot(cards);
			const entry = sanitizeTaskCardEntry({ x: spot.x, y: spot.y, title: spec.title, blocks: spec.blocks, style: spec.style, pinned: spec.pinned, createdAt: nowTs, updatedAt: nowTs });
			const nextCards = { ...cards, [id]: entry };
			const nextOrder = order.indexOf(id) === -1 ? [...order, id] : order;
			publishTaskCards(nextCards, nextOrder);
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
		/** Render one declarative control block authored by the conversation. */
		function TaskBlockView(props) {
			const { block, scope, value, onWidget, onRun, feedbackText } = props;
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
			const { card, onWidget, onWidgetState, cardId } = props;
			/** Stable callbacks keep the memoized body from re-rendering with the whole board. */
			const widgetSink = onWidgetState !== void 0 ? (scope, value) => onWidgetState(cardId, scope, value) : onWidget;
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
			return (0, react_jsx_runtime.jsx)("div", {
				className: "dsh-tc-blocks",
				children: blocks.map((block, index) => {
					const scope = taskBlockScope(block, index);
					return (0, react_jsx_runtime.jsx)(TaskBlockView, {
						block,
						scope,
						value: readTaskWidgetValue(widgets, scope, block.kind === "counter" ? 0 : block.kind === "toggle" ? block.value === true : {}),
						feedbackText: feedback[scope] !== void 0 ? feedback[scope] : null,
						onWidget: widgetSink,
						onRun: runAction
					}, scope + "#" + index);
				})
			});
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
			const [title, setTitle] = (0, react.useState)(initial !== null && typeof initial.title === "string" ? initial.title : "");
			const [body, setBody] = (0, react.useState)(editorTextBlock !== void 0 && typeof editorTextBlock.text === "string" ? editorTextBlock.text : "");
			const [pinned, setPinned] = (0, react.useState)(initial !== null && initial.pinned === true);
			const [buttons, setButtons] = (0, react.useState)(() => editorButtonBlocks.map((block) => ({
				action: block.action === "link" ? "link" : block.action === "fill" ? "fill" : "copy",
				label: typeof block.label === "string" ? block.label : "",
				value: typeof block.value === "string" ? block.value : ""
			})));
			const [error, setError] = (0, react.useState)(null);
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
				const trimmed = title.trim();
				onSave({
					title: (trimmed.length > 0 ? trimmed : "未命名卡片").slice(0, TASK_TITLE_LIMIT),
					body: body.slice(0, TASK_BODY_LIMIT),
					pinned,
					buttons: clean
				});
			};
			return (0, react_jsx_runtime.jsxs)("div", {
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
				"可用控件 kind 与字段：" + TASK_BLOCK_KINDS.join(" / ") + "（text/heading/note：{ text }；stats：{ items: [{ label, value }] }；progress：{ label?, value, max?, unit? }；kv：{ rows: [[键, 值], …] }；links：{ items: [{ label?, url }] }；chips：{ items: [\"标签\", …] }；trend：{ label?, unit?, values: [数字…] } 或 points: [{ label?, value }]；table：{ columns: [表头…], rows: [[单元格…]] }；code：{ language?, text }；toggle：{ key, label, value? }；countdown：{ label?, until: ISO 时间或毫秒时间戳, done? }；bars：{ label?, items: [{ label, value }] }）。字段缺失或写错的控件会被丢弃，所以请按上面的字段名书写；checklist / counter / toggle 等交互控件请带稳定 key。"
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
		/** Build canvas-card content from the manual editor result (keeps AI-authored controls). */
		function canvasCardFromEditor(prev, content) {
			const preserved = [];
			for (const block of effectiveTaskBlocks(prev)) {
				if (block.kind === "text" || block.kind === "button" || block.kind === "image") continue;
				preserved.push(block);
			}
			const blocks = [];
			const text = typeof content.body === "string" ? content.body.trim() : "";
			if (text.length > 0) {
				const textBlock = sanitizeTaskBlock({ kind: "text", text }, 0);
				if (textBlock !== null) blocks.push(textBlock);
			}
			for (const button of Array.isArray(content.buttons) ? content.buttons : []) {
				const buttonBlock = sanitizeTaskBlock({ kind: "button", action: button.action, label: button.label, value: button.value }, blocks.length);
				if (buttonBlock !== null) blocks.push(buttonBlock);
			}
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
			if (targetId === null || state.canvases[targetId] === void 0) {
				const canvas = canvasCreate("分享画布");
				state = canvasSnapshot();
				targetId = canvas.id;
			}
			const canvas = state.canvases[targetId];
			const view = state.views[targetId] ?? { x: 40, y: 40, k: 1 };
			const offset = Object.keys(canvas.cards).length;
			const card = canvasCopyCard(source, -view.x / view.k + 60 + (offset % 4) * 40, -view.y / view.k + 60 + Math.floor(offset / 4) * 40);
			const next = {
				...state,
				activeId: targetId,
				canvases: { ...state.canvases, [targetId]: { ...canvas, cards: { ...canvas.cards, [card.id]: card }, updatedAt: Date.now() } }
			};
			publishCanvasState(next, false);
			canvasSync.sendOp({ kind: "card.upsert", canvasId: targetId, card });
			return { canvasId: targetId, cardId: card.id };
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
		/** One canvas card: drag/resize in world coordinates, edit or refactor through the existing pipelines. */
		function CanvasCardView(props) {
			const { card, scale, onMove, onResize, onEdit, onChat, onDelete, onWidgetState } = props;
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
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "对话重构卡片", onPointerDown: (event) => event.stopPropagation(), onClick: () => onChat(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "💬" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn", title: "手动编辑", onPointerDown: (event) => event.stopPropagation(), onClick: () => onEdit(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "✎" }) }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-cardIconBtn dsh-tc-iconDanger", title: "从画布删除", onPointerDown: (event) => event.stopPropagation(), onClick: () => onDelete(card.id), children: (0, react_jsx_runtime.jsx)("span", { children: "🗑" }) })
						]
					}),
					(0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-cardBody", children: (0, react_jsx_runtime.jsx)(TaskUserBodyView, { card, cardId: card.id, onWidgetState }) }),
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
			const { onClose } = props;
			const [state, setState] = (0, react.useState)(() => canvasSnapshot());
			const [editingId, setEditingId] = (0, react.useState)(null);
			const [chatId, setChatId] = (0, react.useState)(null);
			const [collabOpen, setCollabOpen] = (0, react.useState)(false);
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
			(0, react.useEffect)(() => {
				if (typeof document === "undefined") return;
				const onKey = (event) => {
					if (event.key !== "Escape") return;
					if (editingId !== null || chatId !== null || collabOpen) return;
					event.stopPropagation();
					event.preventDefault();
					onClose();
				};
				document.addEventListener("keydown", onKey, true);
				return () => document.removeEventListener("keydown", onKey);
			}, [editingId, chatId, collabOpen, onClose]);
			const canvas = activeCanvas(state);
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
			/** Paste or drop an image: downscale it and publish an image card at the drop point. */
			const addImageFile = (file, clientX, clientY) => {
				if (file === null || typeof file !== "object" || typeof file.type !== "string" || !file.type.startsWith("image/")) return;
				const point = worldPoint(clientX, clientY);
				canvasImageDataUrl(file, (dataUrl) => {
					if (dataUrl === null) { setHint("图片无法读取或过大，未添加"); return; }
					if (dataUrl.length > CANVAS_IMAGE_LIMIT) { setHint("图片过大（超过 " + Math.round(CANVAS_IMAGE_LIMIT / 1024) + "KB 数据），未添加"); return; }
					if (canvasId === null) return;
					const nowTs = Date.now();
					const card = {
						id: nextCanvasCardId(),
						title: file.name !== void 0 && file.name.length > 0 ? String(file.name).slice(0, TASK_TITLE_LIMIT) : "图片",
						x: Math.round(point.x),
						y: Math.round(point.y),
						updatedAt: nowTs,
						rev: canvasClientId + ":" + nowTs.toString(36),
						blocks: [{ kind: "image", src: dataUrl }]
					};
					canvasUpsertCard(canvasId, card, dataUrl.length <= CANVAS_SYNC_LIMIT);
					setHint(dataUrl.length <= CANVAS_SYNC_LIMIT ? "已添加图片卡片" : "已添加图片卡片（超过同步上限，仅在本地）");
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
			const chattingCard = chatId !== null && canvas !== null && canvas.cards[chatId] !== void 0 ? canvas.cards[chatId] : null;
			const peers = canvasSync.peers;
			const share = canvasShareString();
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-tc-canvasView",
				onPaste,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: "dsh-tc-canvasBar",
						children: [
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-canvasBarTitle", children: "无限画布" }),
							canvas !== null && (0, react_jsx_runtime.jsx)("input", {
								className: "dsh-tc-in dsh-tc-canvasName",
								value: canvas.name,
								maxLength: 40,
								onChange: (event) => canvasRename(canvas.id, event.target.value)
							}),
							(0, react_jsx_runtime.jsx)("select", {
								className: "dsh-tc-editAction",
								value: canvasId ?? "",
								onChange: (event) => canvasSetActive(event.target.value),
								children: Object.values(state.canvases).map((item) => (0, react_jsx_runtime.jsx)("option", { value: item.id, children: item.name }, item.id))
							}),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => { const created = canvasCreate("新画布"); setHint("已创建「" + created.name + "」"); }, children: "+ 新画布" }),
							canvas !== null && (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => canvasDelete(canvas.id), children: "删除画布" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-boardSpacer" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-canvasSync", title: canvasSync.detail ?? "", children: canvasSync.status === "online" ? "已连接" : canvasSync.status === "connecting" ? "连接中…" : "未连接" }),
							(0, react_jsx_runtime.jsx)("span", { className: "dsh-tc-canvasZoom", children: Math.round(view.k * 100) + "%" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => { if (canvasId !== null) { canvasSetView(canvasId, { x: 40, y: 40, k: 1 }); setHint("视图已复位"); } }, children: "复位视图" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: () => { void copyTaskText(share ?? "").then((ok) => setHint(ok ? "分享串已复制，发给别人粘贴加入" : "复制失败")); }, children: "复制分享串" }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn" + (collabOpen ? " dsh-tc-iconOn" : ""), onClick: () => setCollabOpen((value) => !value), children: "协作" + (peers.length > 0 ? " · " + peers.length + " 人在线" : "") }),
							(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dsh-tc-btn", onClick: onClose, children: "关闭画布" })
						]
					}),
					hint !== null && (0, react_jsx_runtime.jsx)("div", { className: "dsh-tc-canvasHint", children: hint }),
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
								: Object.values(canvas.cards).map((card) => (0, react_jsx_runtime.jsx)(CanvasCardView, {
									card,
									scale: view.k,
									onMove: (id, x, y) => { const current = canvas.cards[id]; if (current !== void 0) canvasUpsertCard(canvasId, { ...current, x, y }, true); },
									onResize: (id, w, h) => { const current = canvas.cards[id]; if (current !== void 0) canvasUpsertCard(canvasId, { ...current, w, h }, true); },
									onEdit: (id) => { setChatId(null); setEditingId(id); },
									onChat: (id) => { setEditingId(null); setChatId(id); },
									onDelete: (id) => canvasDeleteCard(canvasId, id),
									onWidgetState: (id, scope, value) => {
										const current = canvas.cards[id];
										if (current === void 0) return;
										const widgets = current.widgets !== null && typeof current.widgets === "object" ? { ...current.widgets } : {};
										widgets[scope] = value;
										canvasUpsertCard(canvasId, { ...current, widgets }, true);
									}
								}, card.id))
						})
					}),
					editingCard !== null && (0, react_jsx_runtime.jsx)(TaskCardEditor, {
						initial: editingCard,
						onCancel: () => setEditingId(null),
						onSave: (content) => {
							canvasUpsertCard(canvasId, canvasCardFromEditor(editingCard, content), true);
							setEditingId(null);
						}
					}),
					chattingCard !== null && (0, react_jsx_runtime.jsx)(TaskCardChat, {
						card: { ...chattingCard, id: chattingCard.id },
						onClose: () => setChatId(null),
						applySpec: (spec) => canvasApplySpec(canvasId, chattingCard, spec)
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
			const [confirmDeleteId, setConfirmDeleteId] = (0, react.useState)(null);
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
			}, []);
			/** Raise one card to the front of the stacking order. */
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
							if (block.kind === "text" || block.kind === "button") continue;
							preserved.push(block);
						}
					}
					const next = [];
					const text = typeof content.body === "string" ? content.body.trim() : "";
					if (text.length > 0) {
						const textBlock = sanitizeTaskBlock({ kind: "text", text }, 0);
						if (textBlock !== null) next.push(textBlock);
					}
					for (const button of Array.isArray(content.buttons) ? content.buttons : []) {
						const buttonBlock = sanitizeTaskBlock({ kind: "button", action: button.action, label: button.label, value: button.value }, next.length);
						if (buttonBlock !== null) next.push(buttonBlock);
					}
					return [...next, ...preserved];
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
								const layout = state.cards[id];
								if (layout === void 0 || layout.hidden) return null;
								const zIndex = 10 + state.order.indexOf(id);
								let title = id;
								let badge;
								let body;
								let actions;
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
									body = (0, react_jsx_runtime.jsx)(TaskUserBodyView, { card: layout, cardId: id, onWidgetState: setWidgetState });
								} else {
									title = "工作区";
									body = (0, react_jsx_runtime.jsx)(TaskWorkspaceBodyView, { summary, current, updatedAt: summary?.updatedAt ?? 0 });
								}
								const isUser = isUserTaskCard(layout);
								const confirming = confirmDeleteId === id;
								actions = [
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
								return (0, react_jsx_runtime.jsx)(TaskCard, {
									id,
									title,
									badge,
									layout,
									zIndex,
									boardRef,
									actions,
									onDragCommit,
									onResizeCommit,
									children: body
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
							canvasOpen && (0, react_jsx_runtime.jsx)(TaskCanvasView, { onClose: () => setCanvasOpen(false) })
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
					(0, react_jsx_runtime.jsx)("span", { key: "icon", className: "dsh-tc-toggleIcon", children: open ? "◀" : "⇄" }),
					(0, react_jsx_runtime.jsx)("span", { key: "label", children: open ? "返回正面" : "任务台" })
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
		exports.__dshTestHooks = { TaskConsoleRoot, TaskBackPanel, TaskCard, TaskFlipToggle, TaskUserBody, TaskBlockView, TaskCardChat, TaskCanvasView, isTaskChatTextKind, assistantTextOfBlocks, assistantTextOfChunk, latestTaskAssistantText, latestTaskEventSeq, taskSeedCarriesPendingWork, taskWindowPromptFacts, taskSessionSnapshot, purgeTaskSessionQueue, waitTaskSessionIdle, taskTempCreateOptions, composeTaskCardChatPrompt, currentTaskSessionId, createTaskTempSession, createTaskBlankSession, openTaskChildSession, createTaskCardAgentBridge, canvasSnapshot, canvasCreate, canvasPublishCard, canvasUpsertCard, canvasDeleteCard, canvasSetActive, canvasRename, canvasJoinShare, canvasShareString, canvasApplySpec, canvasCopyCard, canvasCardFromEditor, mergeCanvasCard, mergeCanvasState, sanitizeCanvas, sanitizeCanvasState, encodeCanvasShare, decodeCanvasShare, freshTaskCards, loadTaskCards, saveTaskCards, fmtTaskDuration, taskJobDot, orderedTaskJobs, parseTaskCardSpec, sanitizeTaskButton, nextUserTaskCardId, builtinTaskCardIds, cascadeTaskCardSpot, applyTaskCardSpec };
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});


