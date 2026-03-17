# RalphLoop v1.1

ラルフ・ループは、特定の AI コーディングエージェントに依存しない汎用 orchestration loop です。  
Claude、Codex、Gemini、Qwen、Ollama 経由のローカルモデルなど、`stdin` で prompt を受け取れる CLI であれば同じ枠組みで回せます。

この fork は、元のシンプルな bash loop をベースにしつつ、次の運用機能を追加しています。

- `./ralph` ひとつで回せる supervisor / Web panel / Discord bridge
- shared state による「現在の Task / 次の Task / 質問 / 回答 / blocker / log」の一元管理
- README や PRD からの task catalog import
- 質問待ちでも loop を止めず、次ターン prompt に回答を一度だけ注入する運用

![Panel overview](./docs/assets/panel-overview.svg)

## Ralph とは

Ralph の基本パターンは単純です。

1. prompt と task catalog を AI エージェントへ渡す
2. エージェントが 1 run 分の実装、テスト、確認、報告を進める
3. 質問、blocker、完了、進捗を state に記録する
4. 次の run で「今やること」と「次に渡すこと」を更新する

元リポジトリではこれを bash ループで実装していました。  
このリポジトリでは、その考え方を保ったまま、運用を崩しにくくするために panel / state store / Discord 操作を足しています。

## この repo には 2 つの入口があります

- `./ralph`
  推奨。常駐サービスとして supervisor、panel、Discord bridge をまとめて扱います。
- `./ralph.sh`
  元の Ralph に近い最小 bash loop です。単体スクリプトで回したいときに使えます。

通常は `./ralph` を使ってください。  
fork 元に近い最小構成だけ欲しい場合は `./ralph.sh` が向いています。

## 60 秒で試す

まずは agent なしで全体像を確認できます。

前提:

- Node.js 24 以上

```bash
cp .env.example .env
npm run check
./ralph demo
```

これで次を確認できます。

- `http://127.0.0.1:8787` に panel が立つ
- demo agent が `[[QUESTION]]` を出す
- panel から回答すると次ターン prompt に注入される
- demo agent が `[[DONE]]` を返して完了する

最小サンプルだけ先に見たい場合は [examples/minimal/README.md](./examples/minimal/README.md) を使ってください。

## 実エージェントで始める

`.env.example` をコピーし、最低限ここを決めます。

- `RALPH_AGENT_COMMAND`
- `RALPH_AGENT_CWD`
- `RALPH_PROMPT_FILE`
- `RALPH_TASK_CATALOG_FILE` または panel から追加する Task

```bash
cp .env.example .env
npm run check
./ralph
```

既定値は Codex 向けですが、コマンド自体は任意です。  
RalphLoop は `agentCommand` をそのまま子プロセスとして起動し、prompt を `stdin` に流します。
`RALPH_AGENT_CWD` を設定すると、別ディレクトリを作業対象にできます。

### エージェントコマンド例

CLI ごとに自動実行フラグは異なります。代表例は次のとおりです。

```bash
# Codex CLI
codex exec --full-auto --skip-git-repo-check

# Claude Code
claude --dangerously-skip-permissions

# Gemini CLI
gemini --yolo

# Qwen Code
# .qwen/settings.json 側で yolo 相当の権限設定が必要なケースがあります
qwen
```

この repo の `.env.example` は安全側の既定値として Codex 用の次のコマンドを入れています。

```bash
RALPH_AGENT_COMMAND=codex exec --full-auto --skip-git-repo-check
RALPH_AGENT_CWD=.
```

### `stdin` を受けないエージェントを使う場合

agent が prompt を引数でしか受けないなら、小さなラッパーを 1 枚かませれば十分です。

```bash
#!/usr/bin/env bash
set -euo pipefail

PROMPT="$(cat)"
explicit-agent --prompt "$PROMPT"
```

その後、`RALPH_AGENT_COMMAND=./agent-wrapper.sh` のように指定します。

## 何ができるか

- `start / run / start-run / configure / panel / supervisor / discord / demo / status / check` を 1 つの CLI で扱える
- Web panel と Discord が同じ action layer を使うので、どこから触っても state がぶれない
- Task を現在・次・完了で管理し、panel 上で優先順位を前後できる
- README / PRD / issue / 要件メモを panel に貼り、そのまま task catalog として preview / import できる
- `[[QUESTION]]` が出ても loop を止めず、回答は次ターン prompt に 1 回だけ注入する
- `state/*.json` と `logs/*` に運用情報を残し、外部 DB なしで回せる
- Discord から `start / pause / resume / abort / task-edit / answer` などの操作ができる

## Task catalog / PRD の考え方

この repo では、長い仕様書そのものよりも「着手順に並んだ task catalog JSON」を用意する方が運用しやすいです。

最小形:

```json
{
  "userStories": [
    {
      "id": "US-001",
      "title": "最初に進める作業",
      "priority": 1,
      "passes": false,
      "acceptanceCriteria": [
        "確認できる完了条件を書く"
      ]
    }
  ]
}
```

運用のコツ:

- 1 story は 1 run で前進できる大きさにする
- `title` は短く、Task board 上で見てすぐわかる文にする
- `acceptanceCriteria` は確認可能な文にする
- README や issue しかなくても、先に task catalog 化してから loop に渡す

