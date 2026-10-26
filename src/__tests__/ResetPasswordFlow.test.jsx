import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ForgotPasswordWizard from '../components/auth/ForgotPasswordWizard'
import * as api from '../api'

// Walks the whole student "forgot password" wizard - email -> code -> new
// password - the way a user does, so the hand-off between the three screens
// (and the email/otp the last screen depends on) is covered end to end.

// Mounted exactly as App.jsx mounts it (a wildcard route), because the wizard
// navigates with absolute /forgot-password/... paths.
const renderWizard = (entry = '/forgot-password') =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/forgot-password/*" element={<ForgotPasswordWizard />} />
      </Routes>
    </MemoryRouter>,
  )

const enterCode = (code) => {
  const boxes = document.querySelectorAll('.otp-input-box')
  ;[...code].forEach((digit, i) => fireEvent.change(boxes[i], { target: { value: digit } }))
}

describe('forgot password wizard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })

  it('carries the email and the code into the reset screen and submits them', async () => {
    vi.spyOn(api, 'forgotPassword').mockResolvedValue({ data: {} })
    vi.spyOn(api, 'verifyForgotPasswordOtp').mockResolvedValue({ data: {} })
    const resetSpy = vi.spyOn(api, 'resetPassword').mockResolvedValue({ data: {} })

    renderWizard()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'student@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    // The wizard shows a "check your email" screen before the code boxes.
    fireEvent.click(await screen.findByRole('button', { name: /continue to verify/i }))

    await screen.findByText(/verify your identity/i)

    enterCode('123456')
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }))

    await screen.findByText(/reset your password/i)

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'Password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'Password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith({
        email: 'student@example.com',
        otp: '123456',
        password: 'Password123',
        password_confirmation: 'Password123',
      })
    })
  })

  it('does not call the API when the two passwords differ', async () => {
    vi.spyOn(api, 'forgotPassword').mockResolvedValue({ data: {} })
    vi.spyOn(api, 'verifyForgotPasswordOtp').mockResolvedValue({ data: {} })
    const resetSpy = vi.spyOn(api, 'resetPassword').mockResolvedValue({ data: {} })

    renderWizard()

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'student@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    fireEvent.click(await screen.findByRole('button', { name: /continue to verify/i }))
    await screen.findByText(/verify your identity/i)

    enterCode('123456')
    fireEvent.click(screen.getByRole('button', { name: /verify code/i }))
    await screen.findByText(/reset your password/i)

    fireEvent.change(screen.getByLabelText(/^new password$/i), { target: { value: 'Password123' } })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), { target: { value: 'Password124' } })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(resetSpy).not.toHaveBeenCalled()
  })

  it('still submits after a refresh on the reset screen (email + code survive)', async () => {
    // A refresh wipes component state; the wizard keeps the email and the code
    // in sessionStorage so the screen it lands on is still usable.
    sessionStorage.setItem(
      'skillspan:password-reset',
      JSON.stringify({ email: 'student@example.com', otp: '654321' }),
    )
    const resetSpy = vi.spyOn(api, 'resetPassword').mockResolvedValue({ data: {} })

    renderWizard('/forgot-password/reset')

    fireEvent.change(await screen.findByLabelText(/^new password$/i), {
      target: { value: 'Password123' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'Password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }))

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith({
        email: 'student@example.com',
        otp: '654321',
        password: 'Password123',
        password_confirmation: 'Password123',
      })
    })
  })

  it('sends a visitor with no reset session back to the first step', async () => {
    const resetSpy = vi.spyOn(api, 'resetPassword').mockResolvedValue({ data: {} })

    renderWizard('/forgot-password/reset')

    // No email/code: the form is never shown, so nobody types a password twice
    // only to be told the session is missing.
    expect(await screen.findByText(/send reset link/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^new password$/i)).toBeNull()
    expect(resetSpy).not.toHaveBeenCalled()
  })
})
