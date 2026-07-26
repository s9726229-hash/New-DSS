// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { readBrokerCsvFile } from './file';

describe('readBrokerCsvFile', () => {
  it('decodes a Big5-encoded file as UTF-8 text', async () => {
    // Big5 bytes for the UTF-8 string "台股,0050", verified via
    // `printf '台股,0050' | iconv -f utf-8 -t big5 | xxd -p`
    const big5Bytes = new Uint8Array([
      0xa5, 0x78, 0xaa, 0xd1, 0x2c, 0x30, 0x30, 0x35, 0x30,
    ]);
    const file = new File([big5Bytes], 'holdings.csv', { type: 'text/csv' });

    const text = await readBrokerCsvFile(file);

    expect(text).toBe('台股,0050');
  });

  it('decodes a plain ASCII file identically to its source text', async () => {
    const file = new File(['header,a,b\n1,2,3'], 'plain.csv', { type: 'text/csv' });

    const text = await readBrokerCsvFile(file);

    expect(text).toBe('header,a,b\n1,2,3');
  });
});
