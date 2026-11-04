import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { PreferencesProvider, usePreferences } from '../PreferencesContext';
import { STORE_KEY } from '../constants';

function Probe() {
  const { theme, lang, isRtl, setTheme, setLang, setAccent, reset } = usePreferences();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="lang">{lang}</span>
      <span data-testid="rtl">{String(isRtl)}</span>
      <button type="button" onClick={() => setTheme('dark')}>dark</button>
      <button type="button" onClick={() => setLang('ar')}>arabic</button>
      <button type="button" onClick={() => setAccent('emerald')}>emerald</button>
      <button type="button" onClick={reset}>reset</button>
    </div>
  );
}

function mount() {
  return render(
    <PreferencesProvider>
      <Probe />
    </PreferencesProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-accent');
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('lang');
});

describe('preferences', () => {
  it('starts light, blue and English', () => {
    mount();

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('writes the theme to <html> so CSS can react', () => {
    mount();
    fireEvent.click(screen.getByText('dark'));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('switches the document to right-to-left for Arabic', () => {
    mount();
    fireEvent.click(screen.getByText('arabic'));

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(screen.getByTestId('rtl').textContent).toBe('true');
  });

  it('applies the accent as a data attribute', () => {
    mount();
    fireEvent.click(screen.getByText('emerald'));

    expect(document.documentElement.dataset.accent).toBe('emerald');
  });

  it('remembers the choice on the device', () => {
    mount();
    fireEvent.click(screen.getByText('dark'));
    fireEvent.click(screen.getByText('arabic'));

    const stored = JSON.parse(window.localStorage.getItem(STORE_KEY));
    expect(stored).toMatchObject({ theme: 'dark', lang: 'ar' });
  });

  it('restores a stored choice on the next visit', () => {
    window.localStorage.setItem(
      STORE_KEY,
      JSON.stringify({ theme: 'dark', accent: 'violet', lang: 'ar' }),
    );

    mount();

    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.dataset.accent).toBe('violet');
  });

  it('ignores a corrupted stored value', () => {
    window.localStorage.setItem(STORE_KEY, '{oops');

    mount();

    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('resets back to the defaults', () => {
    mount();
    fireEvent.click(screen.getByText('dark'));
    fireEvent.click(screen.getByText('arabic'));
    fireEvent.click(screen.getByText('reset'));

    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
