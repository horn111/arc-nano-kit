declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(location?: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }

  export interface StatementSync {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }
}
