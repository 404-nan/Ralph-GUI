# Task Catalog / PRD Guide

RalphGUI は `RALPH_TASK_CATALOG_FILE` で指定した JSON を起点に Task board を作れます。
「何を書けばよいかわからない」を避けるために、最小構成と ChatGPT / Codex 向けの依頼テンプレートをここにまとめます。

## 最小構成

必要なのは `userStories` 配列です。

- `id`: 必須。`US-001` のような一意な文字列
- `title`: 必須。Task board に出る短いタイトル
- `priority`: 任意。`1` が最優先、`4` が低優先
- `passes`: 任意。すでに完了扱いなら `true`
- `acceptanceCriteria`: 任意。確認可能な完了条件の配列
- `notes`: 任意。補足メモ

```json
{
  "userStories": [
    {
      "id": "US-001",
      "title": "ログイン画面を出す",
      "priority": 1,
      "passes": false,
      "acceptanceCriteria": [
        "未ログイン時にログイン画面へ遷移する",
        "メールアドレスとパスワードを入力できる"
      ],
      "notes": "まずはメール認証だけでよい"
    },
    {
      "id": "US-002",
      "title": "ログイン失敗を通知する",
      "priority": 2,
      "passes": false,
      "acceptanceCriteria": [
        "認証失敗時にエラーメッセージが出る",
        "サーバーエラーと入力ミスを区別して表示する"
      ]
    }
  ]
}
```

保存したら `.env` で読み込みます。

```bash
RALPH_TASK_CATALOG_FILE=prd.json
./ralph check
./ralph
```

## どう書けばよいか

Task catalog は「仕様書そのもの」より「実行順に近い実装単位」を書くほうが扱いやすいです。

- 1 story = 1 run で前進できる程度の大きさにする
- `title` は短く、実装対象がわかる文にする
- `acceptanceCriteria` は画面や API の確認観点で書く
- 大きな README や PRD をそのまま貼るより、5-15 件くらいの story に分解する
- 未確定事項は `notes` に寄せ、`title` に混ぜすぎない

## GitHub README や URL から作らせる

リンクを読める ChatGPT / Codex 系のチャットなら、README や docs の URL から task catalog を作らせるのが一番早いです。

### 1. ファイルまで作れるチャット向け

このまま渡せます。

```text
この GitHub README / docs を読んで、この repo 用の RalphGUI task catalog JSON を作ってください。

入力ソース:
- https://example.com/path/to/README

出力要件:
- 保存先は repo root の `prd.json`
- 形式は以下の JSON にする
  {
    "userStories": [
      {
        "id": "US-001",
        "title": "...",
        "priority": 1,
        "passes": false,
        "acceptanceCriteria": ["..."],
        "notes": "..."
      }
    ]
  }
- story は 5-15 件に絞る
- 1 story は 1 run で前進できる粒度にする
- acceptanceCriteria は確認可能な文にする
- 既存 README にある機能、制約、セットアップ手順、未実装っぽい項目を読み取って分解する
- JSON 以外の説明は不要
```

### 2. ファイル保存まではできないチャット向け

```text
この README / URL を読んで、RalphGUI の task catalog JSON だけをコードブロックで返してください。

条件:
- `userStories` 配列を持つ JSON にする
- 各 story に `id`, `title`, `priority`, `passes`, `acceptanceCriteria` を入れる
- `priority` は 1-4
- `passes` はすべて false でよい
- まず着手順に並べる
- 余計な説明文は不要
```

返ってきた JSON を `prd.json` に保存して、`.env` へ `RALPH_TASK_CATALOG_FILE=prd.json` を設定します。

## ざっくりした仕様メモから作る

URL がなくても、箇条書きのメモから十分作れます。

```text
- LP を作る
- 問い合わせフォームを付ける
- 管理画面で問い合わせ一覧を見る
- メール通知も欲しい
```

こういうラフな入力でも、ChatGPT / Codex に次のように頼めます。

```text
次のメモを RalphGUI 用の task catalog JSON に整理してください。
- LP を作る
- 問い合わせフォームを付ける
- 管理画面で問い合わせ一覧を見る
- メール通知も欲しい

条件:
- `userStories` 配列形式
- id は `US-001` から連番
- acceptanceCriteria を各 story に 2-3 個付ける
- 実装順に並べる
```

## 迷ったときの基準

- README しかない: まず ChatGPT / Codex に task catalog JSON を作らせる
- PRD はあるが長い: 5-15 件に圧縮した `userStories` へ落とす
- 要件がまだ荒い: ラフなメモを渡して最初の `prd.json` を作る
- 途中で順番を変えたい: panel で Task を前後に動かす
