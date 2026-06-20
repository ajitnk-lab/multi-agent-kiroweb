import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class TodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'TodoItemsTable', {
      tableName: 'TodoItems',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Lambda Functions
    const commonLambdaProps: Partial<lambda.FunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName
      }
    };

    const createTodoFn = new lambda.Function(this, 'CreateTodoFunction', {
      ...commonLambdaProps,
      handler: 'handlers/createTodo.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      functionName: 'todo-app-createTodo'
    } as lambda.FunctionProps);

    const listTodosFn = new lambda.Function(this, 'ListTodosFunction', {
      ...commonLambdaProps,
      handler: 'handlers/listTodos.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      functionName: 'todo-app-listTodos'
    } as lambda.FunctionProps);

    const updateTodoFn = new lambda.Function(this, 'UpdateTodoFunction', {
      ...commonLambdaProps,
      handler: 'handlers/updateTodo.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      functionName: 'todo-app-updateTodo'
    } as lambda.FunctionProps);

    const deleteTodoFn = new lambda.Function(this, 'DeleteTodoFunction', {
      ...commonLambdaProps,
      handler: 'handlers/deleteTodo.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/dist')),
      functionName: 'todo-app-deleteTodo'
    } as lambda.FunctionProps);

    // IAM Permissions - least privilege
    table.grantReadData(listTodosFn);
    table.grantReadWriteData(createTodoFn);
    table.grantReadWriteData(updateTodoFn);
    table.grantReadWriteData(deleteTodoFn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo App API',
      description: 'REST API for Todo App',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // /todos resource
    const todosResource = api.root.addResource('todos');
    todosResource.addMethod('POST', new apigateway.LambdaIntegration(createTodoFn));
    todosResource.addMethod('GET', new apigateway.LambdaIntegration(listTodosFn));

    // /todos/{id} resource
    const todoByIdResource = todosResource.addResource('{id}');
    todoByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updateTodoFn));
    todoByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoFn));

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name'
    });
  }
}
