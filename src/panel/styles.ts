export const panelStyles = `
/* ═══════════════════════════════════════════════
   Ralph Mission Control — Design System
   ═══════════════════════════════════════════════ */
:root {
  /* Background Depth */
  --bg-deep:    #090B10;
  --bg:         #0D1017;
  --bg-surface: rgba(255,255,255,0.025);
  --bg-raised:  rgba(255,255,255,0.04);
  --bg-hover:   rgba(255,255,255,0.06);

  /* Glass */
  --glass-border: rgba(255,255,255,0.07);
  --glass-border-bright: rgba(255,255,255,0.13);
  --glass-blur: 20px;
  --glass-shadow: 0 4px 24px rgba(0,0,0,0.35);

  /* Text */
  --text:       #E2E8F0;
  --text-dim:   #94A3B8;
  --text-muted: #64748B;

  /* Accents */
  --cyan:       #22D3EE;
  --cyan-dim:   rgba(34,211,238,0.12);
  --cyan-glow:  rgba(34,211,238,0.25);
  --blue:       #6366F1;
  --blue-dim:   rgba(99,102,241,0.12);
  --amber:      #F59E0B;
  --amber-dim:  rgba(245,158,11,0.10);
  --amber-glow: rgba(245,158,11,0.20);
  --emerald:    #10B981;
  --emerald-dim:rgba(16,185,129,0.10);
  --red:        #EF4444;
  --red-dim:    rgba(239,68,68,0.10);
  --orange:     #F97316;

  /* Radii */
  --r:   8px;
  --r-md:12px;
  --r-lg:16px;

  /* Fonts */
  --sans: 'Inter', -apple-system, 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  --mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  --ease: cubic-bezier(.4,0,.2,1);
}

/* Reset */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{height:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{min-height:100%;background:var(--bg-deep);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.6}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
input,textarea,select{font-family:inherit;color:inherit}
a{color:var(--cyan);text-decoration:none}

/* Subtle background gradient */
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,0.06) 0%,transparent 60%),
             radial-gradient(ellipse 60% 40% at 80% 100%,rgba(34,211,238,0.04) 0%,transparent 50%)}

/* ═══ LAYOUT ═══ */
.app{position:relative;z-index:1;min-height:100vh;display:flex;flex-direction:column}

/* Top bar */
.topbar{display:flex;align-items:center;gap:14px;padding:14px 24px;backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur));background:var(--bg-surface);border-bottom:1px solid var(--glass-border)}
.topbar-logo{font-weight:800;font-size:1.1rem;letter-spacing:-.04em;background:linear-gradient(135deg,var(--cyan),var(--blue));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.topbar-spacer{flex:1}
.topbar-actions{display:flex;gap:6px}

/* Status pill */
.pill{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:999px;font-size:.7rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;border:1px solid transparent}
.pill .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.pill-idle{color:var(--text-muted);background:rgba(255,255,255,0.03);border-color:var(--glass-border)}.pill-idle .dot{background:var(--text-muted)}
.pill-running{color:var(--cyan);background:var(--cyan-dim);border-color:rgba(34,211,238,.15)}.pill-running .dot{background:var(--cyan);box-shadow:0 0 10px var(--cyan-glow);animation:pulse 2s ease-in-out infinite}
.pill-paused{color:var(--amber);background:var(--amber-dim);border-color:rgba(245,158,11,.15)}.pill-paused .dot{background:var(--amber);box-shadow:0 0 8px var(--amber-glow)}
.pill-error{color:var(--red);background:var(--red-dim);border-color:rgba(239,68,68,.15)}.pill-error .dot{background:var(--red)}
.pill-done{color:var(--emerald);background:var(--emerald-dim);border-color:rgba(16,185,129,.15)}.pill-done .dot{background:var(--emerald)}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.85)}}

/* Grid */
.grid{display:grid;grid-template-columns:1fr 380px;gap:20px;padding:20px 24px;flex:1;align-items:start}
@media(max-width:960px){.grid{grid-template-columns:1fr;gap:16px;padding:16px}}

/* Glass Panel */
.panel{background:var(--bg-surface);backdrop-filter:blur(var(--glass-blur));-webkit-backdrop-filter:blur(var(--glass-blur));border:1px solid var(--glass-border);border-radius:var(--r-lg);box-shadow:var(--glass-shadow);overflow:hidden;transition:border-color .2s var(--ease)}
.panel:hover{border-color:var(--glass-border-bright)}
.panel-pad{padding:20px}
.panel-head{padding:14px 20px;border-bottom:1px solid var(--glass-border);display:flex;align-items:center;justify-content:space-between}
.panel-title{font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted)}

/* ═══ BUTTONS ═══ */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 18px;font-size:.8rem;font-weight:600;border-radius:var(--r);transition:all .15s var(--ease);white-space:nowrap;border:1px solid transparent}
.btn:hover:not(:disabled){transform:translateY(-1px)}.btn:active:not(:disabled){transform:translateY(0)}.btn:disabled{opacity:.3;cursor:not-allowed;transform:none}
.btn-cyan{background:linear-gradient(135deg,var(--cyan),var(--blue));color:#fff;border:none;box-shadow:0 2px 12px rgba(34,211,238,.2)}.btn-cyan:hover:not(:disabled){box-shadow:0 4px 20px rgba(34,211,238,.35)}
.btn-ghost{background:var(--bg-raised);border-color:var(--glass-border);color:var(--text-dim)}.btn-ghost:hover:not(:disabled){background:var(--bg-hover);color:var(--text);border-color:var(--glass-border-bright)}
.btn-amber{background:var(--amber-dim);color:var(--amber);border-color:rgba(245,158,11,.15)}.btn-amber:hover:not(:disabled){background:rgba(245,158,11,.18)}
.btn-red{background:var(--red-dim);color:var(--red);border-color:rgba(239,68,68,.15)}.btn-red:hover:not(:disabled){background:rgba(239,68,68,.18)}
.btn-sm{padding:6px 12px;font-size:.74rem}

/* ═══ HERO ═══ */
.hero{margin-bottom:4px}
.hero-status{font-size:1.3rem;font-weight:700;line-height:1.45;letter-spacing:-.02em;word-break:break-word}
.hero-meta{display:flex;gap:18px;margin-top:8px;font-size:.78rem;color:var(--text-dim);flex-wrap:wrap}
.hero-meta span{display:flex;align-items:center;gap:5px}
.hero-meta .mono{font-family:var(--mono);font-size:.72rem;color:var(--text-muted)}
.progress{width:100%;height:3px;background:rgba(255,255,255,0.04);border-radius:2px;margin-top:14px;overflow:hidden}
.progress-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--cyan),var(--blue));transition:width .6s var(--ease)}

/* ═══ QUESTION CARD ═══ */
.q-card{margin-top:20px;border:1px solid rgba(245,158,11,.2);border-radius:var(--r-md);background:linear-gradient(135deg,rgba(245,158,11,.06),rgba(245,158,11,.02));padding:18px;animation:slideUp .35s var(--ease)}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.q-label{font-size:.68rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--amber);margin-bottom:6px;display:flex;align-items:center;gap:6px}
.q-label::before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber-glow);animation:pulse 2s ease-in-out infinite}
.q-text{font-size:.95rem;line-height:1.65;margin-bottom:14px;word-break:break-word}
.q-form{display:flex;gap:8px}
.q-form textarea{flex:1;background:rgba(0,0,0,.3);border:1px solid rgba(245,158,11,.15);border-radius:var(--r);font-size:.86rem;padding:10px 12px;resize:none;min-height:38px;max-height:120px;outline:none;line-height:1.5;color:var(--text)}
.q-form textarea:focus{border-color:rgba(245,158,11,.4);box-shadow:0 0 0 3px rgba(245,158,11,.08)}

/* ═══ TASK PAIR (Home) ═══ */
.task-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}
@media(max-width:500px){.task-pair{grid-template-columns:1fr}}
.tp-card{padding:14px 16px;border-radius:var(--r);background:var(--bg-raised);border:1px solid var(--glass-border);transition:all .15s var(--ease)}
.tp-card:hover{border-color:var(--glass-border-bright)}
.tp-card.current{border-left:3px solid var(--cyan)}.tp-card.next{border-left:3px solid var(--amber)}
.tp-label{font-size:.64rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}
.tp-card.current .tp-label{color:var(--cyan)}.tp-card.next .tp-label{color:var(--amber)}
.tp-title{font-size:.88rem;font-weight:600;line-height:1.4;word-break:break-word}
.tp-id{font-size:.7rem;color:var(--text-muted);font-family:var(--mono);margin-top:3px}

/* ═══ NOTE INPUT ═══ */
.note-wrap{display:flex;gap:8px;margin-top:20px}
.note-wrap textarea{flex:1;background:var(--bg-raised);border:1px solid var(--glass-border);border-radius:var(--r);font-size:.86rem;padding:10px 14px;resize:none;min-height:38px;max-height:100px;outline:none;line-height:1.5;color:var(--text)}
.note-wrap textarea:focus{border-color:rgba(34,211,238,.35);box-shadow:0 0 0 3px rgba(34,211,238,.07)}
.note-wrap textarea::placeholder{color:var(--text-muted)}

/* ═══ RIGHT SIDEBAR ═══ */
.sidebar{display:flex;flex-direction:column;gap:16px}

/* Section Toggle */
.section-toggle{width:100%;text-align:left;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);cursor:pointer;border-bottom:1px solid var(--glass-border)}
.section-toggle .arrow{transition:transform .2s var(--ease);font-size:.85rem;color:var(--text-muted)}
.section-toggle.open .arrow{transform:rotate(180deg)}
.section-body{display:none;padding:16px 20px}.section-body.open{display:block}

/* ═══ TASK LIST ═══ */
.tl-header{display:flex;align-items:center;justify-content:space-between}
.tl-count{font-size:.75rem;color:var(--text-muted);font-weight:400;margin-left:8px}
.tl-filters{display:flex;gap:4px;margin:12px 0}
.chip{padding:5px 13px;font-size:.72rem;font-weight:600;color:var(--text-muted);border-radius:999px;border:1px solid transparent;transition:all .15s var(--ease)}
.chip:hover{color:var(--text-dim);background:var(--bg-raised)}
.chip.active{color:var(--text);background:var(--bg-raised);border-color:var(--glass-border-bright)}
.tl-search{width:100%;padding:8px 12px;background:var(--bg-raised);border:1px solid var(--glass-border);border-radius:var(--r);font-size:.82rem;margin-bottom:10px;outline:none;color:var(--text)}
.tl-search:focus{border-color:rgba(34,211,238,.35);box-shadow:0 0 0 3px rgba(34,211,238,.07)}
.tl-search::placeholder{color:var(--text-muted)}
.tl-group{font-size:.66rem;font-weight:700;color:var(--text-muted);letter-spacing:.08em;text-transform:uppercase;margin:16px 0 8px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.04)}
.tl-group:first-child{margin-top:0;padding-top:0;border-top:none}

.tl-item{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:var(--r);border:1px solid var(--glass-border);background:var(--bg-raised);margin-bottom:6px;transition:all .15s var(--ease)}
.tl-item:hover{border-color:var(--glass-border-bright);background:var(--bg-hover)}
.tl-item.is-cur{border-left:3px solid var(--cyan)}.tl-item.is-nxt{border-left:3px solid var(--amber)}
.tl-check{flex-shrink:0;width:20px;height:20px;border-radius:50%;border:1.5px solid var(--glass-border-bright);background:none;margin-top:2px;display:flex;align-items:center;justify-content:center;color:transparent;font-size:.65rem;transition:all .15s var(--ease)}
.tl-check:hover{border-color:var(--emerald);color:var(--emerald)}
.tl-check.done{border-color:var(--emerald);background:var(--emerald);color:#fff}
.tl-body{flex:1;min-width:0}
.tl-head{display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap}
.tl-id{font-size:.68rem;font-family:var(--mono);color:var(--text-muted)}
.tl-badge{font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:999px;letter-spacing:.04em;text-transform:uppercase}
.badge-cur{background:var(--cyan-dim);color:var(--cyan)}.badge-nxt{background:var(--amber-dim);color:var(--amber)}
.tl-title{font-weight:600;font-size:.85rem;line-height:1.4;word-break:break-word}
.tl-summary{font-size:.78rem;color:var(--text-dim);line-height:1.4;margin-top:2px;word-break:break-word}
.tl-actions{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap}
.empty{text-align:center;padding:32px 16px;color:var(--text-muted)}
.empty-title{font-size:.95rem;font-weight:600;color:var(--text-dim);margin-bottom:4px}
.empty-copy{font-size:.82rem;margin-bottom:14px}

/* Task Form */
.tf{background:var(--bg-raised);border:1px solid var(--glass-border);border-radius:var(--r-md);padding:16px;margin-bottom:12px;animation:slideUp .2s var(--ease)}
.tf-title{font-size:.82rem;font-weight:700;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.tf input,.tf textarea{width:100%;background:rgba(0,0,0,.25);border:1px solid var(--glass-border);border-radius:var(--r);font-size:.82rem;padding:8px 12px;margin-bottom:6px;outline:none;color:var(--text)}
.tf textarea{min-height:52px;resize:vertical}
.tf input:focus,.tf textarea:focus{border-color:rgba(34,211,238,.35);box-shadow:0 0 0 3px rgba(34,211,238,.07)}

/* Task Import */
.import-box{margin-bottom:12px;padding:14px;border:1px solid var(--glass-border);border-radius:var(--r-md);background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(34,211,238,.05))}
.import-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
.import-copy{font-size:.78rem;color:var(--text-dim);margin-top:2px;line-height:1.45}
.import-actions{display:flex;gap:6px;flex-shrink:0}
.import-input{width:100%;background:rgba(0,0,0,.28);border:1px solid var(--glass-border);border-radius:var(--r);font-size:.82rem;padding:10px 12px;outline:none;color:var(--text);resize:vertical;min-height:120px;line-height:1.55}
.import-input:focus{border-color:rgba(99,102,241,.35);box-shadow:0 0 0 3px rgba(99,102,241,.10)}
.import-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px}
.import-preview{margin-top:10px;display:grid;gap:8px}
.import-empty{padding:12px;border:1px dashed rgba(255,255,255,.08);border-radius:var(--r);font-size:.78rem;color:var(--text-dim);line-height:1.5}
.import-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.72rem;color:var(--text-dim)}
.import-pill{padding:3px 8px;border-radius:999px;background:rgba(99,102,241,.18);color:#C7D2FE;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.import-warn{color:#FDE68A}
.import-item{padding:10px 12px;border:1px solid var(--glass-border);border-radius:var(--r);background:rgba(255,255,255,.03)}
.import-item-head{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.import-item-index{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:rgba(34,211,238,.14);color:var(--cyan);font-family:var(--mono);font-size:.68rem;font-weight:700;flex-shrink:0}
.import-item-title{font-weight:700;font-size:.82rem;line-height:1.4;word-break:break-word}
.import-item-summary{font-size:.77rem;color:var(--text-dim);line-height:1.45;word-break:break-word}
.import-item-criteria{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.import-chip{padding:3px 8px;border-radius:999px;background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.12);font-size:.68rem;color:#CFFAFE}
.import-more{font-size:.74rem;color:var(--text-muted);padding-left:2px}
@media(max-width:500px){.import-head,.import-foot{flex-direction:column;align-items:stretch}.import-actions{justify-content:flex-start}}

/* ═══ LOGS ═══ */
.ev-row{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:.8rem}
.ev-row:last-child{border-bottom:none}
.ev-time{color:var(--text-muted);font-family:var(--mono);font-size:.68rem;flex-shrink:0;min-width:50px}
.ev-type{font-size:.62rem;color:var(--text-muted);font-family:var(--mono)}
.ev-msg{flex:1;line-height:1.45;word-break:break-word}
.log-pre{background:rgba(0,0,0,.3);border:1px solid var(--glass-border);border-radius:var(--r);padding:14px;font-family:var(--mono);font-size:.73rem;line-height:1.7;color:var(--text-dim);max-height:360px;overflow:auto;white-space:pre-wrap;word-break:break-word}

/* ═══ SETTINGS ═══ */
.s-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media(max-width:500px){.s-grid{grid-template-columns:1fr}}
.field{display:grid;gap:3px}
.field.full{grid-column:1/-1}
.field label{font-size:.68rem;font-weight:600;color:var(--text-muted);letter-spacing:.05em;text-transform:uppercase}
.field input,.field select,.field textarea{background:rgba(0,0,0,.25);border:1px solid var(--glass-border);border-radius:var(--r);font-size:.8rem;padding:8px 12px;outline:none;color:var(--text)}
.field textarea{min-height:60px;resize:vertical}
.field input:focus,.field select:focus,.field textarea:focus{border-color:rgba(34,211,238,.35);box-shadow:0 0 0 3px rgba(34,211,238,.07)}
.field input:disabled,.field textarea:disabled,.field select:disabled{opacity:.4;cursor:not-allowed}
.field-hint{font-size:.68rem;color:var(--text-muted)}

/* ═══ TOAST ═══ */
.toast-container{position:fixed;bottom:24px;right:24px;z-index:300;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none}
.toast{padding:10px 18px;border-radius:var(--r);font-size:.82rem;font-weight:600;pointer-events:auto;opacity:0;transform:translateX(40px);animation:toastIn .3s var(--ease) forwards;border:1px solid transparent}
.toast.out{animation:toastOut .25s var(--ease) forwards}
@keyframes toastIn{to{opacity:1;transform:translateX(0)}}
@keyframes toastOut{to{opacity:0;transform:translateX(40px)}}
.toast-success{background:var(--emerald-dim);color:#A7F3D0;border-color:rgba(16,185,129,.2)}
.toast-warning{background:var(--amber-dim);color:#FDE68A;border-color:rgba(245,158,11,.2)}
.toast-error{background:var(--red-dim);color:#FECACA;border-color:rgba(239,68,68,.2)}
.toast-info{background:var(--bg-raised);color:var(--text);border-color:var(--glass-border)}

/* ═══ SCROLLBAR ═══ */
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.14)}
`;
