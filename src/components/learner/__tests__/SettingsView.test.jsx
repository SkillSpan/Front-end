import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../api', () => ({
  logoutUser: vi.fn(),
  logoutAllDevices: vi.fn(),
}));

import { logoutAllDevices, logoutUser } from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import SettingsView from '../SettingsView';

function mount(onLogout = vi.fn()) {
  return render(
    <PreferencesProvider>
      <SettingsView onLogout={onLogout} />
    </PreferencesProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('dir');
  vi.clearAllMocks();
});

describe('settings page', () => {
  it('switches the theme from the appearance cards', () => {
    mount();

    expect(document.documentElement.dataset.theme).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: /Dark/ }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('switches language and flips the layout to RTL', () => {
    mount();

    fireEvent.click(screen.getByRole('button', { name: /العربية/ }));

    expect(document.documentElement.dir).toBe('rtl');
    // The page itself is translated, not just the direction.
    expect(screen.getByText('الإعدادات')).toBeTruthy();
  });

  it('logs out of every device through the API', async () => {
    const onLogout = vi.fn();
    logoutAllDevices.mockResolvedValue({});
    mount(onLogout);

    fireEvent.click(screen.getByRole('button', { name: /all devices/i }));

    await waitFor(() => expect(logoutAllDevices).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onLogout).toHaveBeenCalled());
  });

  it('stays signed in when the logout call fails', async () => {
    const onLogout = vi.fn();
    logoutUser.mockRejectedValue({ status: 500, message: 'Server unavailable' });
    mount(onLogout);

    fireEvent.click(screen.getByRole('button', { name: /^Log out$/ }));

    expect(await screen.findByText('Server unavailable')).toBeTruthy();
    expect(onLogout).not.toHaveBeenCalled();
  });
});
