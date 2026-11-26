import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
const api = vi.hoisted(() => ({ createProfile: vi.fn(), getProfile: vi.fn(), getSpecializations: vi.fn(), getCountries: vi.fn(), getUniversitiesByCountry: vi.fn() }));
vi.mock('../../../api', () => api);
import Profile from '../LearnerProfileSetup';

describe('custom university and specialization', () => {
  it('submits typed Other values through the real dropdowns', async () => {
    api.getProfile.mockRejectedValue({ status: 404 });
    api.getCountries.mockResolvedValue({ data: [{ id: 1, name: 'Egypt' }] });
    api.getSpecializations.mockResolvedValue({ data: [{ id: 5, name: 'Data Science' }] });
    api.getUniversitiesByCountry.mockResolvedValue({ data: [{ id: 1, name: 'Listed University' }] });
    api.createProfile.mockResolvedValue({ data: {} });
    const done = vi.fn();
    const { container } = render(<Profile onComplete={done} />);
    await waitFor(() => expect(api.getCountries).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Select your country/ }));
    fireEvent.click(screen.getByText('Egypt', { selector: 'li' }));
    await waitFor(() => expect(api.getUniversitiesByCountry).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /Select your university/ }));
    fireEvent.click(screen.getByText('Other', { selector: 'li' }));
    fireEvent.change(screen.getByPlaceholderText('Enter your university name'), { target: { value: 'qena university' } });
    fireEvent.click(screen.getByRole('button', { name: /Select your specialization/ }));
    fireEvent.click(screen.getByText('Other', { selector: 'li' }));
    fireEvent.change(screen.getByPlaceholderText('Enter your specialization'), { target: { value: 'Custom Department' } });
    const student = container.querySelector('input[value=""]:not([placeholder])');
    const idField = container.querySelector('.profile-setup-field input[placeholder*="student" i]') || student;
    if (!idField) throw new Error('Student ID input not found');
    fireEvent.change(idField, { target: { value: 'aa' } });
    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: 'graduate' } });
    // A graduate has nothing to expect, so the field is gone rather than
    // renamed, and the form can be submitted without a year.
    expect(screen.queryByText('Expected Graduation')).toBeNull();
    expect(screen.queryByText('Graduation Year')).toBeNull();
    const submit = screen.getByRole('button', { name: /Proceed to Assessment/ });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    await waitFor(() => expect(api.createProfile).toHaveBeenCalledWith(expect.objectContaining({ university_name: 'qena university', specialization: 'Custom Department', student_university_number: 'aa', academic_level: 'graduate', expected_graduation: null })));
    expect(done).toHaveBeenCalled();
  });

  it('offers only this year and later as an expected graduation', async () => {
    api.getProfile.mockRejectedValue({ status: 404 });
    api.getCountries.mockResolvedValue({ data: [{ id: 1, name: 'Egypt' }] });
    api.getSpecializations.mockResolvedValue({ data: [] });
    api.getUniversitiesByCountry.mockResolvedValue({ data: [] });
    const { container } = render(<Profile onComplete={vi.fn()} />);
    await waitFor(() => expect(api.getCountries).toHaveBeenCalled());

    const selects = container.querySelectorAll('select');
    fireEvent.change(selects[0], { target: { value: 'third_year' } });
    const yearSelect = container.querySelectorAll('select')[1];
    const years = Array.from(yearSelect.querySelectorAll('option')).map((o) => o.value).filter(Boolean);
    const currentYear = new Date().getFullYear();
    expect(years[0]).toBe(String(currentYear));
    expect(years).not.toContain(String(currentYear - 3));
  });
});
