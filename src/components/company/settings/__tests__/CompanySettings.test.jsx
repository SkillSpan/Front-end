import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../../api', () => ({
  logoutAllDevices: vi.fn(),
  getNotificationsPreferences: vi.fn(),
  updateNotificationsPreferences: vi.fn(),
}));

import * as api from '../../../../api';
import { PreferencesProvider } from '../../../../preferences/PreferencesContext';
import CompanySettings from '../CompanySettings';
import { readPrefs, validatePassword } from '../settingsApi';

const USER = { id: 3, name: 'Lina Haddad', email: 'lina@acme.example' };
const ORG = { id: 9, name: 'Acme Labs' };
const renderIt = (props = {}) => render(
  <PreferencesProvider>
    <div className="cw"><CompanySettings user={USER} organization={ORG} onNavigate={() => {}} {...props} /></div>
  </PreferencesProvider>,
);

describe('CompanySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState(null, '', '/company/settings');
  });

  it('prefills only from the user / organization it receives', async () => {
    api.getNotificationsPreferences.mockResolvedValue({ data: { new_applicant: false, project_status: true, messages: true } });
    renderIt();
    expect(screen.getByLabelText(/Full name/)).toHaveProperty('value', 'Lina Haddad');
    const email = screen.getByLabelText('Work email');
    expect(email).toHaveProperty('value', 'lina@acme.example');
    expect(email).toHaveProperty('readOnly', true);
    expect(screen.getByText('Acme Labs')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Notifications' }));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'New applicants' }).getAttribute('aria-checked')).toBe('false'));
  });

  it('validates the password form with the app rules', async () => {
    api.getNotificationsPreferences.mockResolvedValue({ data: {} });
    renderIt();
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }));
    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'oldpass12' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'other' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));
    expect(await screen.findByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
  });

  it('says plainly when an endpoint is not connected instead of faking a save', async () => {
    api.getNotificationsPreferences.mockResolvedValue({ data: {} });
    renderIt();
    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: 'Lina H.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Not available yet')).toBeTruthy();
  });

  it('saves notification preferences through PUT /notifications/preferences', async () => {
    api.getNotificationsPreferences.mockResolvedValue({ data: { new_applicant: true, project_status: true, messages: true } });
    api.updateNotificationsPreferences.mockResolvedValue({ data: {} });
    renderIt();
    fireEvent.click(screen.getByRole('tab', { name: 'Notifications' }));
    const sw = await screen.findByRole('switch', { name: 'Messages' });
    fireEvent.click(sw);
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    await waitFor(() => expect(api.updateNotificationsPreferences).toHaveBeenCalledWith({ preferences: { new_applicant: true, project_status: true, messages: false } }));
    expect(await screen.findByText('Notification preferences saved')).toBeTruthy();
  });

  it('shows a retryable error when preferences fail to load', async () => {
    api.getNotificationsPreferences.mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce({ data: {} });
    renderIt();
    fireEvent.click(screen.getByRole('tab', { name: 'Notifications' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(api.getNotificationsPreferences).toHaveBeenCalledTimes(2));
  });

  it('signs out of all devices through POST /auth/logout-all, then logs out', async () => {
    api.getNotificationsPreferences.mockResolvedValue({ data: {} });
    api.logoutAllDevices.mockResolvedValue({});
    const onLogout = vi.fn();
    renderIt({ onLogout });
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sign out everywhere' }));
    const buttons = screen.getAllByRole('button', { name: 'Sign out everywhere' });
    fireEvent.click(buttons[buttons.length - 1]);
    await waitFor(() => expect(onLogout).toHaveBeenCalled());
    expect(api.logoutAllDevices).toHaveBeenCalled();
  });

  it('shows one section at a time and keeps the open tab in the URL', async () => {
    api.getNotificationsPreferences.mockResolvedValue({ data: {} });
    renderIt();
    expect(screen.getByLabelText(/Full name/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Update password' })).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }));
    expect(screen.getByRole('button', { name: 'Update password' })).toBeTruthy();
    expect(window.location.search).toBe('?tab=security');
  });

  it('keeps Deactivate disabled until the user acknowledges', async () => {
    renderIt({ demo: true });
    fireEvent.click(screen.getByRole('tab', { name: 'Danger zone' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate account' }));
    const confirm = screen.getByRole('button', { name: 'Deactivate' });
    expect(confirm).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(confirm).toHaveProperty('disabled', false);
  });

  it('renders in Arabic RTL', () => {
    window.localStorage.setItem('skillspan.preferences.v1', JSON.stringify({ lang: 'ar' }));
    renderIt({ demo: true });
    expect(screen.getByRole('heading', { level: 1, name: 'الإعدادات' })).toBeTruthy();
    expect(document.querySelector('.cw-set').getAttribute('dir')).toBe('rtl');
  });
});

describe('settingsApi helpers', () => {
  it('reads object and array preference payloads', () => {
    expect(readPrefs({ data: { data: { messages: false } } }).messages).toBe(false);
    expect(readPrefs({ data: [{ key: 'new_applicant', enabled: false }] }).new_applicant).toBe(false);
  });
  it('password rules', () => {
    expect(validatePassword({ current: 'a', next: 'abcdefgh', confirm: 'abcdefgh' })).toEqual({});
    expect(validatePassword({ current: 'abcdefgh', next: 'abcdefgh', confirm: 'abcdefgh' }).next).toBe('set.err.newSame');
  });
});
