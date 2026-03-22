# Ralph v1 Plan

## 1. Product Decision

Ralph v1 は **single-active task model + focus queue** を採用する。

採用理由:

- 現行 engine は 1 turn ごとに 1 child command 実行
- true parallel を安全にやるには abort、retry、artifact ownership、UI、state を全面的に作り直す必要がある
- operator-first ツールでは、parallel らしさより model honesty が重要

このため、task lane は次の 4 つで固定する。

- `current`
- `next`
- `blocked`
- `done`

## 2. Information Architecture

panel の既定 view は `Mission Control`。

トップで見せる情報:

1. run summary
2. current task
3. next-up queue
4. pending decisions
5. blockers
6. changed files / recent artifacts / test summary / recent outputs
7. runReason

secondary view:

- task management
- import preview
- setup / diagnostics
- timeline / raw output

## 3. State Design

operator-facing source of truth は `RunStatus`。

### `RunStatus`

- `runState`
- `runReason`
- `currentTaskId`
- counts for `pendingQuestion`, `answeredQuestion`, `blockedTask`, `completedTask`, `queuedTask`
- legacy `phase / lifecycle / control / maxIntegration` は backward compatibility 用

### `RunReport`

- latest turn result
- exit code
- failure classification
- retry / stuck information
- changed files
- recent artifacts
- recent outputs
- test summary
- pending decisions / unresolved blockers
- completion evidence

### `StateMeta`

- schema version
- migration timestamp
- migrated from legacy かどうか

## 4. Task Design

task は以下のフィールドを標準化する。

- `title`
- `summary`
- `priority`
- `acceptanceCriteria[]`
- `notes`
- `blockedReason`
- `agentId`

task UX で必要な機能:

- create / edit / detail
- block / unblock
- make current
- move up / move down / move bottom
- complete / reopen
- import preview / reviewed import

## 5. Run Control Design

run control は次を扱う。

- start
- pause
- resume
- abort
- reset runtime data

`runReason` は operator に見せる explanation として更新し続ける。

例:

- `Current task is running under supervisor control.`
- `Run is paused by operator.`
- `Run needs operator review because acceptance criteria evidence is incomplete.`
- `Run is blocked because only blocked tasks remain.`

## 6. Completion Design

`[[DONE]]` は completion signal の 1 つであり、最終判定ではない。

判定入力:

- done marker
- process exit code
- acceptance criteria の有無
- unresolved blocker / pending decision
- changed files
- recent artifacts
- test summary

判定結果:

- `completed`
- `needs_review`

## 7. Import Design

importer は raw spec をそのまま確定登録しない。必ず preview を返す。

preview が返すもの:

- `drafts`
- `duplicateGroups`
- `splitSuggestions`
- detected format
- truncation info

commit は reviewed drafts を受け取り、operator が merge / drop / edit した結果を反映する。

## 8. Setup / Settings Design

初回セットアップは wizard 方式。

流れ:

1. preset 選択
2. command / cwd / prompt の validation
3. diagnostics 表示
4. quick test
5. advanced settings

raw command 入力は残すが、初回導線の中心には置かない。

## 9. API / Transport Design

API の原則:

- JSON envelope
- 一貫した error payload
- destructive action は confirm 前提の UI から呼ぶ

transport の原則:

- Basic auth は timing-safe comparison
- mutating request は same-origin / local-origin
- WebSocket は short-lived session token 必須

## 10. Packaging Design

- panel assets は module-relative path で解決
- build 成功時は `dist/panel-ui` に UI をコピー
- `ralph` launcher は built CLI を優先
- package tarball に runtime と docs を含める

## 11. Migration Strategy

方針:

- backward-compatible read
- auto migration on startup
- file-based state 維持
- manual migration 不要を優先

追加ファイル:

- `state/meta.json`
- `state/run-report.json`

legacy state:

- `status.json`
- `tasks.json`
- `settings.json`

はそのまま読める。足りない field は safe default で補う。

## 12. Validation Plan

主要テスト対象:

- orchestration model
- task CRUD / reorder / block / unblock / completion
- import preview / import commit
- reliability / completion evidence
- state migration / reset / corrupt file fallback
- panel auth / websocket
- setup diagnostics / quick test

## 13. Non-Goals

v1 ではやらない。

- true parallel child execution
- cloud-hosted state backend
- mobile-first optimization
- timeline-centric UI への回帰
