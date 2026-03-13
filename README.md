# Ralph Loop（暫定運用向け）

このリポジトリは、LuLOS を作るまでの一時運用でも使いやすいように、Ralph を **止めずに回し続ける** ための機能をまとめています。

- CLIで進捗が見える
- AIの発話を明確に見分けられる
- Discord通知（任意）
- Webパネルだけでも同等の監視・回答入力ができる
- AIから質問が出ても、回答待ちで停止せず継続する

## 使い方（クイックスタート）

```bash
chmod +x ./ralph-loop/ralph.sh
./ralph-loop/ralph.sh "codex exec --full-auto" 20
```

## 使い方解説

### 1. 事前準備

1. `ralph-loop/prd.json` に実行したいストーリーを用意
2. `ralph-loop/prompt.md` にエージェントへ渡す指示を記載
3. エージェントCLI（例: Codex CLI）がこの環境で実行できる状態にする

### 2. ループ実行

```bash
./ralph-loop/ralph.sh "codex exec --full-auto" 20
```

- 第1引数: エージェント実行コマンド
- 第2引数: 最大反復回数（省略時は `MAX_ITERATIONS` か既定値 `10`）

### 3. 実行中に確認するもの

- CLI上の進捗表示（完了数/残数/次ストーリー）
- `status.json`（機械可読ステータス）
- `events.log`（通知イベント）
- `questions.log`（AIからの質問）

### 4. AIから質問が来たとき

AIが以下を出力した場合:

```text
<question>...</question>
```

- ループは停止せず継続
- 質問は `questions.log` と `events.log` に記録
- 人間は `answers.txt` へ回答を追記（またはWebパネルで送信）
- 回答は次回プロンプトへ自動注入

### 5. よく使う環境変数

```bash
MAX_ITERATIONS=20 \
SLEEP_SECONDS=1 \
SHOW_PROGRESS_LINES=8 \
AI_OUTPUT_PREFIX="🤖 AI> " \
./ralph-loop/ralph.sh "codex exec --full-auto"
```

- `MAX_ITERATIONS`（既定: `10`）
- `SLEEP_SECONDS`（既定: `2`）
- `SHOW_PROGRESS_LINES`（既定: `5`）
- `AI_OUTPUT_PREFIX`（既定: `🤖 AI> `）
- `DISCORD_WEBHOOK_URL`（任意）
- `STATUS_FILE`（既定: `status.json`）
- `ANSWER_FILE`（既定: `answers.txt`）
- `EVENT_LOG_FILE`（既定: `events.log`）

## Webパネル

```bash
python3 ./ralph-loop/dashboard.py
# http://localhost:8787
```

Webパネルでは以下ができます。

- 現在状態の確認
- `progress.txt` / `questions.log` / `events.log` の末尾確認
- `answers.txt` への回答追記

## Discord通知（任意）

```bash
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." \
./ralph-loop/ralph.sh "codex exec --full-auto" 20
```

Discordを使わない場合でも、同等の通知は `events.log` に保存され、Webパネルから確認できます。
