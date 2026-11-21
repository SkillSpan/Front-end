import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../api', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  unwrapApiData: (payload) => payload?.data?.data ?? payload?.data ?? payload,
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ authUser: { id: 5, name: 'Lina Haddad', email: 'lina@example.com' } }),
}));

import { getProfile, updateProfile } from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import ProfileView from '../ProfileView';

const PROFILE = {
  data: {
    id: 12,
    university_name: 'Cairo University',
    student_university_number: '20210123',
    specialization: 'Computer Science',
    academic_level: 'Third year',
    expected_graduation: 2027,
    bio: 'Backend learner aiming at platform engineering.',
    visibility: 'private',
    completeness_percent: 64,
    updated_at: '2026-10-17T09:00:00+00:00',
  },
};

function mount() {
  return render(
    <PreferencesProvider>
      <ProfileView readinessScore={62} roleLabel="Backend Engineer" />
    </PreferencesProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  getProfile.mockResolvedValue(PROFILE);
});

describe('profile page', () => {
  it('shows the saved profile and the completeness ring', async () => {
    mount();

    expect(await screen.findByText('Cairo University')).toBeTruthy();
    expect(screen.getByText('Computer Science')).toBeTruthy();
    expect(screen.getAllByText('Lina Haddad').length).toBeGreaterThan(0);
    expect(screen.getAllByText('lina@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('64%')).toBeTruthy();
    expect(screen.getByText('Backend Engineer')).toBeTruthy();
    expect(screen.getByText('62/100')).toBeTruthy();
  });

  it('falls back to a placeholder for empty fields', async () => {
    getProfile.mockResolvedValue({ data: { ...PROFILE.data, bio: null, specialization: null } });

    mount();

    await screen.findByText('Cairo University');
    expect(screen.getAllByText('Not set yet').length).toBeGreaterThan(0);
  });

  it('edits a field and saves only through the API', async () => {
    updateProfile.mockResolvedValue({ data: { ...PROFILE.data, university_name: 'Ain Shams University' } });

    mount();
    await screen.findByText('Cairo University');

    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    const university = screen.getByDisplayValue('Cairo University');
    fireEvent.change(university, { target: { value: 'Ain Shams University' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(updateProfile.mock.calls[0][0]).toMatchObject({
      university_name: 'Ain Shams University',
      expected_graduation: 2027,
      visibility: 'private',
    });
    expect(await screen.findByText('Your profile was saved.')).toBeTruthy();
  });

  it('cancels an edit without calling the API', async () => {
    mount();
    await screen.findByText('Cairo University');

    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.change(screen.getByDisplayValue('Cairo University'), {
      target: { value: 'Something else' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(updateProfile).not.toHaveBeenCalled();
    expect(screen.getByText('Cairo University')).toBeTruthy();
  });

  it('keeps the edit open and reports a failed save', async () => {
    updateProfile.mockRejectedValue({ message: 'The profile could not be updated.' });

    mount();
    await screen.findByText('Cairo University');

    fireEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('The profile could not be updated.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeTruthy();
  });

  it('translates the page when the language is Arabic', async () => {
    window.localStorage.setItem(
      'skillspan.preferences.v1',
      JSON.stringify({ theme: 'light', accent: 'blue', lang: 'ar' }),
    );

    mount();

    expect(await screen.findByText('ملفك الشخصي')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'تعديل الملف' })).toBeTruthy();
  });
});
