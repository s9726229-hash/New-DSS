import type { BackupPayload, LightweightExportPayload } from './types';
import { openDssDatabase } from './database';

const forbiddenCredentialKeys = new Set(['apikey', 'token', 'finmindtoken', 'finmindapikey']);

function isCredentialKey(key: string): boolean {
  const normalized = key.replace(/[_-]/g, '').toLowerCase();

  return (
    forbiddenCredentialKeys.has(normalized) ||
    normalized.includes('credential') ||
    normalized.includes('secret')
  );
}

function assertCredentialFree(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertCredentialFree);
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (isCredentialKey(key)) {
      throw new Error('備份不得包含 API Key 或其他憑證');
    }

    if (key === 'key' && typeof child === 'string' && isCredentialKey(child)) {
      throw new Error('備份不得包含 API Key 或其他憑證');
    }

    assertCredentialFree(child);
  }
}

async function readBackupPayload(): Promise<BackupPayload> {
  const db = await openDssDatabase();

  try {
    const payload: BackupPayload = {
      version: 1,
      createdAt: new Date().toISOString(),
      settings: await db.getAll('settings'),
      transactions: await db.getAll('transactions'),
      holdingsSnapshots: await db.getAll('holdingsSnapshots'),
      marketCache: await db.getAll('marketCache'),
    };

    assertCredentialFree(payload);
    return payload;
  } finally {
    db.close();
  }
}

export async function createCompleteBackup(): Promise<BackupPayload> {
  return readBackupPayload();
}

export async function createLightweightExport(): Promise<LightweightExportPayload> {
  const { marketCache: _marketCache, ...lightweightExport } = await readBackupPayload();
  return lightweightExport;
}

function assertBackupPayload(payload: BackupPayload): void {
  if (
    payload.version !== 1 ||
    !Array.isArray(payload.settings) ||
    !Array.isArray(payload.transactions) ||
    !Array.isArray(payload.holdingsSnapshots) ||
    !Array.isArray(payload.marketCache)
  ) {
    throw new Error('備份資料格式不正確');
  }

  assertCredentialFree(payload);
}

export async function restoreBackup(payload: BackupPayload): Promise<void> {
  assertBackupPayload(payload);

  const db = await openDssDatabase();

  try {
    const transaction = db.transaction(
      ['settings', 'transactions', 'holdingsSnapshots', 'marketCache'],
      'readwrite',
    );

    await Promise.all([
      transaction.objectStore('settings').clear(),
      transaction.objectStore('transactions').clear(),
      transaction.objectStore('holdingsSnapshots').clear(),
      transaction.objectStore('marketCache').clear(),
    ]);

    await Promise.all([
      ...payload.settings.map((record) => transaction.objectStore('settings').put(record)),
      ...payload.transactions.map((record) =>
        transaction.objectStore('transactions').put(record),
      ),
      ...payload.holdingsSnapshots.map((record) =>
        transaction.objectStore('holdingsSnapshots').put(record),
      ),
      ...payload.marketCache.map((record) => transaction.objectStore('marketCache').put(record)),
    ]);

    await transaction.done;
  } finally {
    db.close();
  }
}
