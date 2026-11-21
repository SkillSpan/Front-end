import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OtpVerification from '../components/auth/OtpVerification';
import VerifyCode from '../components/auth/VerifyCode';
import { fillDigits, nextFromInput, onlyDigits } from '../components/auth/otpInput';
import * as api from '../api';

const digitBoxes = () => screen.getAllByRole('textbox').filter((el) => /^Digit \d of 6$/.test(el.getAttribute('aria-label') || ''));

describe('OTP code paste and autofill', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('helpers keep digits only and fill from the given box', () => {
    expect(onlyDigits(' 893-769 ')).toBe('893769');
    expect(onlyDigits('\u0668\u0669\u0663')).toBe('893');
    expect(fillDigits(['', '', '', '', '', ''], 0, '893769').values).toEqual(['8', '9', '3', '7', '6', '9']);
    expect(fillDigits(['', '', '', '', '', ''], 0, '89').focusIndex).toBe(1);
    expect(nextFromInput(['1', '', '', '', '', ''], 0, '15').values[0]).toBe('5');
    expect(nextFromInput(['', '', '', '', '', ''], 0, 'a')).toBeNull();
  });

  it('pasting "893769" into any box fills all six boxes and verifies with that code', async () => {
    const verifySpy = vi.spyOn(api, 'verifyOtp').mockResolvedValue({ data: {} });
    render(<OtpVerification userEmail="student@example.com" />);
    const boxes = digitBoxes();
    expect(boxes).toHaveLength(6);

    fireEvent.paste(boxes[2], { clipboardData: { getData: () => 'Code: 893 769' } });
    expect(boxes.map((b) => b.value).join('')).toBe('893769');
    expect(document.activeElement).toBe(boxes[5]);

    fireEvent.click(screen.getByRole('button', { name: /verify code/i }));
    await waitFor(() => expect(verifySpy).toHaveBeenCalledWith('student@example.com', '893769'));
  });

  it('a multi-digit value typed into one box (SMS autofill) is spread across the boxes', () => {
    render(<OtpVerification userEmail="student@example.com" />);
    const boxes = digitBoxes();
    fireEvent.change(boxes[0], { target: { value: '893769' } });
    expect(boxes.map((b) => b.value).join('')).toBe('893769');
  });

  it('first box offers the one-time code and the row is always left to right', () => {
    render(<OtpVerification userEmail="student@example.com" />);
    const boxes = digitBoxes();
    expect(boxes[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes[0]).toHaveAttribute('inputmode', 'numeric');
    expect(boxes[0].parentElement).toHaveAttribute('dir', 'ltr');
  });

  it('arrow keys and backspace move between boxes', () => {
    render(<OtpVerification userEmail="student@example.com" />);
    const boxes = digitBoxes();
    boxes[2].focus();
    fireEvent.keyDown(boxes[2], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(boxes[1]);
    fireEvent.keyDown(boxes[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(boxes[2]);
    fireEvent.keyDown(boxes[2], { key: 'Backspace' });
    expect(document.activeElement).toBe(boxes[1]);
  });

  it('password-reset code boxes accept a pasted code too', () => {
    render(<VerifyCode email="student@example.com" />);
    const boxes = digitBoxes();
    fireEvent.paste(boxes[0], { clipboardData: { getData: () => '893769' } });
    expect(boxes.map((b) => b.value).join('')).toBe('893769');
  });
});
