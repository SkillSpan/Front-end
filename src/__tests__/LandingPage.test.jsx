import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PreferencesProvider } from '../preferences/PreferencesContext'
import LandingPage from '../landing/LandingPage'

// The landing draws its journey bridge on a <canvas> and measures it with a
// ResizeObserver; jsdom has neither. Both are stubbed so the page can mount —
// this test is about the markup and the auth entry points, not the drawing.
beforeAll(() => {
  const gradient = { addColorStop() {} }
  const ctx = new Proxy(
    {},
    {
      get: (target, key) => {
        if (key === 'createLinearGradient' || key === 'createRadialGradient') return () => gradient
        if (key in target) return target[key]
        return () => {}
      },
      set: () => true,
    },
  )
  HTMLCanvasElement.prototype.getContext = () => ctx
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  window.scrollTo = () => {}
})

const renderLanding = () =>
  render(
    <MemoryRouter>
      <PreferencesProvider>
        <LandingPage />
      </PreferencesProvider>
    </MemoryRouter>,
  )

describe('landing page', () => {
  it('renders the hero headline and keeps only the three auth entry points', () => {
    renderLanding()

    expect(screen.getAllByText(/Bridge Your Skills/).length).toBeGreaterThan(0)

    const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/login')
    expect(hrefs).toContain('/register/account')
    expect(hrefs).toContain('/company/register/account')

    // The old waitlist band accepted an email and thanked the visitor without
    // sending anything. It is gone; only real routes remain.
    expect(document.querySelector('form')).toBeNull()
    expect(screen.queryByText(/waitlist/i)).toBeNull()
  })

  it('has Log in + Register in the header and a "Start your journey now" hero button that opens the chooser', () => {
    renderLanding()
    const buttons = screen.getAllByRole('button', { name: /^Register/ })
    expect(buttons.length).toBe(1) // header only; the hero says "Start your journey now"
    expect(screen.getAllByRole('button', { name: /^Start your journey now/ }).length).toBe(1)
    expect(screen.getAllByRole('button', { name: /^Log in$/ }).length).toBe(1)
    const header = document.querySelector('header')
    expect(within(header).queryByRole('link', { name: 'Student login' })).toBeNull()
    expect(within(header).queryByRole('link', { name: 'Company sign up' })).toBeNull()

    fireEvent.click(buttons[0])
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('button', { name: 'Continue as student' })).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: 'Continue as company' })).toBeTruthy()
    expect(within(dialog).queryByText(/Already have an account/)).toBeNull()
  })
})
