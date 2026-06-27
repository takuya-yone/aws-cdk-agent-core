# Requirements Document

## Introduction

GitHub Actions CI ワークフローを構成し、プルリクエストおよびメインブランチへのプッシュ時に、TypeScript / Python 両方のコードベースに対して Lint、テスト、ビルドチェックを自動実行する。既存の pnpm / uv ベースのスクリプトを活用し、CI パイプラインとして統合する。

## Glossary

- **CI_Workflow**: GitHub Actions 上で実行される CI ワークフロー全体を指す
- **Lint_Job**: oxlint + oxfmt (TypeScript) および Ruff (Python) による静的解析・フォーマットチェックを実行するジョブ
- **Test_Job**: Vitest (TypeScript) および pytest (Python) によるテスト実行ジョブ
- **Build_Job**: TypeScript の型チェック (`tsc --noEmit`) を実行するジョブ
- **Synth_Job**: AWS CDK の CloudFormation テンプレート生成 (`pnpm cdk synth`) を実行するジョブ
- **Runner**: GitHub Actions のワークフローを実行する仮想マシン環境 (ubuntu-latest)
- **Target_Branch**: CI トリガーの対象ブランチ (main)
- **pnpm**: TypeScript 側のパッケージマネージャー (v10.33.2)
- **uv**: Python 側のパッケージマネージャー

## Requirements

### Requirement 1: CI ワークフロートリガー

**User Story:** As a developer, I want the CI workflow to run automatically on pull requests and pushes to main, so that code quality is validated before merging.

#### Acceptance Criteria

1. WHEN a pull request is opened or updated targeting the Target_Branch, THE CI_Workflow SHALL trigger all CI jobs.
2. WHEN a commit is pushed to the Target_Branch, THE CI_Workflow SHALL trigger all CI jobs.
3. THE CI_Workflow SHALL execute on the `ubuntu-latest` Runner.

### Requirement 2: TypeScript Lint・フォーマットチェック

**User Story:** As a developer, I want TypeScript code to be automatically checked for lint and format issues, so that code style remains consistent.

#### Acceptance Criteria

1. THE Lint_Job SHALL install Node.js 24.x and pnpm 10.33.2 on the Runner.
2. THE Lint_Job SHALL install npm dependencies using `pnpm install --frozen-lockfile`.
3. THE Lint_Job SHALL execute `pnpm lint:dry` to check TypeScript lint and format compliance.
4. IF `pnpm lint:dry` returns a non-zero exit code, THEN THE Lint_Job SHALL fail the CI_Workflow.

### Requirement 3: Python Lint・フォーマットチェック

**User Story:** As a developer, I want Python code to be automatically checked for lint and format issues, so that code style remains consistent.

#### Acceptance Criteria

1. THE Lint_Job SHALL install Python 3.14 and uv on the Runner.
2. THE Lint_Job SHALL execute `pnpm ruff:dry` to check Python lint and format compliance.
3. IF `pnpm ruff:dry` returns a non-zero exit code, THEN THE Lint_Job SHALL fail the CI_Workflow.

### Requirement 4: TypeScript テスト実行

**User Story:** As a developer, I want TypeScript tests to run automatically in CI, so that regressions are caught early.

#### Acceptance Criteria

1. THE Test_Job SHALL install Node.js 24.x and pnpm 10.33.2 on the Runner.
2. THE Test_Job SHALL install npm dependencies using `pnpm install --frozen-lockfile`.
3. THE Test_Job SHALL execute `pnpm run test` to run Vitest tests.
4. IF any Vitest test fails, THEN THE Test_Job SHALL fail the CI_Workflow.

### Requirement 5: Python テスト実行

**User Story:** As a developer, I want Python tests to run automatically in CI, so that regressions are caught early.

#### Acceptance Criteria

1. THE Test_Job SHALL install Python 3.14 and uv on the Runner.
2. THE Test_Job SHALL execute `pnpm run pytest` to run pytest with coverage.
3. IF any pytest test fails, THEN THE Test_Job SHALL fail the CI_Workflow.

### Requirement 6: TypeScript ビルドチェック

**User Story:** As a developer, I want TypeScript type checking to run in CI, so that type errors are caught before merging.

#### Acceptance Criteria

1. THE Build_Job SHALL install Node.js 24.x and pnpm 10.33.2 on the Runner.
2. THE Build_Job SHALL install npm dependencies using `pnpm install --frozen-lockfile`.
3. THE Build_Job SHALL execute `pnpm run build` to perform TypeScript type checking.
4. IF `pnpm run build` returns a non-zero exit code, THEN THE Build_Job SHALL fail the CI_Workflow.

### Requirement 7: 依存関係キャッシュ

**User Story:** As a developer, I want CI to cache dependencies, so that workflow execution time is minimized.

#### Acceptance Criteria

1. THE CI_Workflow SHALL cache pnpm store across workflow runs using the `pnpm/action-setup` built-in cache or GitHub Actions cache.
2. THE CI_Workflow SHALL cache uv dependencies across workflow runs.
3. WHEN cached dependencies are available and lock files have not changed, THE CI_Workflow SHALL restore dependencies from cache instead of re-installing.

### Requirement 8: ジョブ並列実行

**User Story:** As a developer, I want CI jobs to run in parallel where possible, so that feedback is received quickly.

#### Acceptance Criteria

1. THE CI_Workflow SHALL execute the Lint_Job, Test_Job, Build_Job, and Synth_Job in parallel (no inter-job dependencies).
2. IF any individual job fails, THEN THE CI_Workflow SHALL report that job as failed independently of other jobs.

### Requirement 9: CDK Synth 検証

**User Story:** As a developer, I want the CI workflow to verify that CDK synth succeeds, so that CloudFormation template generation errors are caught before merging.

#### Acceptance Criteria

1. THE Synth_Job SHALL install Node.js 24.x and pnpm 10.33.2 on the Runner.
2. THE Synth_Job SHALL install npm dependencies using `pnpm install --frozen-lockfile`.
3. THE Synth_Job SHALL execute `pnpm cdk synth` to generate CloudFormation templates.
4. IF `pnpm cdk synth` returns a non-zero exit code, THEN THE Synth_Job SHALL fail the CI_Workflow.
