# Implementation Plan: GitHub Actions CI

## Overview

`.github/workflows/ci.yml` に 4 つの並列ジョブ (Lint, Test, Build, Synth) を持つ CI ワークフローを作成する。設計ドキュメントの YAML 定義に従い、TypeScript (pnpm) と Python (uv) の両ツールチェーンをセットアップし、依存関係キャッシュを有効化する。

## Tasks

- [x] 1. Create CI workflow file with trigger configuration and Lint job
  - Create `.github/workflows/ci.yml`
  - Define workflow name as `CI`
  - Configure triggers: `push` to `main` and `pull_request` targeting `main`
  - Implement the Lint job with all steps:
    - `actions/checkout@v6`
    - `pnpm/action-setup@v6` (pnpm version auto-detected from `packageManager`)
    - `actions/setup-node@v6` with `node-version: "24"` and `cache: "pnpm"`
    - `astral-sh/setup-uv@v8`
    - `actions/setup-python@v6` with `python-version: "3.14"` and `allow-prereleases: true`
    - `pnpm install --frozen-lockfile`
    - `uv sync`
    - `pnpm lint:dry` (oxlint + oxfmt TypeScript lint/format)
    - `pnpm ruff:dry` (Ruff Python lint)
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3_

- [x] 2. Add Test, Build, and Synth jobs
  - Add the Test job with TypeScript + Python setup:
    - Same checkout, pnpm, Node.js, uv, Python setup as Lint job
    - `pnpm install --frozen-lockfile` and `uv sync`
    - `pnpm run test` (Vitest)
    - `pnpm run pytest` (pytest)
  - Add the Build job (TypeScript only):
    - Checkout, pnpm, Node.js setup (no Python/uv needed)
    - `pnpm install --frozen-lockfile`
    - `pnpm run build` (tsc --noEmit)
  - Add the Synth job (TypeScript only):
    - Checkout, pnpm, Node.js setup (no Python/uv needed)
    - `pnpm install --frozen-lockfile`
    - `pnpm cdk synth`
  - Ensure all 4 jobs have no `needs` dependencies (parallel execution)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 9.1, 9.2, 9.3, 9.4_

- [x] 3. Final checkpoint
  - Verify YAML syntax is valid
  - Ensure all 4 jobs are defined and independent (no `needs` keys)
  - Confirm caching is configured: `cache: "pnpm"` on `setup-node`, `setup-uv` built-in cache
  - Confirm `allow-prereleases: true` is set for Python 3.14 in Lint and Test jobs
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- No property-based tests — this is a declarative YAML configuration (IaC-like)
- The workflow file is the only deliverable; no application code changes needed
- Verification is done by creating a PR and observing the workflow execution on GitHub
