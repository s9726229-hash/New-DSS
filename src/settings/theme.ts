export type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'new-dss:theme';

export function getStoredTheme(): ThemeName {
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function setStoredTheme(theme: ThemeName): void {
  localStorage.setItem(STORAGE_KEY, theme);
}

export function applyTheme(theme: ThemeName): void {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}
