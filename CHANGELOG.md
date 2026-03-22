# Changelog

## Unreleased

- Ralph を `single_active` 実行モデルへ寄せ、UI / prompt / CLI / state の認知モデル不一致を解消した
- Mission Control dashboard を導入し、`current task`, `next queue`, `blockers`, `pending decisions`, `runReason`, `runReport` を 1 画面目の中心に再設計した
- task model を強化し、`priority`, `acceptanceCriteria`, `notes`, `blockedReason`, `agentId` を create / update / import / detail 編集で扱えるようにした
- task 操作を `make current`, `move up`, `move down`, `block`, `unblock`, `complete`, `reopen` に整理した
- spec import を preview-first に変更し、heading / list / JSON 解析、duplicate merge、long-item split suggestion、reviewed import を追加した
- `DONE marker only` をやめ、exit code、blocker、criteria、changed files、artifacts、test summary を使う evidence-based completion を導入した
- `state/meta.json` と `state/run-report.json` を追加し、legacy state を自動 migration しながら schema version を管理するようにした
- initial setup を preset / diagnostics / quick test 前提の導線に変更し、raw command 直入力を advanced settings 側へ寄せた
- panel API を JSON error envelope に統一し、UI の action 失敗を toast / inline alert / retry guidance として見える化した
- panel security を強化し、timing-safe Basic auth、same-origin 制約、short-lived WebSocket session token を導入した
- panel asset 解決を module-relative path に変更し、build 後の UI を `dist/panel-ui` へ同梱できるようにした
- `ralph status` の表示を single-active 用語へ更新し、legacy `MaxIntegration` を operator-facing output から外した
- orchestration、task import、run reliability、state migration、auth / websocket を守るテストを追加した

## 1.1.0 - 2026-03-13

- クイック送信に送信前プレビューを追加し、メモ / Task / 回答 / 実行操作の行き先を送る前に確認できるようにした
- クイック送信の下書きをブラウザ内へ自動保存し、モード切り替えや質問切り替えでも入力を失いにくくした
- 回答対象の質問が解消されたときに別の pending 質問へ自動で差し替わらないようにし、誤回答を防ぐようにした
- Task を panel から最優先へ上げたり後ろへ回したりできるようにし、「次にやる Task」を手で調整できるようにした
- panel の長文折り返しを強化し、長い Task 名、質問、イベントでもレイアウトが崩れにくくした

## 1.0.0 - 2026-03-13

- `ralph check` を追加し、prompt / task catalog / panel / Discord 設定を起動前に診断できるようにした
- panel を「いまやること」中心の情報設計へ再構成し、実行状態・現在/次 Task・要対応の優先順位を整理した
- クイック送信 UX を追加し、メモ / Task 追加 / 質問回答を 1 つの入力導線へ統合した
- クイック送信の初期化クラッシュ、二重送信、回答のメモ化けなど v1.0 を阻害する不具合を修正した
- Task board を状態別に見やすく整理し、検索・フィルタ・完了条件プレビューを追加した
- panel の危険操作を状態依存にし、中断確認や実行可否の明確化を入れた
- config 診断ロジックのテストを追加した
- GitHub Actions CI / release で lint / test / check / smoke / build を自動検証するようにした
- README を v1.0 向けに整理し、起動導線と運用イメージを明確にした
