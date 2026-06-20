# Implementation Plan: Todo App Multi-Agent

## Overview

This implementation plan delivers a full-stack Todo application using React 18 + Vite (TypeScript) on the frontend, AWS Lambda (Node.js 20, TypeScript) on the backend, DynamoDB for persistence, and AWS CDK v2 for infrastructure-as-code. The plan follows an incremental approach: shared types and project scaffolding first, then backend logic, frontend components, infrastructure, CI/CD, and documentation — with testing woven in at each layer.

## Tasks

- [ ] 1. Set up monorepo structure and shared configuration
  - [ ] 1.1 Initialize npm workspaces monorepo with root package.json
    - Create root `package.json` with workspaces pointing to `frontend`, `backend`, and `infrastructure`
    - Add root scripts for `build`, `test`, `test:unit`, `test:integration`, `test:properties`, `test:coverage`, `lint`, and `deploy`
    - Create `tsconfig.base.json` with shared TypeScript compiler options (strict mode, ES2022 target, module resolution)
    - _Requirements: 10.3, 10.4_

  - [ ] 1.2 Set up backend package with TypeScript and Jest
    - Create `backend/package.json` with dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `uuid`
    - Add dev dependencies: `typescript`, `jest`, `ts-jest`, `@types/jest`, `@types/uuid`, `fast-check`, `@types/aws-lambda`
    - Create `backend/tsconfig.json` extending root base config
    - Configure `jest.config.ts` for unit and property test discovery
    - _Requirements: 6.1, 6.2, 10.3_

  - [ ] 1.3 Set up frontend package with Vite, React, and TypeScript
    - Create `frontend/package.json` with dependencies: `react`, `react-dom`
    - Add dev dependencies: `vite`, `@vitejs/plugin-react`, `typescript`, `jest`, `@testing-library/react`, `@testing-library/jest-dom`, `jest-environment-jsdom`, `fast-check`, `ts-jest`
    - Create `frontend/tsconfig.json` with JSX support
    - Create `frontend/vite.config.ts` with React plugin and API proxy config
    - Create `frontend/src/index.html` as Vite entry point
    - _Requirements: 10.3, 11.1_

  - [ ] 1.4 Set up infrastructure package with AWS CDK
    - Create `infrastructure/package.json` with dependencies: `aws-cdk-lib`, `constructs`
    - Add dev dependencies: `typescript`, `jest`, `ts-jest`, `@types/jest`, `aws-cdk-lib/assertions`
    - Create `infrastructure/tsconfig.json` extending root base config
    - Create `infrastructure/cdk.json` with app entry point
    - _Requirements: 5.1, 10.3_

  - [ ] 1.5 Create shared type definitions
    - Create `backend/src/types/todo.ts` defining `TodoItem`, `CreateTodoRequest`, `UpdateTodoRequest` interfaces
    - Create `frontend/src/types/todo.ts` defining frontend `TodoItem` type matching API contract
    - _Requirements: 12.4, 12.6_

- [ ] 2. Implement backend shared libraries
  - [ ] 2.1 Implement input validation module
    - Create `backend/src/lib/validator.ts` with functions: `validateTitle(title)`, `validateDescription(description)`, `validateId(id)`, `validateUpdateBody(body)`
    - Title validation: trim whitespace, reject empty/whitespace-only, reject > 255 chars
    - Description validation: reject > 1024 chars
    - ID validation: UUID v4 regex pattern match
    - Update body validation: at least one of title/description/status required, status must be "incomplete" or "complete"
    - _Requirements: 1.4, 3.5, 3.7, 4.6, 12.1, 12.2, 12.3_

  - [ ]* 2.2 Write property test for title validation
    - **Property 2: Title validation rejects invalid inputs**
    - **Validates: Requirements 1.4, 3.7, 11.6, 12.1**

  - [ ]* 2.3 Write property test for description validation
    - **Property 3: Description validation enforces length limit**
    - **Validates: Requirements 12.2**

  - [ ]* 2.4 Write property test for ID format validation
    - **Property 7: ID format validation rejects malformed identifiers**
    - **Validates: Requirements 4.6**

  - [ ] 2.5 Implement DynamoDB client wrapper
    - Create `backend/src/lib/dynamodb-client.ts` with DynamoDBDocumentClient setup
    - Implement `putItem`, `getItem`, `deleteItem`, `scanItems` helper functions
    - Include error handling that wraps AWS SDK errors
    - Read table name from `TABLE_NAME` environment variable
    - _Requirements: 5.7, 1.6, 2.6, 4.7_

  - [ ] 2.6 Implement response builder module
    - Create `backend/src/lib/response.ts` with helper functions: `success(statusCode, body)`, `error(statusCode, message)`
    - Include CORS headers (Access-Control-Allow-Origin, Access-Control-Allow-Headers, Access-Control-Allow-Methods) in all responses
    - _Requirements: 5.5, 12.4_

  - [ ] 2.7 Implement serializer module
    - Create `backend/src/lib/serializer.ts` with `serializeTodoItem(item)` and `deserializeRequest(body)` functions
    - Ensure null for missing optional fields (description)
    - Validate JSON parsing with try/catch and appropriate error messages
    - _Requirements: 12.4, 12.5, 12.6, 12.7_

  - [ ]* 2.8 Write property test for serialization round-trip
    - **Property 8: TodoItem serialization round-trip**
    - **Validates: Requirements 12.4, 12.6, 12.7**

  - [ ]* 2.9 Write property test for invalid JSON rejection
    - **Property 9: Invalid JSON rejection**
    - **Validates: Requirements 12.5**

