import { describe, expect, it } from 'vitest';
import { parseHoldingsCsv, parseTransactionCsv } from './csv';

const TRANSACTION_HEADER =
  ',成交日期,市場別,股票代號,股票名稱,交易種類,買賣別,交易類別,成交數量,成交價,價金,手續費,交易稅,應收付帳款,融資金額/融券保證金,自備款擔保品,融資券利息,融券手續費,標借費,利息代扣稅款,二代健保補充費,損益,報酬率,交割日,幣別,,';

describe('parseTransactionCsv', () => {
  it('parses a buy row and a sell row, skipping the daily subtotal row', () => {
    const csv = [
      TRANSACTION_HEADER,
      ',  2024/03/01,台股,0050,元大台灣50,普通,買,現股,"1,000",100.00,"100,000",80,0,"-100,080",0,0,0,0,0,0,0,0,,2024/03/05,台幣,元大台灣50 現股 買,X00000001',
      ',  2024/03/01 小計,,,,,,,"1,000",100.00,"100,000",80,0,"-100,080",0,0,0,0,0,0,0,0,,,,,',
      ',  2024/03/10,台股,0056,元大高股息,普通,賣,現股,500,40.00,"20,000",20,6,"19,974",0,0,0,0,0,0,0,-26,-0.13%,2024/03/14,台幣,元大高股息 現股 賣,X00000002',
    ].join('\n');

    const preview = parseTransactionCsv(csv);

    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]).toEqual({
      tradeDate: '2024-03-01',
      stockId: '0050',
      stockName: '元大台灣50',
      side: 'buy',
      quantity: 1000,
      price: 100,
      fees: 80,
      tax: 0,
      settlementDate: '2024-03-05',
      brokerReference: 'X00000001',
    });
    expect(preview.rows[1]).toEqual({
      tradeDate: '2024-03-10',
      stockId: '0056',
      stockName: '元大高股息',
      side: 'sell',
      quantity: 500,
      price: 40,
      fees: 20,
      tax: 6,
      settlementDate: '2024-03-14',
      brokerReference: 'X00000002',
    });
    expect(preview.skipped).toHaveLength(0);
  });

  it('reports a malformed row as skipped instead of throwing', () => {
    const csv = [TRANSACTION_HEADER, 'too,few,columns'].join('\n');

    const preview = parseTransactionCsv(csv);

    expect(preview.rows).toHaveLength(0);
    expect(preview.skipped).toEqual([{ line: 2, reason: 'column count mismatch' }]);
  });
});

const HOLDINGS_HEADER =
  '下單,市場,股票代號,股票名稱,交易類別,昨日庫存,今日買進成交數量,今日賣出成交數量,合計庫存數量,可下單數量,成本金額,成本均價,現價,市值,買未入帳,賣未入帳,今日買進委託數量,今日賣出委託數量,幣別,單位換算率';

describe('parseHoldingsCsv', () => {
  it('parses holding rows and skips the trailing grand-total row', () => {
    const csv = [
      HOLDINGS_HEADER,
      ',台股,0050,元大台灣50,現股,"1,000",0,0,"1,000","1,000","100,000",100.00,105.50,"105,500",0,0,0,0,台幣,1.00',
      ',台股,0056,元大高股息,現股,500,0,0,500,500,"20,000",40.00,41.20,"20,600",0,0,0,0,台幣,1.00',
      ',,,[TWD台幣]總計：,,,,,,,"120,000",,,"126,100",,,,,,',
    ].join('\n');

    const preview = parseHoldingsCsv(csv);

    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]).toEqual({
      stockId: '0050',
      stockName: '元大台灣50',
      quantity: 1000,
      costPrice: 100,
      currentPrice: 105.5,
    });
    expect(preview.rows[1]).toEqual({
      stockId: '0056',
      stockName: '元大高股息',
      quantity: 500,
      costPrice: 40,
      currentPrice: 41.2,
    });
    expect(preview.skipped).toHaveLength(0);
  });
});
