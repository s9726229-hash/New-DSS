const FINMIND_TOKEN_STORAGE_KEY = 'new-dss:finmind-token';

export function saveFinMindToken(token: string): void {
  const normalizedToken = token.trim();

  if (normalizedToken) {
    localStorage.setItem(FINMIND_TOKEN_STORAGE_KEY, normalizedToken);
    return;
  }

  localStorage.removeItem(FINMIND_TOKEN_STORAGE_KEY);
}

export function readFinMindToken(): string | null {
  const token = localStorage.getItem(FINMIND_TOKEN_STORAGE_KEY)?.trim();
  return token || null;
}

export function clearFinMindToken(): void {
  localStorage.removeItem(FINMIND_TOKEN_STORAGE_KEY);
}
