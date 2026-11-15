export type DataStub = Record<string, unknown>;

export function validateDataStub(value: DataStub, name: string): void {
  if (!value || typeof value !== 'object') {
    throw new Error(`Data file "${name}" must contain an object.`);
  }
}
