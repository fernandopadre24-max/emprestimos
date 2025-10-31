export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const { operation, path } = context;
    const message = `Firestore Permission Denied: ${operation} on ${path}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}
