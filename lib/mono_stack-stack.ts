import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { RustFunction } from 'cargo-lambda-cdk';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod } from 'aws-cdk-lib/aws-events';

export class MonoStackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function
    const readerLambda = new RustFunction(this, 'readerLambda', {
      manifestPath: './lambda/reader_lambda/Cargo.toml',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      architecture: lambda.Architecture.ARM_64,
    });

    //API Gateway
    const api = new apigw.HttpApi(this, 'Api',{
      apiName: 'product-api',
    });

    const readerInteg = new HttpLambdaIntegration('readerInteg', readerLambda);
    api.addRoutes({
      path: '/read',
      methods: [HttpMethod.GET],
      integration: readerInteg
    });

    // Data - PRODUCT
    const productDb = new dynamodb.TableV2(this, 'productDb', {
      partitionKey:  {
        name: 'ProductId',
        type: dynamodb.AttributeType.STRING
      }
    });

    productDb.grantReadData(readerLambda);

    // Data - USERS
    const userDb = new dynamodb.TableV2(this, 'userDb', {
      partitionKey:  {
        name: 'UserId',
        type: dynamodb.AttributeType.STRING
      }
    });

    userDb.grantReadData(readerLambda);

    // Data - ORDERS
    const orderDb = new dynamodb.TableV2(this, 'orderDb', {
      partitionKey:  {
        name: 'OrderId',
        type: dynamodb.AttributeType.STRING
      }
    });

    orderDb.grantReadData(readerLambda);
  }
}
