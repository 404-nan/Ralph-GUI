# RalphLoop

Codex を外側から監督する、一時的な supervisor 付き RalphLoop です。

このリポジトリは LuLOS の完成版ではありません。目的は、`ralph.sh` ベースの最小 loop を、今すぐ使える運用ツールへ整理して置き換えることです。

- supervisor が 1 repo / 1 agent / 1 run を監督
- 質問が未回答でも停止せず、進められる作業を継続
- 回答や手動メモは次ターン prompt 末尾へ一度だけ注入
- Web panel から `status / pause / resume / abort / answer / note` を操作可能
- Discord bridge からも同じ state を操作可能
- state / log は JSON / JSONL / フラットファイルのみ
- Discord token がなくても Web とローカルファイルだけで運用可能

## 最短起動

前提:
- Node.js 24 以上
- Codex CLI を使う場合は `codex` コマンドが通ること

```bash
npm run demo
```

これで以下を確認できます。

- `http://127.0.0.1:8787` に Web panel が立つ
- demo agent が `[[QUESTION]]` を出す
- Web panel から回答すると次ターン prompt に注入される
- demo agent が `[[DONE]]` を返して完了する

## 通常起動

`.env.example` を `.env` にコピーして必要な値を調整します。

```bash
npm run dev
```

`npm run dev` は以下を同時に起動します。

- Web panel
- supervisor
- Discord bridge

Discord token が未設定なら Discord bridge は自動で無効化され、Web only モードで起動します。

## 主要コマンド

```bash
npm run dev
npm run app:start
npm run supervisor:start
npm run panel:start
npm run discord:start
npm run demo
npm run build
npm run lint
npm run test
```

補足:
- `npm run dev` と `npm run app:start` は同じです
- 依存パッケージは使っていないため、通常は `npm install` 不要です
- TypeScript は Node 24 の `--experimental-strip-types` で直接実行しています

## Web panel でできること

1 画面で以下を扱えます。

- 現在の run status
- task / phase / iteration
- pending question 一覧
- answered question 一覧
- blocker 一覧
- prompt injection queue
- recent events
- agent output tail
- `Refresh`
- `Pause`
- `Resume`
- `Abort`
- question への answer 入力
- 次ターン用の手動 note 注入

## Discord bridge

Discord token を入れると、gateway bot として動作します。

通知:
- 実行開始
- `[[STATUS]]`
- `[[QUESTION]]`
- `[[BLOCKER]]`
- `[[DONE]]`

操作:
- `/status`
- `/pause`
- `/resume`
- `/abort`
- `/answer Q-001 staging を優先してください`
- `/note 次ターンは panel 完成を優先`

優先通知先:
- `RALPH_DISCORD_DM_USER_ID` があれば DM
- 未設定なら `RALPH_DISCORD_NOTIFY_CHANNEL_ID`

重要:
- 現状の Discord 操作は「登録済み slash command」ではなく、`/status` 形式の message command です
- temporary tool としての MVP を優先し、重い依存を避けています

## 回答待ちでも止めないポリシー

この実装の重要な運用ルールです。

1. agent が `[[QUESTION]]` を出しても supervisor は停止しません
2. 質問は `state/questions.json` に pending として保存されます
3. Web / Discord / ローカルファイルから回答できます
4. 回答は `state/answers.json` に保存されます
5. 次ターン prompt の末尾に以下形式で一度だけ注入されます

```text
先ほどの質問の答えが届きました:
- Q-001: staging を優先してください
```

手動 note も同様に一度だけ注入されます。

```text
追加の運用メモが届きました:
- N-001: まず panel を仕上げてください
```

## Structured markers

agent 出力から以下を検出します。

```text
[[STATUS]] ...
[[QUESTION]] ...
[[BLOCKER]] ...
[[DONE]] ...
```

処理内容:
- `STATUS`: 現在状態更新 + log 追記
- `QUESTION`: pending question 登録 + 通知 + Web 表示
- `BLOCKER`: blocker 登録 + 通知 + Web 表示
- `DONE`: run 完了更新

マーカー parser には unit test があります。

## state / log ファイル

デフォルトでは以下を使います。

```text
state/status.json
state/questions.json
state/answers.json
state/manual-notes.json
state/blockers.json
state/answer-inbox.jsonl
state/note-inbox.txt
logs/events.jsonl
logs/agent-output.log
```

ローカルファイル fallback:

- `state/answer-inbox.jsonl`

```json
{"questionId":"Q-001","answer":"staging を優先してください"}
```

- `state/note-inbox.txt`

```text
テストより先に panel の確認を優先してください
```

supervisor / panel / actions はこれらの inbox を読み込み、同じ state に反映します。

## 環境変数

主な設定は `.env.example` に入っています。

- `RALPH_AGENT_COMMAND`
- `RALPH_AGENT_MODE`
- `RALPH_PROMPT_FILE`
- `RALPH_STATE_DIR`
- `RALPH_LOG_DIR`
- `RALPH_MAX_ITERATIONS`
- `RALPH_IDLE_SECONDS`
- `RALPH_PANEL_HOST`
- `RALPH_PANEL_PORT`
- `RALPH_TASK_NAME`
- `RALPH_DISCORD_TOKEN`
- `RALPH_DISCORD_NOTIFY_CHANNEL_ID`
- `RALPH_DISCORD_DM_USER_ID`
- `RALPH_DISCORD_APP_NAME`

## 構成

```text
src/actions      共通 action layer
src/cli          起動エントリ
src/demo         demo agent
src/discord      Discord bridge
src/panel        Web panel
src/parser       structured marker parser
src/prompt       prompt composition
src/state        JSON / JSONL state store
src/supervisor   run supervisor
```

詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## legacy ファイル

以下は旧 minimal 版の資産として残しています。

- [ralph.sh](./ralph.sh)
- [dashboard.py](./dashboard.py)
- [prompt.md](./prompt.md)

新しい導線は TypeScript 実装です。legacy は移行理由を追えるよう残しているだけで、主運用対象ではありません。

## 検証済み

以下を実行して確認しています。

```bash
npm run test
npm run lint
npm run build
```

加えて、demo mode を同一 PowerShell セッションで起動し、以下を確認しました。

- question 発生
- Web API 経由の answer 投入
- prompt injection
- `DONE` による完了

## 制約

- 本格的な multi-agent orchestration は未対応
- 認証なしの internal / localhost 前提 panel
- Discord は message command ベースで、正式な slash command 登録までは未実装
- state 書き込みは temporary tool 優先でシンプル実装です
