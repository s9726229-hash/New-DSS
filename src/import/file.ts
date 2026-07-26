function hasBrokerHeaders(text: string): boolean {
  return (
    text.includes('股票代號') &&
    (text.includes('成交日期') || text.includes('合計庫存數量'))
  );
}

export function decodeBrokerCsvBytes(bytes: Uint8Array): string {
  const utf8Text = new TextDecoder('utf-8').decode(bytes);

  if (hasBrokerHeaders(utf8Text)) {
    return utf8Text;
  }

  return new TextDecoder('big5').decode(bytes);
}

export async function readBrokerCsvFile(file: File): Promise<string> {
  return decodeBrokerCsvBytes(new Uint8Array(await file.arrayBuffer()));
}
