# Minimal Example

最短で RalphLoop を試すための最小構成です。

この example は Codex CLI を前提にせず、`demo` mode で自己完結します。repo を clone した直後でも、そのまま確認できます。

```bash
cp examples/minimal/.env.example .env
npm run check
./ralph demo
```

この example は以下を前提にしています。

- Web panel を主導線として使う
- prompt は `examples/minimal/prompt.md`
- task catalog は `examples/minimal/task-catalog.json`
- 実行コマンドは不要で、質問回答の注入まで demo で確認できる

`task-catalog.json` を自分の repo 向けに作りたいときは、[docs/task-catalog.md](../../docs/task-catalog.md) の最小フォーマットと ChatGPT / Codex 向けテンプレートを使うと早いです。