- [ ] 3. Implement backend Lambda handlers
  - [ ] 3.1 Implement createTodo handler
    - Create `backend/src/handlers/createTodo.ts`
    - Parse and validate request body (title required, optional description)
    - Generate UUID v4 for id, set status to "incomplete", set createdAt/updatedAt to current ISO 8601 UTC
    - Write to DynamoDB, return 201 with complete TodoItem
    - Handle validation errors (400) and DynamoDB errors (500)
    - _Requirements: 1.2, 1.3, 1.4, 1.6_

  - [ ]* 3.2 Write property test for create handler
    - **Property 1: Create handler produces well-formed TodoItem**
    - **Validates: Requirements 1.2**

  - [ ] 3.3 Implement listTodos handler
    - Create `backend/src/handlers/listTodos.ts`
    - Scan DynamoDB table with Limit of 100
    - Sort results by createdAt descending
    - Return 200 with array of TodoItems (empty array if none)
    - Handle DynamoDB errors (500)
    - _Requirements: 2.2, 2.3, 2.4, 2.6_

  - [ ]* 3.4 Write property test for list sorting and limit
    - **Property 4: List returns items sorted by createdAt descending and capped at 100**
    - **Validates: Requirements 2.2**

  - [ ] 3.5 Implement updateTodo handler
    - Create `backend/src/handlers/updateTodo.ts`
    - Extract id from path parameters, validate UUID format
    - Parse and validate request body (at least one updatable field required)
    - Validate title/description if provided
    - Verify item exists (404 if not), update only specified fields, set new updatedAt
    - Return 200 with complete updated TodoItem
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_

  - [ ]* 3.6 Write property test for update field preservation
    - **Property 5: Update preserves unspecified fields**
    - **Validates: Requirements 3.2**

  - [ ] 3.7 Implement deleteTodo handler
    - Create `backend/src/handlers/deleteTodo.ts`
    - Extract id from path parameters, validate UUID format
    - Verify item exists (404 if not), delete from DynamoDB
    - Return 200 with `{ id }` response
    - Handle DynamoDB errors (500)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

  - [ ]* 3.8 Write property test for delete removes item
    - **Property 6: Delete removes item from storage**
    - **Validates: Requirements 4.2**

- [ ] 4. Checkpoint - Backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement frontend services and hooks
  - [ ] 5.1 Implement todoApi service
    - Create `frontend/src/services/todoApi.ts`
    - Implement functions: `createTodo(request)`, `listTodos()`, `updateTodo(id, request)`, `deleteTodo(id)`
    - Configure base URL from environment variable (VITE_API_URL)
    - Set 30-second timeout on all requests
    - Parse JSON responses and handle network errors
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 11.4_

  - [ ] 5.2 Implement useApi hook
    - Create `frontend/src/hooks/useApi.ts`
    - Manage loading state, error state, and data state
    - Wrap async operations with try/catch
    - Handle 4xx errors (display API error message), 5xx errors (generic message), timeout, and network failures
    - _Requirements: 11.4, 11.5_

  - [ ] 5.3 Implement useTodos hook
    - Create `frontend/src/hooks/useTodos.ts`
    - Manage todo list state with CRUD operations
    - Fetch todos on mount using listTodos
    - Provide `addTodo`, `updateTodo`, `toggleStatus`, `removeTodo` functions
    - Integrate with useApi for loading/error state
    - Optimistic updates with rollback on error
    - _Requirements: 1.5, 2.5, 3.6, 4.5_

