import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  DeleteCommand,
  ScanCommand,
  UpdateCommand,
  PutCommandInput,
  GetCommandInput,
  DeleteCommandInput,
  ScanCommandInput,
  UpdateCommandInput,
  UpdateCommandOutput
} from '@aws-sdk/lib-dynamodb';
import { TodoItem } from '../types/todo';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const TABLE_NAME = process.env.TABLE_NAME || 'TodoItems';

/**
 * Put (create) an item in DynamoDB.
 */
export async function putItem(item: TodoItem): Promise<void> {
  const params: PutCommandInput = {
    TableName: TABLE_NAME,
    Item: item
  };
  await docClient.send(new PutCommand(params));
}

/**
 * Get a single item by id from DynamoDB.
 * Returns null if item does not exist.
 */
export async function getItem(id: string): Promise<TodoItem | null> {
  const params: GetCommandInput = {
    TableName: TABLE_NAME,
    Key: { id }
  };
  const result = await docClient.send(new GetCommand(params));
  return (result.Item as TodoItem) || null;
}

/**
 * Delete an item by id from DynamoDB.
 */
export async function deleteItem(id: string): Promise<void> {
  const params: DeleteCommandInput = {
    TableName: TABLE_NAME,
    Key: { id }
  };
  await docClient.send(new DeleteCommand(params));
}

/**
 * Scan all items from DynamoDB, limited to maxItems.
 * Returns items sorted by createdAt in descending order.
 */
export async function scanItems(maxItems: number = 100): Promise<TodoItem[]> {
  const params: ScanCommandInput = {
    TableName: TABLE_NAME,
    Limit: maxItems
  };
  const result = await docClient.send(new ScanCommand(params));
  const items = (result.Items as TodoItem[]) || [];
  
  // Sort by createdAt descending
  return items.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Update specific fields of an item in DynamoDB.
 * Returns the updated item.
 */
export async function updateItem(
  id: string,
  updates: Partial<Pick<TodoItem, 'title' | 'description' | 'status' | 'updatedAt'>>
): Promise<TodoItem> {
  const expressionParts: string[] = [];
  const expressionValues: Record<string, unknown> = {};
  const expressionNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value]) => {
    const attrName = `#${key}`;
    const attrValue = `:${key}`;
    expressionParts.push(`${attrName} = ${attrValue}`);
    expressionNames[attrName] = key;
    expressionValues[attrValue] = value;
  });

  const params: UpdateCommandInput = {
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: `SET ${expressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    ReturnValues: 'ALL_NEW'
  };

  const result: UpdateCommandOutput = await docClient.send(new UpdateCommand(params));
  return result.Attributes as TodoItem;
}
