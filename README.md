# Todo App - Multi-Agent Development

A full-stack Todo application built with React, AWS Lambda, DynamoDB, and AWS CDK, developed using a multi-agent workflow.

## Architecture

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: AWS Lambda (Node.js 20) + TypeScript
- **API**: AWS API Gateway (REST)
- **Database**: DynamoDB (on-demand)
- **Infrastructure**: AWS CDK v2
- **CI/CD**: GitHub Actions

## Project Structure

```
├── frontend/          # React application
├── backend/           # Lambda handlers and shared libraries
├── infrastructure/    # AWS CDK stacks
├── docs/              # API documentation and workflow guides
├── .github/           # GitHub Actions workflows
└── .kiro/             # Steering files and specs
```

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0
- AWS CLI configured (for deployment)
- AWS CDK CLI (`npm install -g aws-cdk`)

### Installation
```bash
npm install
```

### Development
```bash
# Build backend
cd backend && npm run build

# Run frontend dev server
cd frontend && npm run dev

# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:properties
npm run test:coverage
```

### Deployment
```bash
# Synthesize CloudFormation template
cd infrastructure && npx cdk synth

# Deploy to AWS
npm run deploy
```

## Testing

- **Unit Tests**: Jest with mocked dependencies
- **Property Tests**: fast-check for formal correctness properties
- **Integration Tests**: End-to-end API testing with mocked DynamoDB
- **Infrastructure Tests**: CDK assertions for resource validation

## API Documentation

See [docs/openapi.yaml](docs/openapi.yaml) for the complete OpenAPI 3.0 specification.

## Multi-Agent Workflow

See [docs/multi-agent-workflow.md](docs/multi-agent-workflow.md) for details on how agents are coordinated during development.

## License

MIT
