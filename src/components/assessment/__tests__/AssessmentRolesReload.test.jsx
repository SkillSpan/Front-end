import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

/*
 * Specialization and career role are chosen once, in Profile Setup.
 * The assessment intro shows no pickers at all and starts with the
 * role saved from the profile.
 */
vi.mock('../../../api', async (importOriginal) => ({
  ...(await importOriginal()),
  getSpecializations: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Software' }] }),
  getProfile: vi.fn().mockResolvedValue({ data: { specialization: 'Software' } }),
  getCareerRoles: vi.fn().mockResolvedValue({ data: [{ id: 12, title: 'Backend Developer' }] }),
}));

import AssessmentWizard from '../AssessmentWizard.jsx';

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/register/assessment']}>
      <Routes>
        <Route path="/register/assessment/*" element={<AssessmentWizard />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('assessment intro — no pickers, role comes from the profile', () => {
  beforeEach(() => { sessionStorage.clear(); localStorage.clear(); });

  it('shows no specialization or career-role picker and can start', async () => {
    localStorage.setItem('skillspan.profile.careerRole', JSON.stringify({ id: '12', name: 'Backend Developer', specializationId: '1' }));
    renderWizard();
    const start = await screen.findByRole('button', { name: /Start Assessment/ });
    expect(screen.queryByLabelText(/Specialization/)).toBeNull();
    expect(screen.queryByLabelText(/Career role/)).toBeNull();
    await waitFor(() => expect(start.disabled).toBe(false));
  });

  it('asks to pick the role in the profile when none was saved', async () => {
    renderWizard();
    expect(await screen.findByText(/Choose your career role in your profile first/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Start Assessment/ }).disabled).toBe(true);
  });
});
