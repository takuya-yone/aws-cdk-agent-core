---
inclusion: always
---

# プロジェクト概要

AWS CDK TypeScript プロジェクト。Amazon Bedrock AgentCore Runtime 上で Strands Agents SDK ベースのマルチエージェントシステムをデプロイする。

## 技術スタック

- IaC: AWS CDK (TypeScript) — `lib/` 配下
- Agent Runtime: Strands Agents SDK (Python) + FastAPI — `src/agent/` 配下
- Lambda: TypeScript (Hono ベースの API ルーター) — `src/lambda/` 配下
- LLM: Amazon Nova Pro / Nova Lite
- パッケージ管理: pnpm (TypeScript) / uv (Python)
- Lint/Format: Biome (TypeScript) / Ruff (Python)
- テスト: Vitest (TypeScript) / pytest (Python)
- Node.js 24.x / Python 3.14

## コマンド

### ビルド・デプロイ

```bash
pnpm run build        # TypeScript 型チェック (tsc --noEmit)
pnpm cdk synth        # CloudFormation テンプレート生成
pnpm cdk deploy       # スタックデプロイ
pnpm cdk diff         # デプロイ済みスタックとの差分確認
```

### Lint・Format

```bash
pnpm biome:fix        # TypeScript フォーマット/リント修正 (bin/ lib/ src/ tests/)
pnpm biome:dry        # TypeScript チェックのみ
pnpm ruff:fix         # Python フォーマット/リント修正 (src/ tools/ tests/)
pnpm ruff:dry         # Python チェックのみ
```

### テスト

```bash
pnpm run test         # Vitest (TypeScript)
pnpm run pytest       # pytest + coverage (Python)
```

### ローカル開発

```bash
pnpm run dev          # Lambda プロキシ ローカル起動 (Port:3000, .env 必要)
cd src/agent && uv sync && source .venv/bin/activate && python main.py  # AgentCore ローカル (Port:8080)
```

## pre-commit フック

`pnpm biome:dry` と `pnpm ruff:dry` が pre-commit で実行される。コード変更後はこれらが通ることを確認すること。
