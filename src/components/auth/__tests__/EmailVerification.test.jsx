import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailVerification from '../EmailVerification';

describe('registration verification code instructions', () => {
  it('directs the learner to code entry rather than a link', () => {
    const next = vi.fn();
    render(<EmailVerification onContinueToSetup={next} />);
    expect(screen.getByText(/We sent a verification code/)).toBeTruthy();
    expect(screen.queryByText(/verification link/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enter Verification Code' }));
    expect(next).toHaveBeenCalledOnce();
  });
  it('reports a resend failure without claiming delivery', async () => {
    render(<EmailVerification onResendEmail={vi.fn().mockRejectedValue(new Error('Please try again later.'))} />);
    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }));
    await screen.findByText('Please try again later.');
    expect(screen.queryByText(/A new verification code has been sent/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeTruthy();
  });
  it('waits for successful delivery before reporting success', async () => {
    let finish;
    const pending = new Promise((resolve) => { finish = resolve; });
    render(<EmailVerification onResendEmail={() => pending} />);
    fireEvent.click(screen.getByRole('button', { name: 'Resend code' }));
    expect(screen.queryByText(/A new verification code has been sent/)).toBeNull();
    expect(screen.getByText('Sending verification code…')).toBeTruthy();
    finish();
    await waitFor(() => expect(screen.getByText(/A new verification code has been sent/)).toBeTruthy());
  });
});
