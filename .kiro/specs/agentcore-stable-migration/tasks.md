# Implementation Plan: AgentCore Stable Migration

## Overview

This plan implements a behavior-preserving migration from the alpha AgentCore module
(`@aws-cdk/aws-bedrock-agentcore-alpha`) to the stable module
(`aws-cdk-lib/aws-bedrockagentcore`), following the design's sequenced pipeline (Stage 0
through Stage 6). Each stage keeps the project in a compilable state and ends with a
verification checkpoint. The defining constraint is zero change to the synthesized
CloudFormation template, verified by a baseline-then-diff strategy.

Implementation language: **TypeScript** (matches the existing CDK project). Verification uses
template-diff snapshot comparison, single-execution toolchain checks (`pnpm run build`,
`pnpm cdk synth`, `pnpm biome:dry`), and repository-wide search assertions. Property-based
testing does not apply to this feature.

## Tasks

- [x] 1. Stage 0 — Capture pre-migration baseline template
  - [x] 1.1 Synthesize and preserve the baseline template
    - Run `pnpm cdk synth` on the unmodified codebase to generate templates for every stack
    - Copy each synthesized template from `cdk.out/*.template.json` to a baseline location that
      later synths will not overwrite (e.g. `cdk.out/baseline/` or a temp dir outside `cdk.out`)
    - Confirm a baseline template exists for every defined stack (AgentCoreStack, PipelineStack)
    - This baseline is the only trustworthy reference once alpha deps are removed
    - _Requirements: 6.1, 6.2_

- [x] 2. Stage 1 — Swap AgentCore import specifiers
  - [x] 2.1 Swap value import in `lib/constructs/agent-core.ts`
    - Replace only the module specifier `@aws-cdk/aws-bedrock-agentcore-alpha` with
      `aws-cdk-lib/aws-bedrockagentcore`
    - Preserve the `import * as agentcore` value-import form and the `agentcore` binding
    - Leave every other token and every non-import line byte-for-byte unchanged
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 2.2 Swap type-only import in `lib/constructs/api-gw.ts`
    - Replace only the module specifier `@aws-cdk/aws-bedrock-agentcore-alpha` with
      `aws-cdk-lib/aws-bedrockagentcore`
    - Preserve the `import type * as agentcore` type-only-import form and the `agentcore` binding
    - Leave every other token and every non-import line byte-for-byte unchanged
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ]* 2.3 Search assertion: zero alpha AgentCore specifier occurrences
    - Run a repository-wide search for `@aws-cdk/aws-bedrock-agentcore-alpha` across all source files
    - Assert zero occurrences remain after the swap
    - _Requirements: 1.3_

- [ ] 3. Stage 2 — Rename MemoryStrategy `name` → `strategyName`
  - [ ] 3.1 Rename the key in all four commented-out MemoryStrategy configs
    - In `lib/constructs/agent-core.ts`, rename `name:` to `strategyName:` in the
      `usingSummarization`, `usingSemantic`, `usingUserPreference`, and `usingEpisodic` configs
    - Preserve each assigned string value and its quoting byte-for-byte
    - Leave `namespaces` and `reflectionConfiguration` keys and values unchanged
    - Leave all four configurations in their commented-out state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4. Stage 3 — Guard pass for remaining PR #37876 renames
  - [ ] 4.1 Search the codebase for remaining renamed members/types (expected zero matches)
    - Search for `IGateway.name`, `IGatewayTarget.name`, `BrowserCustom.name`,
      `CodeInterpreterCustom.name`, `MemoryStrategyCommonProps.name`
    - Search for `ApiKeyCredentialProviderProps`, `ApiKeyCredentialProviderResourceProps`
    - Search for `EvaluatorReference`, `EvaluatorReferenceBindResult`
    - Search for `metric(` positional `dimensions` arguments and `OverrideConfig.model` typed
      `IBedrockInvokable`
    - If any match is found, apply the corresponding stable rename per Requirement 3; otherwise
      make no edits
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8_

