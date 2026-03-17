# RalphLoop v1.1

RalphLoop is a task-first orchestration loop for Codex. It keeps a single shared state across the web panel, supervisor, and optional Discord bridge so operators can always answer three questions:

- What is in progress right now?
- What gets handed off next?
- Where does human judgment need to be injected?

## Quick Start

Use the repository-local launcher after cloning:

```bash
./ralph help
```

For the fastest end-to-end demo:

```bash
npm run check
./ralph demo
```

If you want a global `ralph` command on your machine, run:

```bash
npm link
```

## What RalphLoop Does

- Runs `start / run / start-run / configure / reset / panel / supervisor / discord / demo / status / check` from one CLI
- Keeps task status, questions, answers, blockers, logs, and runtime settings in flat files
- Lets you reset runtime data with `./ralph reset` while keeping repo-shareable state files ready for Git
- Prioritizes one current task and one next handoff instead of burying operators in generic dashboards
- Lets operators push a task to the front or send it to the back directly from the panel
- Lets the loop continue after `[[QUESTION]]`, then injects answers or notes once into the next prompt
- Exposes the same action layer to the web panel and Discord bridge
- Lets operators paste a README, PRD, issue, or notes into the panel, preview the parsed tasks, and import them directly

## Main Docs

- Japanese guide: [README.md](./README.md)
- Minimal example: [examples/minimal/README.md](./examples/minimal/README.md)
- Task catalog / PRD guide: [docs/task-catalog.md](./docs/task-catalog.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Release checklist: [docs/releasing.md](./docs/releasing.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
