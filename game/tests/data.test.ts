import { describe, expect, it } from 'vitest';
import { validateDataStub } from '../src/data/validateData';

describe('v3 data stubs', () => {
  it('fails loudly for a malformed data value', () => {
    expect(() => validateDataStub(null as never, 'balance.json')).toThrow(
      'Data file "balance.json" must contain an object.',
    );
  });
});
