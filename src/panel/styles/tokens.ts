export const panelStyleTokens = String.raw`
:root {
  --bg: #f5f6f2;
  --bg-strong: #eef1eb;
  --surface: rgba(255, 255, 255, 0.78);
  --surface-elevated: rgba(255, 255, 255, 0.9);
  --surface-soft: rgba(246, 247, 243, 0.9);
  --surface-muted: rgba(239, 241, 236, 0.86);
  --surface-inset: rgba(242, 244, 239, 0.94);
  --surface-strong: rgba(233, 236, 230, 0.96);
  --text: #182018;
  --text-dim: #374338;
  --text-muted: #707b71;
  --accent: #4364df;
  --accent-soft: rgba(67, 100, 223, 0.1);
  --accent-strong: rgba(67, 100, 223, 0.18);
  --warn: #b67a21;
  --warn-soft: rgba(182, 122, 33, 0.12);
  --danger: #c65241;
  --danger-soft: rgba(198, 82, 65, 0.12);
  --ok: #1b7a50;
  --ok-soft: rgba(27, 122, 80, 0.11);
  --shadow-xs: 0 1px 2px rgba(16, 24, 16, 0.025);
  --shadow-sm: 0 8px 22px rgba(16, 24, 16, 0.05);
  --shadow-md: 0 18px 48px rgba(16, 24, 16, 0.08);
  --shadow-inset: inset 0 1px 0 rgba(255,255,255,0.66);
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
    radial-gradient(circle at top left, rgba(67, 100, 223, 0.045), transparent 22%),
    radial-gradient(circle at 100% 0%, rgba(27, 122, 80, 0.03), transparent 20%),
    linear-gradient(180deg, #fafbf8, var(--bg));
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.55;
}
button, input, textarea, select { font: inherit; color: inherit; }
button { border: 0; background: none; cursor: pointer; }
a { color: inherit; }
`;
