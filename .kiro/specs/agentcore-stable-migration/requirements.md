# Requirements Document

## Introduction

This feature migrates the project from the alpha AWS CDK Bedrock AgentCore module
(`@aws-cdk/aws-bedrock-agentcore-alpha`) to the stabilized module shipped inside
`aws-cdk-lib` as `aws-cdk-lib/aws-bedrockagentcore`, following AWS CDK PR #37876.

The migration covers updating all import statements, applying the breaking-change API
renames introduced by graduation to STABLE, removing the now-unused alpha package(s)
from `package.json` and the lockfile, and confirming that the existing build
(`pnpm run build`) and synthesis (`pnpm cdk synth`) continue to succeed without behavioral
change to the synthesized CloudFormation template.

The project currently uses the AgentCore module in two source files: `lib/constructs/agent-core.ts`
(uses `Memory`, `MemoryStrategy`, `Runtime`, `AgentRuntimeArtifact`) and `lib/constructs/api-gw.ts`
(uses `Runtime` as a prop type). The companion alpha package `@aws-cdk/aws-bedrock-alpha` is a peer
dependency of the AgentCore alpha package, and its imports are already commented out in the codebase.

## Glossary

- **Migration**: The complete set of source and configuration changes that move the project from the alpha AgentCore module to the stable module.
- **AgentCore_Alpha_Module**: The npm package `@aws-cdk/aws-bedrock-agentcore-alpha` currently depended upon.
- **AgentCore_Stable_Module**: The stabilized module `aws-cdk-lib/aws-bedrockagentcore` provided within `aws-cdk-lib`.
- **Bedrock_Alpha_Module**: The npm package `@aws-cdk/aws-bedrock-alpha`, a peer dependency of AgentCore_Alpha_Module whose imports are commented out in the project.
- **Codebase**: All TypeScript source files under `bin/`, `lib/`, `src/`, and `tests/`.
- **Package_Manifest**: The `package.json` file at the project root.
- **Lockfile**: The `pnpm-lock.yaml` file at the project root.
- **Build_Check**: The command `pnpm run build` (`tsc --noEmit`) that performs TypeScript type checking.
- **Synth_Check**: The command `pnpm cdk synth` that generates the CloudFormation template.
- **Renamed_Member**: A class or interface member whose name changed during graduation to STABLE (e.g., `IMemoryStrategy.name` to `IMemoryStrategy.strategyName`).

## Requirements

### Requirement 1: Update AgentCore module imports

**User Story:** As a developer, I want all AgentCore imports to reference the stable module, so that the project no longer depends on the alpha package for AgentCore constructs.

#### Acceptance Criteria

1. IF a source file in the Codebase contains an import whose module specifier is exactly `@aws-cdk/aws-bedrock-agentcore-alpha`, THEN THE Migration SHALL replace only that module specifier string with `aws-cdk-lib/aws-bedrockagentcore`, leaving the remaining tokens of the import statement unchanged.
2. THE Migration SHALL preserve the existing import form of each updated AgentCore import, retaining the `import * as agentcore` value-import form where a value import exists and the `import type * as agentcore` type-only-import form where a type-only import exists, and SHALL preserve the local binding identifier `agentcore` in both forms.
3. WHEN the import update is complete, THE Codebase SHALL contain zero occurrences of the module specifier `@aws-cdk/aws-bedrock-agentcore-alpha` across all source files.
4. WHEN the import update is complete, THE Migration SHALL leave every line not part of an AgentCore import statement byte-for-byte unchanged in each affected source file.
5. WHEN the import update is complete, THE Codebase SHALL pass the TypeScript type-check command `pnpm run build` (`tsc --noEmit`) with exit code 0 and no compilation errors.

### Requirement 2: Apply MemoryStrategy member rename

**User Story:** As a developer, I want the renamed MemoryStrategy member to use the stable name, so that memory strategy configurations remain valid under the stable module.

#### Acceptance Criteria

