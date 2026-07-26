import { describe, expect, test } from 'vitest';

import { parseHoldingsCsv, parseTransactionCsv } from './csv';

describe('broker CSV parsing', () => {
  test('normalizes a transaction row and skips its subtotal row', () => {
    const preview = parseTransactionCsv([
      ',成交日期,股票代號,股票名稱,買賣別,成交數量,成交價,手續費,交易稅,交割日',
      ',2026/07/02,1101,測試公司,買,"1,000",42.5,20,0,2026/07/06',
      ',2026/07/02 小計,,, ,"1,000",42.5,20,0,',
    ].join('\n'));

    expect(preview.rows).toEqual([
      {
        sourceLine: 2,
        tradeDate: '2026-07-02',
        settlementDate: '2026-07-06',
        stockId: '1101',
        stockName: '測試公司',
        side: 'buy',
        quantity: 1000,
        price: 42.5,
        fees: 20,
        tax: 0,
      },
    ]);
    expect(preview.skipped).toEqual([{ line: 3, reason: '小計列' }]);
  });

  test('normalizes an inventory row with comma-separated quantities', () => {
    const preview = parseHoldingsCsv([
      '下單,市場,股票代號,股票名稱,交易類別,昨日庫存,今日買進成交數量,今日賣出成交數量,合計庫存數量,可下單數量,成本金額,成本均價,現價,市值',
      ',台股,1101,測試公司,現股,"1,000",0,0,"1,000","1,000","40,500",40.5,42.5,"42,500"',
    ].join('\n'));

    expect(preview.rows).toEqual([
      {
        sourceLine: 2,
        stockId: '1101',
        stockName: '測試公司',
        quantity: 1000,
        costPrice: 40.5,
        currentPrice: 42.5,
      },
    ]);
    expect(preview.skipped).toEqual([]);
  });

  test('retains a broker transaction reference from the final export column', () => {
    const preview = parseTransactionCsv([
      ',成交日期,股票代號,股票名稱,買賣別,成交數量,成交價,手續費,交易稅,交割日,,',
      ',2026/07/02,1101,測試公司,買,1000,42.5,20,0,2026/07/06,說明,J01tj0000',
    ].join('\n'));

    expect(preview.rows[0]).toMatchObject({ brokerReference: 'J01tj0000' });
  });
});
