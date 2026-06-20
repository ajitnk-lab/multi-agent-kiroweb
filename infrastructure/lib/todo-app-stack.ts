import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export class TodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==================== DATABASE ====================
    const table = new dynamodb.Table(this, 'TodoItemsTable', {
      tableName: 'TodoItems',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // ==================== BACKEND (LAMBDA) ====================
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

    // ==================== API GATEWAY ====================
    const api = new apigateway.RestApi(this, 'TodoApi', {
      restApiName: 'Todo App API',
      description: 'REST API for Todo App',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    const todosResource = api.root.addResource('todos');
    todosResource.addMethod('POST', new apigateway.LambdaIntegration(createTodoFn));
    todosResource.addMethod('GET', new apigateway.LambdaIntegration(listTodosFn));

    const todoByIdResource = todosResource.addResource('{id}');
    todoByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updateTodoFn));
    todoByIdResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTodoFn));

    // ==================== FRONTEND (S3 + CLOUDFRONT) ====================
    // S3 bucket for frontend static assets
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `todo-app-frontend-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      additionalBehaviors: {
        '/todos*': {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL
        }
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(0)
        }
      ]
    });

    // Deploy frontend build output to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../../frontend/dist'))],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*']
    });

    // ==================== OUTPUTS ====================
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name'
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Website URL'
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront Distribution ID'
    });
  }
}
