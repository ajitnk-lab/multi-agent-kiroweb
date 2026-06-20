# Multi-Agent Development Workflow

## Overview

This project uses a multi-agent (subagent) workflow for development. An orchestrator agent coordinates specialized subagents, each responsible for a specific domain.

## Agent Roles

| Agent | Domain | Responsibilities |
|-------|--------|-----------------|
| **Orchestrator** | Coordination | Plans waves, dispatches agents, validates results, handles errors |
| **Backend Agent** | Server-side | Lambda handlers, shared libraries, backend tests, property tests |
| **Frontend Agent** | Client-side | React components, hooks, services, frontend tests |
| **Infrastructure Agent** | Cloud resources | CDK stacks, IAM policies, resource configuration |
| **CI/CD Agent** | Automation | GitHub Actions workflows, pipeline configuration |
| **Documentation Agent** | Documentation | OpenAPI specs, steering files, README, workflow docs |

## Invocation Sequence

```
Wave 0  → Orchestrator scaffolds monorepo
Wave 1  → Backend + Frontend + Infra agents (parallel)
Wave 2  → Backend + Frontend agents (shared types)
Wave 3  → Backend Agent × 4 (shared libraries)
Wave 4  → Backend Agent × 5 (property tests)
Wave 5  → Backend Agent × 4 (Lambda handlers)
Wave 6  → Backend Agent × 4 (handler property tests)
Wave 7-9→ Frontend Agent (services → hooks, sequential)
Wave 10 → Frontend Agent × 4 (components)
Wave 11 → Frontend Agent × 2 (property tests)
Wave 12 → Infrastructure Agent (CDK stack)
Wave 13 → Infrastructure Agent + CI/CD Agent (parallel)
Wave 14 → Backend Agent × 3 + Frontend Agent × 2 (all tests)
Wave 15 → Documentation Agent × 2 (docs)
```

## Inputs/Outputs Between Agents

### Orchestrator → Subagents
- **Input**: Task description, relevant context files, constraints
- **Output**: Created/modified files, test results, status report

### Backend Agent → Frontend Agent
- **Shared artifact**: `backend/src/types/todo.ts` (API contract types)
- **Frontend mirrors**: `frontend/src/types/todo.ts` (matching types)

### Backend Agent → Infrastructure Agent
- **Shared artifact**: Handler file paths and export names
- **Infra uses**: Lambda handler entry points in CDK stack

### All Agents → CI/CD Agent
- **Shared artifacts**: Test scripts, build commands, package.json scripts
- **CI/CD uses**: Script names in GitHub Actions workflow

## Parallelism Rules

1. **Within a wave**: All tasks run in parallel (one subagent per task)
2. **Between waves**: Sequential (Wave N+1 starts only after Wave N completes)
3. **File isolation**: No two agents in the same wave write to the same file
4. **Validation gates**: TypeScript compilation check after each wave

## Error Recovery

- **Partial failure**: Orchestrator retries failed task in the same wave
- **Type errors**: Fixed before proceeding to next wave
- **Session loss**: STATUS.md tracks progress; new session resumes from last completed wave
