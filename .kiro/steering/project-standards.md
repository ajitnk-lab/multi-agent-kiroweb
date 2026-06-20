# Project Standards

## Technology Stack
- **Language**: TypeScript (strict mode) across all layers
- **Frontend**: React 18 + Vite 5
- **Backend**: AWS Lambda (Node.js 20)
- **API**: AWS API Gateway (REST)
- **Database**: DynamoDB (on-demand billing)
- **Infrastructure**: AWS CDK v2
- **Testing**: Jest + fast-check (property-based testing)
- **CI/CD**: GitHub Actions
- **Package Manager**: npm workspaces (monorepo)

## Coding Standards
- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting
- All functions must have JSDoc comments
- Export named functions (no default exports)
- Use interfaces over type aliases for object shapes
- Prefer const over let; never use var

## Naming Conventions
- Files: camelCase (e.g., `createTodo.ts`, `useTodos.ts`)
- Components: PascalCase (e.g., `TodoItem.tsx`)
- Interfaces: PascalCase (e.g., `TodoItem`, `CreateTodoRequest`)
- Functions: camelCase (e.g., `validateTitle`, `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (e.g., `TABLE_NAME`, `CORS_HEADERS`)
- Test files: `{module}.test.ts` or `{module}.test.tsx`

## Architectural Decisions
- **Monorepo**: npm workspaces with frontend, backend, infrastructure packages
- **Backend handlers**: One Lambda function per API endpoint (single responsibility)
- **Shared libraries**: validator, serializer, response builder, DynamoDB client
- **Frontend state**: React hooks for state management (no external state library)
- **Error handling**: Consistent error response format `{ error: true, message: string }`
- **Testing**: Property-based tests for correctness properties, unit tests for examples/edges
- **Infrastructure**: Single CDK stack with least-privilege IAM
- **CORS**: Configured at API Gateway level, headers in Lambda responses

## Development Workflow
1. Create/update spec files before implementation
2. Implement backend shared libraries first
3. Implement handlers with property tests
4. Implement frontend services → hooks → components
5. Add CDK infrastructure and CI/CD
6. Write unit and integration tests
7. Create documentation