1. WHERE a `MemoryStrategy` configuration in `lib/constructs/agent-core.ts` specifies a property named `name`, THE Migration SHALL rename that property key to `strategyName`.
2. THE Migration SHALL apply the `name` to `strategyName` rename to all four commented-out `MemoryStrategy` configurations (`usingSummarization`, `usingSemantic`, `usingUserPreference`, `usingEpisodic`) in `lib/constructs/agent-core.ts`, leaving the configurations in their commented-out state.
3. WHEN renaming a `name` property to `strategyName`, THE Migration SHALL preserve the assigned value byte-for-byte, including its string literal and quoting.
4. THE Migration SHALL leave every other property within each `MemoryStrategy` configuration (including `namespaces` and `reflectionConfiguration`) unchanged in key and value.
5. IF a `MemoryStrategy` configuration contains no property named `name`, THEN THE Migration SHALL leave that configuration unchanged and SHALL NOT introduce a `strategyName` property.

### Requirement 3: Apply remaining breaking-change member renames where present

**User Story:** As a developer, I want every breaking-change rename from the stabilization to be applied wherever the affected members are used, so that the project compiles against the stable module.

#### Acceptance Criteria

1. WHERE the Codebase references `IGateway.name`, `IGatewayTarget.name`, `BrowserCustom.name`, `CodeInterpreterCustom.name`, or `MemoryStrategyCommonProps.name` (as a property access, object literal key, or destructured binding), THE Migration SHALL replace each occurrence with its stable equivalent (`gatewayName`, `gatewayTargetName`, `browserCustomName`, `codeInterpreterCustomName`, and `strategyName` respectively), leaving the assigned value and all surrounding code unchanged.
2. WHERE the Codebase references the type identifier `ApiKeyCredentialProviderProps` used as gateway configuration (in a type annotation, type argument, or import specifier), THE Migration SHALL replace each occurrence of the identifier with `ApiKeyCredentialProviderOptions`.
3. WHERE the Codebase references the type identifier `ApiKeyCredentialProviderResourceProps` used as a constructor property type (in a type annotation, type argument, or import specifier), THE Migration SHALL replace each occurrence of the identifier with `ApiKeyCredentialProviderProps`.
4. WHERE the Codebase references `EvaluatorReference` or `EvaluatorReferenceBindResult` (as a type annotation, type argument, value expression, or import specifier), THE Migration SHALL replace each occurrence with `EvaluatorSelector` or `EvaluatorSelectorBindResult` respectively.
5. WHERE the Codebase calls the AgentCore `metric()` method with a positional `dimensions` argument, THE Migration SHALL remove that positional argument and place its value in the `dimensionsMap` field of the `props` argument, preserving the original value and all other arguments.
6. WHERE the Codebase passes an `OverrideConfig.model` value typed as `IBedrockInvokable`, THE Migration SHALL replace it with a value typed as `IModel` imported from `aws-cdk-lib/aws-bedrock`.
7. WHEN all applicable renames in criteria 1 through 6 have been applied, THE Migration SHALL produce a codebase that passes `tsc --noEmit` with zero compilation errors referencing any of the renamed members or types.
8. IF none of the members or types listed in criteria 1 through 6 are referenced in a given source file, THEN THE Migration SHALL leave that file byte-for-byte unchanged.

### Requirement 4: Remove unused alpha dependencies

**User Story:** As a developer, I want the unused alpha packages removed from the project dependencies, so that the project no longer carries alpha packages that are no longer referenced.

#### Acceptance Criteria

1. WHEN no source file under `bin/`, `lib/`, `src/`, or `tests/` contains an import or require reference to `@aws-cdk/aws-bedrock-agentcore-alpha`, THE Migration SHALL remove the `@aws-cdk/aws-bedrock-agentcore-alpha` entry from every dependency section of the Package_Manifest.
2. WHEN no source file under `bin/`, `lib/`, `src/`, or `tests/` contains an import or require reference to `@aws-cdk/aws-bedrock-alpha`, THE Migration SHALL remove the `@aws-cdk/aws-bedrock-alpha` entry from every dependency section of the Package_Manifest.
3. WHEN the Package_Manifest dependencies are updated, THE Migration SHALL regenerate the Lockfile so that it contains zero occurrences of `@aws-cdk/aws-bedrock-agentcore-alpha` or `@aws-cdk/aws-bedrock-alpha` as package keys.
4. THE Migration SHALL retain the existing `aws-cdk-lib` dependency in the Package_Manifest.
5. IF a source file under `bin/`, `lib/`, `src/`, or `tests/` still references either alpha package at the time of removal, THEN THE Migration SHALL retain that package's entry, leave the Package_Manifest and Lockfile unchanged, and report the remaining reference to the developer.
6. WHEN the dependency removal is complete, THE Codebase SHALL pass `pnpm run build` (`tsc --noEmit`) with zero type errors.

