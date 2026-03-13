# Architecture

## 方針

temporary tool として、少ない仕組みで Codex 運用を安定させることを優先しています。

- 1 repo / 1 agent / 1 run
- file based state
- unanswered question でも止めない
- Web と Discord は同じ action layer を使う
- UI 層に状態遷移を埋め込まない

## レイヤ

### `src/state`

`FileStateStore` が JSON / JSONL / テキストを読み書きします。

- `status.json`
- `questions.json`
- `answers.json`
- `manual-notes.json`
- `blockers.json`
- `answer-inbox.jsonl`
- `note-inbox.txt`
- `events.jsonl`
- `agent-output.log`

### `src/actions`

運用ロジックの中心です。

- `getStatus`
- `pauseRun`
- `resumeRun`
- `abortRun`
- `submitAnswer`
- `enqueueManualNote`
- `listPendingQuestions`
- `listAnsweredQuestions`
- `preparePromptForNextTurn`
- `handleAgentOutput`

Web と Discord はここだけを呼びます。

### `src/parser`

Codex 出力から `[[STATUS]]` などの structured marker を抽出します。

### `src/prompt`

未注入の answer / note を prompt 末尾へ一度だけ差し込みます。

### `src/supervisor`

反復実行を管理します。

- pause / resume / abort を監視
- prompt を組み立てて agent を起動
- output を log に保存
- marker を action layer に流す
- question 未回答でも loop を継続

### `src/panel`

軽量 HTTP サーバーです。

- dashboard 表示
- answer
- note injection
- pause / resume / abort

### `src/discord`

軽量な gateway bot です。

- 通知送信
- `/status` などの message command 受信
- answer / note / control を action layer に委譲

## prompt injection の流れ

1. question は pending として保存
2. answer は `answers.json` に保存
3. 次ターン開始前に未注入 answer / note を収集
4. prompt 末尾へ自然文で差し込み
5. `injectedAt` を付けて再注入を防止

## local fallback

Discord なしでも以下で回ります。

- Web panel から操作
- `state/answer-inbox.jsonl` に回答追記
- `state/note-inbox.txt` に note 追記
- `npm run demo` で一連の流れを確認
