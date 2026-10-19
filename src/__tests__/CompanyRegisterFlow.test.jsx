import '../components/evidence/__tests__/setupReact.js'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

vi.mock('../api', async (orig) => {
  const real = await orig()
  return { ...real, registerOrganization: vi.fn().mockResolvedValue({ ok: true }) }
})

const type = (container, name, value) => {
  const el = container.querySelector(`[name="${name}"]`)
  fireEvent.change(el, { target: { name, value } })
}

describe('company registration flow', () => {
  it('moves through every step without bouncing back to step 1', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/company/register/account']}>
        <App />
      </MemoryRouter>,
    )

    // Step 1
    expect(screen.getByText('Welcome to Registration')).toBeInTheDocument()
    type(container, 'name', 'Alex Smith')
    type(container, 'email', 'alex@example.com')
    type(container, 'phone', '+1-555-0199')
    type(container, 'password', 'Password123')
    type(container, 'confirmPassword', 'Password123')
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 2
    await waitFor(() => expect(container.querySelector('[name="companyName"]')).toBeTruthy())
    type(container, 'companyName', 'Acme')
    type(container, 'country', 'Palestine')
    type(container, 'city', 'Nablus')
    type(container, 'address', 'Main St')
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Step 3
    await waitFor(() => expect(container.querySelector('input[type="file"]')).toBeTruthy())
    const file = new File(['x'], 'proof.pdf', { type: 'application/pdf' })
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /next|continue/i }))

    // Step 4
    await waitFor(() => expect(container.querySelectorAll('.c-checkbox-card').length).toBe(2))
    container.querySelectorAll('.c-checkbox-card').forEach((c) => fireEvent.click(c))
    fireEvent.click(container.querySelector('button[type="submit"]'))

    // Step 5 - confirmation
    await waitFor(() => expect(screen.getAllByText(/alex@example.com/i).length).toBeGreaterThan(0))
  })
})
