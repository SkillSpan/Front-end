import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OtpVerification from '../components/auth/OtpVerification';
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

    const boxes = screen.getAllByRole('textbox');
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

    const boxes = screen.getAllByRole('textbox');
    '000000'.split('').forEach((digit, i) => fireEvent.change(boxes[i], { target: { value: digit } }));
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.queryByText(/email verified/i)).not.toBeInTheDocument();
  });

  it('spreads a pasted code over the boxes and submits it', async () => {
    vi.spyOn(api, 'verifyOtp').mockResolvedValue({ data: {} });
    render(<OtpVerification userEmail="student@example.com" />);

    const boxes = screen.getAllByRole('textbox');
    fireEvent.paste(boxes[0], { clipboardData: { getData: () => 'Your code: 482 913' } });

    expect(boxes.map((box) => box.value).join('')).toBe('482913');
    await waitFor(() => {
      expect(api.verifyOtp).toHaveBeenCalledWith('student@example.com', '482913');
    });
  });

  it('fills every box when the browser autofills the whole code into the first one', async () => {
    vi.spyOn(api, 'verifyOtp').mockResolvedValue({ data: {} });
    render(<OtpVerification userEmail="student@example.com" />);

    const boxes = screen.getAllByRole('textbox');
    expect(boxes[0].getAttribute('autocomplete')).toBe('one-time-code');
    expect(boxes[0].getAttribute('inputmode')).toBe('numeric');
    fireEvent.change(boxes[0], { target: { value: '135790' } });

    expect(boxes.map((box) => box.value).join('')).toBe('135790');
    await waitFor(() => {
      expect(api.verifyOtp).toHaveBeenCalledWith('student@example.com', '135790');
    });
  });

  it('moves back to the previous box on Backspace in an empty box', () => {
    render(<OtpVerification userEmail="student@example.com" />);
    const boxes = screen.getAllByRole('textbox');
    fireEvent.change(boxes[0], { target: { value: '7' } });
    expect(document.activeElement).toBe(boxes[1]);
    fireEvent.keyDown(boxes[1], { key: 'Backspace' });
    expect(document.activeElement).toBe(boxes[0]);
    expect(boxes[0].value).toBe('');
  });

  it('calls resendOtp with the user email when resend is clicked', async () => {
    const resendSpy = vi.spyOn(api, 'resendOtp').mockResolvedValue({ data: {} });
    render(<OtpVerification userEmail="student@example.com" initialResendTimer={0} />);

    fireEvent.click(screen.getByText(/resend code/i));

    await waitFor(() => {
      expect(resendSpy).toHaveBeenCalledWith('student@example.com');
    });
  });
});
