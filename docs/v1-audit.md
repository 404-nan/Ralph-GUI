# Ralph v1 Audit

## 目的

この監査は、Ralph を「AI ループが回っていることを見る試作品」から、**人間が AI 実行を安全に監督し、介入し、判断できる operator-first mission control** へ移行するための現状整理です。

## 結論

Ralph v1 は `true parallel` を採らず、**single-active execution model** を正式採用する。

理由:

- 現行 engine の実態が 1 turn / 1 child command だから
- 短時間で robust な true parallel を入れると、state・prompt・UI・abort/retry・artifact attribution を全部作り直す必要があるから
- operator の信頼を回復するには、派手な parallel 表現より「実態に正直な model」が優先だから

## 監査サマリ

| 領域 | 問題 | 影響 | v1 方針 |
|:--|:--|:--|:--|
| Execution model | `MaxIntegration` に応じて複数 active を見せるが、engine は 1 child command 実行 | operator が「何が本当に動いているか」を誤解する | `single_active` に統一し `current / next / blocked / done` に正規化 |
| Information architecture | dashboard が event log 寄り | 今 / 次 / 詰まり / 成果 / 要判断が見えない | Mission Control を 1 画面目にし、timeline は補助に下げる |
| Task UX | task の情報量が UI と API で活かされない | AI に渡す単位が弱く、完了判定も浅い | task detail / edit / import を強化し、acceptance criteria と blocked reason を一級情報にする |
| State semantics | `status / phase / lifecycle / control` の意味が曖昧 | UI ごとに解釈がブレる | `runState + runReason` を operator-facing source of truth にする |
| Failure surfacing | 多くの action failure が `console.error` 止まり | 失敗に気づけず運用が崩れる | JSON error envelope + toast / inline alert / retry guidance |
| Setup | raw command / cwd / prompt file 直入力が重い | 初回導入で離脱しやすい | preset / validation / diagnostics / quick test |
| Completion | `[[DONE]]` marker 寄り | criteria 未達や test 未実行でも完了扱いになる | evidence-based completion |
| Packaging | panel asset が `process.cwd()` 依存 | `npm link` や package 実行で壊れやすい | module-relative asset resolution + built UI 同梱 |
| Security | WS upgrade 認証漏れ、広い CORS | ローカル前提でも transport が雑 | same-origin + WS token + timing-safe auth |
| Import | spec import が浅い | 大きい spec から task 化しにくい | preview-first、dedupe、split、criteria extraction |

## 詳細課題

### 1. Execution model mismatch

現状では orchestration model が複数 task を active のように見せる一方、supervisor は 1 turn ごとに 1 回だけ agent command を実行する。これは operator にとって最も重要な「今何をやっているか」を曖昧にする。

採用方針:

- `currentTask` は 1 つだけ
- 残りは `nextTasks`
- `blockedTasks` と `doneTasks` を明示分離
- `MaxIntegration` は互換用 field に縮退

### 2. UI が判断 UI ではなく観測 UI

log は見えるが、次の一手が見えない。Mission Control に必要なのは以下であり、時系列表示そのものではない。

- current task
- next queue
- pending decisions
- blockers
- changed files / artifacts / tests
- run が止まっている理由

採用方針:

- timeline は secondary
- top fold は運用判断に必要な card に限定

### 3. Task が浅く、AI に渡す単位として弱い

`priority`, `acceptanceCriteria`, `notes` が型にはあるのに UI では十分扱えない。結果として task はタイトルの列になり、完了判定も「DONE が出たか」に寄る。

採用方針:

- TaskForm と detail view を統合強化
- acceptance criteria を completion evidence に接続
- block / unblock を first-class action にする

### 4. 状態語彙の不整合

Sidebar と TaskBoard で `blocked` の意味が揃わず、`phase / lifecycle / control` は operator 目線で読むには難しい。

採用方針:

- operator-facing status は `runState + runReason`
- task lane は `current / next / blocked / done`
- action 可否もこの語彙に合わせる

### 5. Silent failure

UI action の失敗が console にしか出ない箇所が多い。operator が失敗に気づけないまま次の判断をしてしまう。

採用方針:

- API を JSON envelope に統一
- success / warning / error を toast と inline alert で可視化
- retry guidance を出す

### 6. 初回セットアップの重さ

raw command、cwd、prompt file をいきなり入力させるのは学習コストが高い。

採用方針:

- preset を先に見せる
- validation と diagnostics を先に出す
- quick test で通るか確かめる
- raw command は advanced settings に残す

### 7. Completion の甘さ

`[[DONE]]` は useful signal だが、完了証明としては弱い。test 未実行や blocker 未解消でも閉じてしまう。

採用方針:

- `DONE` は completion candidate
- exit code、acceptance criteria、test summary、artifacts、blocker を合わせて判定
- `completed` と `needs_review` を分ける

### 8. Packaging / panel 配布の脆さ

panel が `process.cwd()` に依存すると、repo 外実行や `npm link` で崩れる。

採用方針:

- module-relative asset resolution
- built panel を `dist/panel-ui` に同梱
- launcher は built CLI を優先

### 9. Transport safety

ローカル専用ツールでも、WS upgrade 認証漏れや広すぎる CORS は将来の事故要因になる。

採用方針:

- Basic auth を timing-safe に比較
- same-origin 制約
- `/api/session` で短命 token を発行し、WS 接続に要求

### 10. Spec import の浅さ

大きい spec から「そのまま AI に投げられる task」を切り出しにくい。

採用方針:

- preview-first
- duplicate group 表示
- long-item split suggestion
- acceptance criteria extraction
- reviewed drafts import

## 採用アーキテクチャ

v1 で採用する柱:

- single-active orchestration
- operator-first dashboard
- evidence-based completion
- strict error surfacing
- setup diagnostics
- asset / package hardening
- transport hardening
- backward-compatible state migration

## やらないこと

v1 では以下をやらない。

- 真の並列 child process 実行
- 重い DB やクラウド依存への移行
- mobile-first 最適化
- 派手な dashboard 演出や装飾主導 UI
- fully autonomous completion without operator review path

## 成功条件

Ralph v1 が満たすべき条件:

1. operator が panel を開いて 10 秒以内に「今 / 次 / 詰まり / 成果 / 要判断」を把握できる
2. 実行モデルと UI 用語が一致している
3. completion が `DONE` だけに依存しない
4. 失敗が UI に見える
5. 初回設定がセットアップ画面だけで完結しやすい
6. repo 外実行や package 配布で panel が壊れにくい
