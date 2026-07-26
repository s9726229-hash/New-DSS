import { afterEach, describe, expect, it } from 'vitest';

import {
  clearFinMindToken,
  readFinMindToken,
  saveFinMindToken,
} from './finmindToken';

describe('FinMind token browser storage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('stores a trimmed token only in local browser storage and can clear it', () => {
    saveFinMindToken('  local-token  ');

    expect(readFinMindToken()).toBe('local-token');
    expect(localStorage.getItem('new-dss:finmind-token')).toBe('local-token');

    clearFinMindToken();

    expect(readFinMindToken()).toBeNull();
  });
});