### Requirement 5: Preserve build and synthesis success

**User Story:** As a developer, I want the build and synthesis to keep working after the migration, so that I can deploy with confidence that nothing regressed.

#### Acceptance Criteria

1. WHEN the Migration is complete and `pnpm run build` (tsc --noEmit) is executed, THE Build_Check SHALL terminate with a success exit code (0) and report zero TypeScript type errors.
2. WHEN the Migration is complete and `pnpm cdk synth` is executed, THE Synth_Check SHALL terminate with a success exit code (0) and produce a CloudFormation template in `cdk.out` for each stack defined in the application.
3. IF the Build_Check reports one or more type errors attributable to the Migration, THEN THE Migration SHALL be corrected and the Build_Check re-executed until it terminates with a success exit code (0) and reports zero type errors.
4. WHEN the Migration is complete and `pnpm biome:dry` is executed, THE Codebase SHALL cause the Biome check to terminate with a success exit code (0) and report zero errors and zero warnings across the configured paths (bin/, lib/, src/, tests/).
5. IF the Synth_Check terminates with a non-success exit code or fails to produce a CloudFormation template for any defined stack, and the failure is attributable to the Migration, THEN THE Migration SHALL be corrected and the Synth_Check re-executed until it terminates with a success exit code (0) and produces a CloudFormation template for each defined stack.

### Requirement 6: Preserve synthesized infrastructure behavior

**User Story:** As a developer, I want the migration to be behavior-preserving, so that the deployed infrastructure is unchanged apart from the intended module move.

#### Known accepted delta (stable-module default)

The stable AgentCore module (`aws-cdk-lib/aws-bedrockagentcore`) adds a confused-deputy
protection `Condition` block (an `aws:SourceAccount` `StringEquals` plus an `aws:SourceArn`
`ArnLike`) to the `AssumeRolePolicyDocument` trust statement of the AgentCore Memory service
role (scoped to `...:memory/AgentCoreMemory*`) and the Runtime execution role (scoped to
`...:runtime/StrandsAgentRuntime*`). The alpha baseline did not emit these conditions. This is an
intentional security improvement shipped by AWS in the stabilized module, not a side effect of
the project's source edits. This delta — plus the benign `CDKMetadata.Analytics` hash change
caused by the module-path move — is explicitly ACCEPTED and is the only permitted difference
between the post-Migration template and the Stage 0 baseline.

#### Acceptance Criteria

1. WHEN `pnpm cdk synth` is executed after the Migration, THE synthesized CloudFormation template SHALL contain the AgentCore Memory and Runtime resources with the same logical IDs, resource types, and resource properties (including the Memory `expirationDuration` of 7 days, all Runtime environment variable keys and values, and all attached IAM managed policies and inline grant statements) as the baseline template synthesized immediately before the Migration.
2. WHEN the post-Migration synthesized template is compared against the pre-Migration baseline template, THE comparison SHALL report zero added, removed, or modified resources, resource properties, or IAM policy statements, EXCEPT for the accepted delta described above (the stable-module confused-deputy trust-policy `Condition` additions on the Memory service role and Runtime execution role, and the benign `CDKMetadata.Analytics` hash change).
3. THE Migration SHALL modify only import specifiers, renamed member references, and dependency declarations within `lib/constructs/agent-core.ts` and `lib/constructs/api-gw.ts`, and SHALL NOT change any resource name, environment variable key or value, duration value, or IAM grant statement in those two files.
4. IF the post-Migration synthesized template differs from the pre-Migration baseline template in any resource, resource property, or IAM policy statement OTHER THAN the accepted delta described above, THEN THE Migration SHALL be treated as failed, the differing changes SHALL be reverted, and the detected difference SHALL be reported to the developer.
5. WHEN `pnpm run build` is executed after the Migration, THE TypeScript type check SHALL complete with zero errors.