- [ ] 6. Implement frontend components
  - [ ] 6.1 Implement App root component
    - Create `frontend/src/components/App.tsx`
    - Wire useTodos hook
    - Render TodoForm, LoadingIndicator, ErrorMessage, and TodoList
    - Create `frontend/src/main.tsx` entry point
    - _Requirements: 2.1, 11.1_

  - [ ] 6.2 Implement TodoForm component
    - Create `frontend/src/components/TodoForm.tsx`
    - Text input with maxLength=255, submit button
    - Client-side validation: prevent submission with empty/whitespace-only title, show inline error
    - Disable controls while loading
    - Clear input on successful submission
    - _Requirements: 11.1, 11.6, 11.4_

  - [ ] 6.3 Implement TodoList and TodoItem components
    - Create `frontend/src/components/TodoList.tsx` rendering list of TodoItem components
    - Create `frontend/src/components/TodoItem.tsx` with edit, toggle, and delete controls
    - Apply strikethrough style to completed items
    - Disable controls while loading
    - _Requirements: 2.5, 11.2, 11.3, 11.4_

  - [ ] 6.4 Implement utility components
    - Create `frontend/src/components/LoadingIndicator.tsx` (shown during API calls)
    - Create `frontend/src/components/ErrorMessage.tsx` (displays error with dismiss button)
    - Create `frontend/src/components/EmptyPlaceholder.tsx` (shown when no todos exist)
    - _Requirements: 11.4, 11.5, 11.7_

  - [ ]* 6.5 Write property test for TodoList rendering
    - **Property 10: Frontend renders all TodoItem data**
    - **Validates: Requirements 2.5**

  - [ ]* 6.6 Write property test for TodoItem controls and styling
    - **Property 11: Frontend TodoItem controls and completion styling**
    - **Validates: Requirements 11.2, 11.3**

- [ ] 7. Checkpoint - Frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement AWS CDK infrastructure
  - [ ] 8.1 Implement CDK stack
    - Create `infrastructure/lib/todo-app-stack.ts`
    - Define DynamoDB table with partition key "id" (String), on-demand billing
    - Define four Lambda functions (createTodo, listTodos, updateTodo, deleteTodo) with 256MB memory, 30s timeout, Node.js 20 runtime
    - Pass TABLE_NAME environment variable to all Lambdas
    - Grant read-only permissions to listTodos Lambda, read-write to others
    - Define REST API Gateway with `/todos` (GET, POST) and `/todos/{id}` (PUT, DELETE) resources
    - Enable CORS on API Gateway (configurable origin, methods, headers)
    - Create `infrastructure/bin/app.ts` as CDK app entry point
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 8.2 Write CDK infrastructure unit tests
    - Create `infrastructure/test/todo-app-stack.test.ts`
    - Assert DynamoDB table properties (billing mode, partition key)
    - Assert Lambda function properties (memory, timeout, runtime, environment variables)
    - Assert IAM permissions (least privilege per function)
    - Assert API Gateway resource structure and CORS configuration
    - _Requirements: 5.6, 6.4_

