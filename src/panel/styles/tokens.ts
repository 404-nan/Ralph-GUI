export const panelStyleTokens = String.raw`
:root {
  --bg: #f3f4ef;
  --bg-strong: #ebece6;
  --surface: rgba(255, 255, 255, 0.88);
  --surface-soft: rgba(248, 249, 245, 0.92);
  --surface-muted: rgba(239, 241, 236, 0.92);
  --surface-inset: rgba(243, 244, 239, 0.96);
  --surface-strong: rgba(232, 235, 228, 0.96);
  --line: rgba(214, 220, 211, 0.9);
  --line-strong: rgba(189, 197, 185, 0.95);
  --text: #182018;
  --text-dim: #334035;
  --text-muted: #667367;
  --accent: #3f63dd;
  --accent-soft: rgba(63, 99, 221, 0.1);
  --accent-strong: rgba(63, 99, 221, 0.18);
  --warn: #b37a24;
  --warn-soft: rgba(179, 122, 36, 0.13);
  --danger: #c44c3b;
  --danger-soft: rgba(196, 76, 59, 0.13);
  --ok: #18774d;
  --ok-soft: rgba(24, 119, 77, 0.12);
  --shadow-sm: 0 1px 2px rgba(13, 18, 11, 0.04), 0 10px 28px rgba(13, 18, 11, 0.04);
  --shadow-md: 0 18px 50px rgba(13, 18, 11, 0.08);
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 24px;
  --radius-xl: 28px;
  --sans: 'Manrope', 'Noto Sans JP', sans-serif;
  --mono: 'IBM Plex Mono', monospace;
  --ease: cubic-bezier(.2,.65,.3,1);
}

*, *::before, *::after { box-sizing: border-box; }
html {
  height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(63, 99, 221, 0.06), transparent 22%),
    radial-gradient(circle at 100% 0%, rgba(24, 119, 77, 0.04), transparent 18%),
    linear-gradient(180deg, #f8f9f5, var(--bg));
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.55;
}
button, input, textarea, select { font: inherit; color: inherit; }
button { border: 0; background: none; cursor: pointer; }
a { color: inherit; }
`;
