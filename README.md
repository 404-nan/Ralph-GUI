# RalphGUI

RalphGUI は、AI エージェントを「回す」ためのツールではなく、**人間が少ない負荷で AI 実行を監督し、判断し、介入できる local-first mission control** です。

- 正直な `single_active` 実行モデル
- `current / next / blocked / done` を中心にした task board
- `runReason` と `runReport` による運用判断 UI
- 初回セットアップ wizard、agent preset、diagnostics、quick test
- file-based state を維持しつつ schema migration を自動化
- Basic auth + same-origin + WebSocket session token による panel hardening

詳細な監査と設計判断は [docs/v1-audit.md](./docs/v1-audit.md) と [docs/v1-plan.md](./docs/v1-plan.md) を参照してください。

## Quick Start

> 必要環境: Node.js 22+

```bash
git clone https://github.com/404-nan/ralph-gui.git
cd ralph-gui
npm install
npm link
cp .env.example .env
npm run check
ralph demo
```

通常起動:

```bash
ralph
```

この README のコマンド例は、`npm link` で `ralph` を PATH に入れた前提で書いています。repo 内のローカル launcher を直接叩きたい場合だけ `./ralph` を使ってください。

panel は `http://127.0.0.1:8787` で開けます。初回は Setup 画面から agent preset を選び、workspace / prompt / command を検証してから Mission Control に戻してください。

## Ralph v1 の考え方

Ralph v1 は `true parallel` を装わず、**1 turn ごとに 1 child command を実行する single-active orchestration** を正式な実行モデルとして採用します。

operator が最初に知るべきことは次の 4 点です。

1. 今どの task を進めているか
2. 次に何が控えているか
3. 何が blocker / decision になっているか
4. 今回の run で何が変わったか

そのため、1 画面目は event log ではなく `Mission Control` です。timeline と raw output は補助情報に下げています。

## 主な機能

### Mission Control

- `runState` と `runReason` で「進んでいる理由 / 止まっている理由」を明示
- current task card、next-up queue、blockers、pending decisions を分離表示
- changed files、recent outputs、test summary、recent artifacts を 1 画面で確認
- `completed` と `needs_review` を evidence-based completion で判定

### Strong Task UX

- task に `title / summary / priority / acceptanceCriteria / notes / blockedReason / agentId` を保持
- `make current / move up / move down / block / unblock / complete / reopen` を明示アクションとして提供
- task detail modal から編集しやすい構成

### Import Workflow

- spec import は preview-first
- heading / list / JSON を解析
- duplicate merge 候補、long-item split suggestion、acceptance criteria 抽出を表示
- reviewed drafts をそのまま import commit 可能

### Setup and Diagnostics

- Codex / Claude Code / Gemini CLI の preset
- prompt / cwd / command validation
- quick test で接続確認
- raw command 入力は advanced settings に残しつつ、初回から強制しない

### Local-First Safety

- file-based state を維持
- legacy state を自動 migration
- panel は Basic auth、same-origin 制約、short-lived WebSocket token を適用

## 実行モデル

Ralph の task lane は次の 4 種類です。

- `current`: 今回の turn で AI に渡す task
- `next`: current の後に待機している focus queue
- `blocked`: 人間判断や前提不足で止まっている task
- `done`: 完了済み task

`MaxIntegration` は operator-facing model から外し、互換目的で内部にのみ残しています。CLI の `ralph status` も `single_active` 前提の文言に更新されています。

## セットアップ

基本設定は `.env` か Setup 画面から行えます。

```bash
RALPH_AGENT_COMMAND=codex exec --full-auto --skip-git-repo-check
RALPH_AGENT_CWD=.
RALPH_PROMPT_FILE=prompts/supervisor.md
```

agent preset の例:

| Preset | Command |
|:--|:--|
| Codex | `codex exec --full-auto --skip-git-repo-check` |
| Claude Code | `claude --dangerously-skip-permissions` |
| Gemini CLI | `gemini --yolo` |

prompt file を明示しない場合、Ralph は workspace の `prompts/supervisor.md` を探し、見つからなければ同梱 prompt に fallback します。

## Web Panel

| View | 役割 |
|:--|:--|
| Mission Control | 今 / 次 / 詰まり / 成果 / 要判断をまとめて見る |
| Tasks | task の作成、編集、並び替え、block / unblock、complete / reopen |
| Import | spec preview、dedupe、split suggestion、reviewed import |
| Setup | preset、validation、diagnostics、quick test |
| Timeline | 補助的な event / output 確認 |

panel の API は JSON envelope を返し、UI は toast と inline alert を使って success / warning / error / retry guidance を表示します。`console.error` に捨てるだけの失敗経路は廃止しました。

## CLI

```bash
ralph                # start と同じ
ralph start          # panel + supervisor 起動
ralph run "task"     # task を追加して run 開始
ralph status         # runState / runReason / task lane を表示
ralph check          # 設定診断
ralph configure      # runtime settings 更新
ralph reset          # state / logs の実行データを初期化
ralph demo           # demo mode
```

`ralph` launcher は `dist/cli/ralph.js` を優先し、開発時は `src/cli/ralph.ts` に fallback します。

## Packaging

- panel asset は `process.cwd()` ではなく module-relative path で解決します
- build は `dist` に runtime を出力し、UI build が成功していれば `dist/panel-ui` へ同梱します
- `npm pack --dry-run` で package 内容を確認できます
- repo 外実行や `npm link` でも panel が壊れにくい構成にしています

## ドキュメント

| Document | 内容 |
|:--|:--|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | v1 architecture と state / transport / packaging |
| [CHANGELOG.md](./CHANGELOG.md) | 変更履歴 |
| [docs/v1-audit.md](./docs/v1-audit.md) | v1 audit |
| [docs/v1-plan.md](./docs/v1-plan.md) | v1 product / architecture redesign |
| [docs/migration-v1.md](./docs/migration-v1.md) | state / API / panel migration note |
| [docs/task-catalog.md](./docs/task-catalog.md) | task 設計ガイド |

## Development

```bash
npm run lint
npm test
npm run build
npm pack --dry-run --json
```

現在のテストは state migration、orchestration、task import、run completion、panel auth / websocket を中心にカバーしています。旧 Playwright fixture test は削除済みで、UI 実ブラウザ flow は今後の追加対象です。