- [ ] 5. Stage 4 — Remove unused alpha dependencies and regenerate lockfile
  - [ ] 5.1 Confirm no live references to either alpha package
    - Search `bin/`, `lib/`, `src/`, `tests/` for live (non-commented) import/require references
      to `@aws-cdk/aws-bedrock-agentcore-alpha` and `@aws-cdk/aws-bedrock-alpha`
    - Proceed to removal only if zero live references exist; otherwise retain the referenced
      package, leave `package.json`/lockfile unchanged, and report the reference
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 5.2 Remove alpha entries from `package.json` and regenerate the lockfile
    - Remove `@aws-cdk/aws-bedrock-agentcore-alpha` and `@aws-cdk/aws-bedrock-alpha` from the
      `dependencies` section
    - Retain the existing `aws-cdk-lib` dependency
    - Run `pnpm install` to regenerate `pnpm-lock.yaml`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.3 Search assertion: zero alpha package keys remain
    - Assert `pnpm-lock.yaml` contains zero occurrences of either alpha package as a package key
    - Assert no live import/require references to either alpha package remain under
      `bin/`, `lib/`, `src/`, `tests/`
    - _Requirements: 4.3_

- [ ] 6. Checkpoint — Source and dependency edits complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Stage 5 — Verify toolchain (single-execution checks)
  - [ ] 7.1 Run build and synth checks
    - Run `pnpm run build` (`tsc --noEmit`); require exit 0 with zero type errors
    - Run `pnpm cdk synth`; require exit 0 and a template produced for every defined stack
    - If either fails due to the migration, correct and re-run until exit 0
    - _Requirements: 1.5, 4.6, 5.1, 5.2, 5.3, 5.5, 6.5_

  - [ ] 7.2 Run Biome check
    - Run `pnpm biome:dry`; require exit 0 with zero errors and zero warnings across
      `bin/ lib/ src/ tests/`
    - If it fails, apply `pnpm biome:fix` or hand-correct, then re-run
    - _Requirements: 5.4_

- [ ] 8. Stage 6 — Verify template equivalence against baseline
  - [ ] 8.1 Diff post-migration templates against the Stage 0 baseline
    - Perform a JSON deep-equal (or `cdk diff` template-to-template) of each post-migration
      template against its Stage 0 baseline
    - Require zero added, removed, or modified resources, resource properties, or IAM policy
      statements
    - If any difference is detected, treat the migration as failed, revert the offending change,
      and report the difference
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 8.2 Focused equivalence assertions on AgentCore resources
    - Assert the Memory resource retains `expirationDuration` of 7 days
    - Assert the Runtime resource retains every environment variable key and value
    - Assert all attached managed policies and inline IAM grant statements are unchanged
    - _Requirements: 6.1, 6.3_

  - [ ]* 8.3 Edit-scope verification on the two source files
    - Inspect the per-file diff for `agent-core.ts` and `api-gw.ts` to confirm only import
      specifiers and the four commented `name`→`strategyName` keys changed
    - Confirm the four MemoryStrategy configs remain commented out
    - _Requirements: 1.4, 2.2, 2.3, 2.4, 6.3_

- [ ] 9. Final checkpoint — Migration accepted
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional verification/assertion sub-tasks and can be skipped for a
  faster path, though they directly back Requirements 1.3, 4.3, and 6.
- Each task references specific requirements (granular clauses) for traceability.
- Stage 0 must run before any edits — the baseline cannot be recreated once alpha deps are removed.
- Property-based testing is not used; verification relies on template-diff snapshot comparison,
  single-execution toolchain checks, and repository-wide search assertions.
- All toolchain commands are single-execution (non-watch) checks.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "3.1", "4.1"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["5.3", "7.1", "7.2"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3"] }
  ]
}
```
