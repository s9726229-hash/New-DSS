import { expect, test } from 'vitest';

import { decodeBrokerCsvBytes } from './file';

test('keeps UTF-8 broker CSV headers readable', () => {
  const text = '成交日期,股票代號,成交數量';

  expect(decodeBrokerCsvBytes(new TextEncoder().encode(text))).toBe(text);
});
