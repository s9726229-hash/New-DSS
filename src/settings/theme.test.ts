// src/settings/theme.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { applyTheme, getStoredTheme, setStoredTheme } from './theme';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('getStoredTheme', () => {
  it('defaults to light when nothing is stored', () => {
    expect(getStoredTheme()).toBe('light');
  });

  it('returns the stored theme', () => {
    localStorage.setItem('new-dss:theme', 'dark');
    expect(getStoredTheme()).toBe('dark');
  });

  it('falls back to light for an unrecognized stored value', () => {
    localStorage.setItem('new-dss:theme', 'sepia');
    expect(getStoredTheme()).toBe('light');
  });
});

describe('setStoredTheme', () => {
  it('persists the theme to localStorage', () => {
    setStoredTheme('dark');
    expect(localStorage.getItem('new-dss:theme')).toBe('dark');
  });
});

describe('applyTheme', () => {
  it('sets data-theme to dark on the document element', () => {
    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('removes data-theme for light', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    applyTheme('light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
