import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('labels the three entry points in the header', () => {
    renderLanding()
    expect(screen.getAllByRole('link', { name: 'Student login' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Company sign up' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Create account' }).length).toBeGreaterThan(0)
  })
})
