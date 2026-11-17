import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Intro from '../SkillAssessmentIntro';

describe('assessment role loading errors', () => {
  const props = { specializations: [{ id: 5, name: 'Data Science' }], specializationId: '5' };
  it('offers sign-in instead of claiming that the specialization has no roles', () => {
    const onSignIn = vi.fn();
    render(<Intro {...props} rolesError="Sign in to load career roles." rolesUnauthorized onSignIn={onSignIn} />);
    expect(screen.queryByText(/No career roles are available/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalledOnce();
  });
  it('offers retry after a connection failure', () => {
    const onRolesRetry = vi.fn();
    render(<Intro {...props} rolesError="Career roles could not be loaded." onRolesRetry={onRolesRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading roles' }));
    expect(onRolesRetry).toHaveBeenCalledOnce();
    expect(screen.queryByText(/No career roles are available/)).toBeNull();
  });
  it('retains the empty-list message for a successful empty response', () => {
    render(<Intro {...props} />);
    expect(screen.getByText(/No career roles are available/)).toBeTruthy();
  });
});