- [ ] 9. Implement CI/CD pipeline
  - [ ] 9.1 Create GitHub Actions workflow
    - Create `.github/workflows/ci-cd.yml`
    - Trigger on push to main and pull requests targeting main
    - Steps: checkout, setup Node.js 20, `npm ci`, lint, unit tests, integration tests
    - Deploy step (main branch only): `cdk synth` then `cdk deploy --require-approval never`
    - Add 30-minute timeout
    - Configure AWS credentials via GitHub secrets
    - Skip deployment on pull requests
    - Fail pipeline and report on any test/lint failure
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [ ] 10. Implement integration tests
  - [ ] 10.1 Create integration test suite
    - Create `backend/tests/integration/todo-api.test.ts`
    - Test full CRUD lifecycle: create → list → update → delete
    - Test error scenarios: missing title (400), non-existent id on update (404), non-existent id on delete (404), malformed id (400)
    - Ensure test isolation (each test starts with clean state using beforeEach/afterEach hooks)
    - Validate response format matches API contract (status codes, body structure)
    - Mock DynamoDB client for isolated integration testing
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 11. Implement backend unit tests
  - [ ] 11.1 Write unit tests for Lambda handlers
    - Create `backend/tests/unit/handlers/createTodo.test.ts` — test success path (201), missing title (400), DynamoDB error (500)
    - Create `backend/tests/unit/handlers/listTodos.test.ts` — test success with items (200), empty result (200), DynamoDB error (500)
    - Create `backend/tests/unit/handlers/updateTodo.test.ts` — test success (200), not found (404), empty body (400), invalid fields (400)
    - Create `backend/tests/unit/handlers/deleteTodo.test.ts` — test success (200), not found (404), invalid id (400), DynamoDB error (500)
    - Mock DynamoDB client and validate responses
    - _Requirements: 6.2, 6.4, 6.5_

  - [ ] 11.2 Write unit tests for shared library modules
    - Create `backend/tests/unit/lib/validator.test.ts` — test all validation functions with valid and invalid inputs
    - Create `backend/tests/unit/lib/serializer.test.ts` — test serialization and deserialization
    - Create `backend/tests/unit/lib/response.test.ts` — test response builder output format and CORS headers
    - _Requirements: 6.5_

- [ ] 12. Implement frontend unit tests
  - [ ] 12.1 Write unit tests for React components
    - Create `frontend/tests/components/App.test.tsx` — test initial load, rendering of child components
    - Create `frontend/tests/components/TodoForm.test.tsx` — test input, validation, submission
    - Create `frontend/tests/components/TodoList.test.tsx` — test rendering items, empty state
    - Create `frontend/tests/components/TodoItem.test.tsx` — test edit/toggle/delete controls, strikethrough styling
    - _Requirements: 6.1_

  - [ ] 12.2 Write unit tests for hooks
    - Create `frontend/tests/hooks/useTodos.test.ts` — test CRUD operations, loading state, error handling
    - Create `frontend/tests/hooks/useApi.test.ts` — test fetch wrapping, timeout, error classification
    - _Requirements: 6.1_

- [ ] 13. Checkpoint - All unit and integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Create documentation and multi-agent steering
  - [ ] 14.1 Create OpenAPI specification
    - Create `docs/openapi.yaml` defining all endpoints (POST /todos, GET /todos, PUT /todos/{id}, DELETE /todos/{id})
    - Include request/response schemas with examples
    - Document all error response codes and formats
    - Validate against OpenAPI 3.0 spec
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 14.2 Create steering file and project documentation
    - Create `.kiro/steering/project-standards.md` defining: coding standards (TypeScript strict, ESLint, Prettier), technology stack, architectural decisions, naming conventions
    - Create `docs/multi-agent-workflow.md` describing agent roles, invocation sequence, and inputs/outputs
    - Create root `README.md` with project overview, setup instructions, and development workflow
    - _Requirements: 10.1, 10.2, 10.5_

- [ ] 15. Final checkpoint - Full system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each layer boundary
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The backend is implemented before the frontend so API contracts are established first
- Infrastructure and CI/CD follow implementation to ensure all code is ready for deployment
- All code uses TypeScript across every layer for type safety and shared interfaces

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"] },
    { "id": 2, "tasks": ["1.5"] },
    { "id": 3, "tasks": ["2.1", "2.5", "2.6", "2.7"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.4", "2.8", "2.9"] },
    { "id": 5, "tasks": ["3.1", "3.3", "3.5", "3.7"] },
    { "id": 6, "tasks": ["3.2", "3.4", "3.6", "3.8"] },
    { "id": 7, "tasks": ["5.1"] },
    { "id": 8, "tasks": ["5.2"] },
    { "id": 9, "tasks": ["5.3"] },
    { "id": 10, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 11, "tasks": ["6.5", "6.6"] },
    { "id": 12, "tasks": ["8.1"] },
    { "id": 13, "tasks": ["8.2", "9.1"] },
    { "id": 14, "tasks": ["10.1", "11.1", "11.2", "12.1", "12.2"] },
    { "id": 15, "tasks": ["14.1", "14.2"] }
  ]
}
```
