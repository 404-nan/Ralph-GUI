# Migration Note: Ralph v10

## 対象

この note は、v10 の single-active / Mission Control refactor を既存 repo や既存 state へ適用する人向けです。

## 互換性方針

- `ralph` CLI surface は維持
- file-based state は維持
- 既存 `status.json`, `tasks.json`, `settings.json` は読める
- migration は startup 時に自動で行う

## 追加される state

v10 では次のファイルが追加されます。

- `state/meta.json`
- `state/run-report.json`

`meta.json` は schema version と migration metadata を持ちます。`run-report.json` は latest turn outcome、changed files、recent artifacts、test summary、completion evidence を持ちます。

## 既存 state の読み替え

legacy state を読むとき、Ralph は不足 field を safe default で補います。

例:

- `runState`
- `runReason`
- `blockedReason`
- `currentTaskId`
- schema version

legacy `phase / lifecycle / control / maxIntegration` はそのまま残りますが、operator-facing source of truth ではありません。

## 用語変更

v10 では operator-facing task lane を以下へ統一します。

- `current`
- `next`
- `blocked`
- `done`

従来の `active` 表現は廃止しました。`MaxIntegration` も UI / CLI の主要語彙から外れます。

## API 変更

panel API は plain text / ad-hoc response から JSON envelope へ変わります。

成功:

```json
{
  "ok": true,
  "data": {}
}
```

失敗:

```json
{
  "ok": false,
  "error": {
    "code": "forbidden",
    "message": "Origin is not allowed."
  }
}
```

WebSocket 接続には `/api/session` で発行した短命 token が必要です。

## 運用上の変化

- run 完了は `[[DONE]]` だけで決まらない
- `completed` と `needs_review` が分かれる
- setup は preset / diagnostics / quick test を経由できる
- task import は preview-first になる

## 推奨アクション

通常は手動 migration は不要です。起動後に以下だけ確認してください。

1. `./ralph check`
2. `./ralph status`
3. panel の Setup view で diagnostics / quick test

もし古い local state が不整合を起こしている場合は、必要に応じて `./ralph reset` で runtime data を初期化してください。
