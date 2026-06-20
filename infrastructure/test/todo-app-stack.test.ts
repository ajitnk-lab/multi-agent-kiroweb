import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TodoAppStack } from '../lib/todo-app-stack';

describe('TodoAppStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new TodoAppStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    it('should create a DynamoDB table with partition key "id" of type String', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
          { AttributeName: 'id', AttributeType: 'S' }
        ]
      });
    });

    it('should use on-demand billing mode', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });
    });
  });

  describe('Lambda Functions', () => {
    it('should create 4 Lambda functions', () => {
      template.resourceCountIs('AWS::Lambda::Function', 4);
    });

    it('should configure functions with 256MB memory', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256
      });
    });

    it('should configure functions with 30s timeout', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30
      });
    });

    it('should configure functions with Node.js 20 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x'
      });
    });

    it('should pass TABLE_NAME environment variable to all functions', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.anyValue()
          })
        }
      });
    });
  });

  describe('API Gateway', () => {
    it('should create a REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Todo App API'
      });
    });

    it('should create API resources for /todos and /todos/{id}', () => {
      template.resourceCountIs('AWS::ApiGateway::Resource', 2);
    });

    it('should create methods for CRUD operations', () => {
      // POST, GET on /todos + PUT, DELETE on /todos/{id} + OPTIONS (CORS preflight)
      const methods = template.findResources('AWS::ApiGateway::Method');
      const methodCount = Object.keys(methods).length;
      expect(methodCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('IAM Permissions', () => {
    it('should create IAM policies for DynamoDB access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.anyValue()
            })
          ])
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    it('should output the API URL', () => {
      template.hasOutput('ApiUrl', {});
    });

    it('should output the Table Name', () => {
      template.hasOutput('TableName', {});
    });
  });
});