詳しい書式とコピペ用テンプレートは [docs/task-catalog.md](./docs/task-catalog.md) にあります。

## Web panel / supervisor / Discord

### Web panel

panel は「全部のログを並べる画面」ではなく、次の視線順で使う前提です。

1. いまやることを見る
2. 現在の Task と次の Task を確認する
3. 必要ならその場で回答、メモ、Task 追加を行う
4. README や PRD から Task をまとめて投入する

主な要素:

- `いまやること`
- `現在と次`
- `回答待ち`
- `Task ワークスペース`
- `仕様書から一括追加`
- `人の確認待ち`
- `要対応と最近の動き`

### Supervisor

supervisor は run を監督し、agent 出力から `[[STATUS]]` `[[QUESTION]]` `[[BLOCKER]]` `[[DONE]]` を取り込みます。  
panel や Discord から入った回答やメモは、次回 prompt に一度だけ差し込まれます。

### Discord bridge

Discord token を設定すると gateway bot として動作します。

- token だけ設定
  通知専用モード
- `RALPH_DISCORD_ALLOWED_USER_IDS` または `RALPH_DISCORD_DM_USER_ID` も設定
  Discord 側から操作可能
- `RALPH_DISCORD_GUILD_ID` も設定
  操作を受け付ける guild を 1 つに制限

通知:

- 実行開始
- `[[STATUS]]`
- `[[QUESTION]]`
- `[[BLOCKER]]`
- `[[DONE]]`

操作:

- `/help`
- `/start`
- `/status`
- `/config`
- `/pause`
- `/resume`
- `/abort`
- `/tasks`
- `/task-add タイトル | 説明`
- `/task-edit T-001 タイトル | 説明`
- `/task-done T-001`
- `/task-reopen T-001`
- `/answer Q-001 staging を優先してください`
- `/note 次ターンは panel 完成を優先`
- `/set-task repo-wide rebuild`
- `/set-iterations 40`
- `/set-idle 3`
- `/set-mode command`
- `/set-cwd /abs/path/to/repo`
- `/set-prompt-file /abs/path/to/prompt.md`
- `/set-prompt ここに prompt 上書きを書く`
- `/clear-prompt`

`/set-agent` は既定では無効です。`RALPH_ALLOW_RUNTIME_AGENT_COMMAND_OVERRIDE=true` を設定した場合だけ有効になります。

## 主要コマンド

```bash
./ralph
./ralph start
./ralph run "repo-wide rebuild"
./ralph start-run "repo-wide rebuild"
./ralph configure --max-iterations 40 --idle-seconds 3
./ralph configure --cwd /abs/path/to/target-repo
./ralph status
./ralph check
./ralph demo
./ralph panel
./ralph supervisor
./ralph discord
```

補足:

- clone 直後は repo 直下の `./ralph` を使うのが最短です
- `npm link` 済みなら `ralph` としても実行できます
- `./ralph` と `./ralph start` は同義です
- `./ralph run` はサービス起動と同時に 1 回だけ run をキックします
- `./ralph start-run` は既に起動している service へ queued run を追加します
- `./ralph check --json` と `./ralph status --json` が使えます

## `./ralph.sh` を使う最小 loop

fork 元に近い単体 bash loop だけ使いたい場合は `./ralph.sh` を使えます。

```bash
./ralph.sh "<YOUR_AGENT_COMMAND>" [MAX_ITERATIONS]
```

例:

```bash
./ralph.sh "codex exec --full-auto" 20
./ralph.sh "gemini --yolo" 20
```

このモードでは主に次のファイルを使います。

- `prd.json`
- `prompt.md`
- `progress.txt`
- `status.json`
- `answers.txt`
- `events.log`

より強い運用管理が必要なら `./ralph` に移ってください。

## 記憶とコンテキスト

RalphLoop は次の層で状態を持ちます。

- Git 履歴
  agent が実施した変更と commit
- Task catalog
  何をやるか、何が完了済みか
- `state/`
  status、questions、answers、manual notes、tasks、settings、events
- `logs/`
  agent 出力ログ
- `progress.txt`
  シンプルな経過メモを残したいときの補助ファイル

デフォルトの state / log:

```text
state/status.json
state/questions.json
state/answers.json
state/manual-notes.json
state/blockers.json
state/tasks.json
state/settings.json
state/answer-inbox.jsonl
state/note-inbox.txt
state/events.jsonl
logs/agent-output.log
```

## `ralph check` で確認すること

`./ralph check` は以下を診断します。

- Task 名が空でないか
- `promptFile` が存在するか
- 通常実行で `agentCommand` が空でないか
- task catalog JSON が存在し、壊れていないか
- panel host / port が妥当か
- Basic 認証が片側だけ設定されていないか
- runtime `agentCommand` 変更を有効にした場合の保護設定が足りているか
- Discord token、通知先、操作ユーザー制限が揃っているか

## テストと検証

```bash
npm run lint
npm test
npm run check
npm run smoke
npm run build
```

## Repo Guide

- English guide: [README.en.md](./README.en.md)
- Minimal example: [examples/minimal/README.md](./examples/minimal/README.md)
- Task catalog / PRD guide: [docs/task-catalog.md](./docs/task-catalog.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Release checklist: [docs/releasing.md](./docs/releasing.md)
- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Support: [SUPPORT.md](./SUPPORT.md)
- Security: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## License

[MIT](./LICENSE)
