export async function readBrokerCsvFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return new TextDecoder('big5').decode(buffer);
}
