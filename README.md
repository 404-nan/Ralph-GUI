# Ralph Loop（Temporary Ops Friendly）

> Japanese-first docs are in `README.ja.md`. This file is a short EN overview.

Ralph Loop is tuned for temporary operation before LuLOS, with practical operator UX:

- clear CLI progress output
- clear AI-output labeling
- optional Discord webhook notifications
- lightweight web panel with refresh button (works fully without Discord)
- non-blocking Q&A flow (keeps running even if answer is pending)

## Quick Start

```bash
chmod +x ./ralph-loop/ralph.sh
./ralph-loop/ralph.sh "codex exec --full-auto" 20
```

## Web Panel

```bash
python3 ./ralph-loop/dashboard.py
# http://localhost:8787
```

The panel shows status/log tail and lets you append answers to `answers.txt`.

## Discord Notifications (Optional)

```bash
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." \
./ralph-loop/ralph.sh "codex exec --full-auto" 20
```

If Discord is disabled, equivalent notifications are still written to `events.log` and shown in the web panel.

## Q&A without stopping loop

If AI emits:

```text
<question>...</question>
```

Ralph logs and notifies it, but continues work. Any new lines added to `answers.txt` are injected into the next prompt block automatically.
