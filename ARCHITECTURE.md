# Architecture

## Design Goals

Ralph v1 の中心方針は次の 5 点です。

1. 実行モデルを UI と engine で一致させる
2. operator が 1 画面で判断できる情報を優先する
3. task を AI に渡す最小実行単位として強化する
4. silent failure をなくし、失敗を行動可能な形で出す
5. local-first / file-based state を維持しながら配布と安全性を上げる

## Honest Execution Model

Ralph は **single-active orchestration** です。

- supervisor は 1 turn ごとに 1 child command を実行する
- orchestration snapshot は 1 つの `currentTask` だけを選ぶ
- 残りの task は `nextTasks`, `blockedTasks`, `doneTasks` に分ける
- `MaxIntegration` は互換用の legacy field としてのみ残し、導出値は常に `1`

この設計により、panel・CLI・prompt・state の認知モデルを一致させています。

## State Model

`FileStateStore` が file-based state を管理します。v1 では schema version を導入し、legacy state を安全に読みながら不足フィールドを補います。

主要ファイル:

- `state/status.json`
  - operator-facing status
  - `runState`, `runReason`, `currentTaskId`, `blockedTaskCount`
  - legacy `phase / lifecycle / control / maxIntegration` も保持
- `state/tasks.json`
  - task catalog
  - `priority`, `acceptanceCriteria`, `notes`, `blockedReason`, `agentId` を含む
- `state/settings.json`
  - runtime settings
- `state/meta.json`
  - schema version と migration metadata
- `state/run-report.json`
  - latest turn outcome、retry / stuck、changed files、recent artifacts、test summary、completion evidence
- `state/questions.json`, `state/answers.json`, `state/manual-notes.json`
  - human-in-the-loop inputs
- `state/events.jsonl`, `logs/agent-output.log`
  - audit trail

`ensureInitialized()` は legacy repo でも `meta.json` と `run-report.json` を自動生成します。

## Task Model

task は「AI に渡す最小実行単位」です。Ralph v1 では task を次のフィールドで扱います。

- `title`
- `summary`
- `priority`
- `acceptanceCriteria[]`
- `notes`
- `blockedReason`
- `agentId`

UI と action layer は次の操作を共有します。

- create / update
- make current
- move up / move down / move bottom
- block / unblock
- complete / reopen
- import preview / import commit

task の display lane は `current / next / blocked / done` に正規化し、旧 `active` 多重表現を廃止しました。

## Orchestration Layer

`src/orchestration/model.ts` は task catalog から operator-facing snapshot を導出します。

- `currentTask`
- `nextTasks`
- `blockedTasks`
- `doneTasks`
- Mission Control 向け task board

prompt injection はこの snapshot を使い、`current task / next queue / blockers / pending decisions` をエージェントへ明示します。

## Supervisor and Run Control

`src/supervisor/supervisor.ts` は state を見ながら run loop を制御します。

主要フロー:

1. run start 要求を受ける
2. `currentTask` を選び prompt を生成する
3. agent command を 1 回実行する
4. output marker と exit result を action layer に渡す
5. `run-report.json` と `status.json` を更新する
6. 次の turn を継続するか、`completed / needs_review / paused / blocked / error` を決める

`runReason` は operator が「なぜ今その状態なのか」を見るための文です。たとえば以下を返します。

- current task を実行中
- pending decision 待ち
- blocked task しか残っていない
- acceptance criteria が未証明で review が必要

## Evidence-Based Completion

Ralph v1 は `[[DONE]]` marker だけで run を閉じません。

completion 判定は次を組み合わせます。

- `[[DONE]]` の有無
- turn の exit code
- unresolved blocker / pending decision
- acceptance criteria の有無
- changed files / recent artifacts
- test summary

この結果は `run-report.json.completionEvidence` に保存され、run outcome は `completed` か `needs_review` に分かれます。

## Panel and API

panel server は軽量 HTTP + WebSocket サーバーです。

v1 の構成:

- API は `{ ok, data | error }` の JSON envelope
- panel 初回表示は Mission Control
- UI action は共通 action layer を呼び、toast / inline alert を使う
- settings 画面で diagnostics と quick test を実行できる
- import は preview-first

主な API 群:

- dashboard / session
- run control
- answer / note
- task CRUD / block / unblock / reorder / complete / reopen
- import preview / import commit
- settings update / quick test

## Security Model

panel はローカル運用前提ですが、v1 では transport の雑な穴を減らしています。

- Basic auth 比較は timing-safe
- mutating request と WebSocket upgrade に same-origin / local-origin 制約
- WebSocket は `/api/session` で払い出した short-lived token を必須化
- unauthorized request は JSON error と適切な status code で返す

## Setup and Diagnostics

setup は raw command 直入力を前提にしません。

- preset を選ぶ
- workspace / prompt / command を検証する
- quick test を流す
- advanced settings で raw command / prompt override を直す

この導線は panel の Setup view と `ralph check` の両方から使えます。

## Packaging and Distribution

panel asset は `process.cwd()` 依存を廃止し、module-relative path から解決します。

- runtime build は `dist`
- built UI は `dist/panel-ui`
- `ralph` launcher は `dist/cli/ralph.js` を優先
- 同梱 prompt は `resolveBundledPath()` で発見

これにより repo 外実行、`npm link`、package tarball でも panel が壊れにくくなります。

## Backward Compatibility

- file-based state は維持
- legacy `status.json`, `tasks.json`, `settings.json` は読める
- migration は自動
- CLI surface は維持
- `MaxIntegration` は内部互換のみ

詳細は [docs/migration-v1.md](./docs/migration-v1.md) を参照してください。
