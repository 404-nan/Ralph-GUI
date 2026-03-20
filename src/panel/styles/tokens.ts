export const panelStyleTokens = String.raw`
:root {
  --bg: #f5f6f2;
  --surface: #ffffff;
  --surface-soft: #f7f8f4;
  --surface-muted: #eef1ea;
  --surface-strong: #e8efe7;
  --line: #dfe5da;
  --line-strong: #c7d2c2;
  --text: #172019;
  --text-dim: #344136;
  --text-muted: #617064;
  --accent: #12805b;
  --accent-soft: rgba(18, 128, 91, 0.12);
  --accent-strong: rgba(18, 128, 91, 0.22);
  --warn: #b87415;
  --warn-soft: rgba(184, 116, 21, 0.12);
  --danger: #c34f42;
  --danger-soft: rgba(195, 79, 66, 0.12);
  --info: #476fce;
  --info-soft: rgba(71, 111, 206, 0.12);
  --ok: #187b48;
  --ok-soft: rgba(24, 123, 72, 0.12);
  --shadow-sm: 0 1px 2px rgba(10, 20, 10, 0.05);
  --shadow-md: 0 12px 30px rgba(17, 25, 17, 0.07);
  --radius-sm: 12px;
  --radius-md: 18px;
  --radius-lg: 24px;
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
    radial-gradient(circle at top left, rgba(18, 128, 91, 0.05), transparent 24%),
    linear-gradient(180deg, #fafbf8, var(--bg));
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.55;
}
button, input, textarea, select { font: inherit; color: inherit; }
button { border: 0; background: none; cursor: pointer; }
`;
