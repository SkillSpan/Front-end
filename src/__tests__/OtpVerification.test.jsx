import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OtpVerification from '../OtpVerification';
import * as api from '../api';

describe('OtpVerification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call verifyOtp until all 6 digits are entered', async () => {
    const verifySpy = vi.spyOn(api, 'verifyOtp');
    render(<OtpVerification userEmail="student@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    expect(await screen.findByText(/enter the complete 6-digit/i)).toBeInTheDocument();
    expect(verifySpy).not.toHaveBeenCalled();
  });

  it('shows the success screen only after the backend confirms verification', async () => {
    vi.spyOn(api, 'verifyOtp').mockResolvedValue({ data: {} });
    render(<OtpVerification userEmail="student@example.com" />);

    const boxes = document.querySelectorAll('.otp-box');
    '123456'.split('').forEach((digit, i) => fireEvent.change(boxes[i], { target: { value: digit } }));
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(api.verifyOtp).toHaveBeenCalledWith('student@example.com', '123456');
    });
    expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
  });

  it('shows a server error and does NOT show success when the backend rejects the code', async () => {
    vi.spyOn(api, 'verifyOtp').mockRejectedValue({
      status: 422,
      message: 'That code is invalid or has expired.',
      errors: {},
    });
    render(<OtpVerification userEmail="student@example.com" />);

    const boxes = document.querySelectorAll('.otp-box');
    '000000'.split('').forEach((digit, i) => fireEvent.change(boxes[i], { target: { value: digit } }));
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.queryByText(/email verified/i)).not.toBeInTheDocument();
  });

  it('calls resendOtp with the user email when resend is clicked', async () => {
    const resendSpy = vi.spyOn(api, 'resendOtp').mockResolvedValue({ data: {} });
    render(<OtpVerification userEmail="student@example.com" />);

    fireEvent.click(screen.getByText(/resend code/i));

    await waitFor(() => {
      expect(resendSpy).toHaveBeenCalledWith('student@example.com');
    });
  });
});
