import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

vi.mock('../../../api', () => ({
  logoutUser: vi.fn(),
  logoutAllDevices: vi.fn(),
}));

import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import CompanyLayout from '../CompanyLayout';

const USER = { id: 9, name: 'Rana Saleh', email: 'rana@acme.test' };
const ORGANIZATION = { id: 3, name: 'Acme Labs', verification_status: 'verified' };

function mount(overrides = {}) {
  return render(
    <PreferencesProvider>
      <CompanyLayout
        active="dashboard"
        onNavigate={vi.fn()}
        user={USER}
        organization={ORGANIZATION}
        onLogout={vi.fn()}
        {...overrides}
      >
        <p>page body</p>
      </CompanyLayout>
    </PreferencesProvider>,
  );
}

// The brand button carries the dashboard label as its aria-label too, so the
// assertions have to look inside the nav rather than at the whole document.
function nav() {
  return within(screen.getByRole('navigation', { name: 'Company navigation' }));
}

describe('company sidebar shell', () => {
  it('shows the three company sections and the page body', () => {
    mount();

    expect(nav().getByRole('button', { name: 'Dashboard' })).toBeTruthy();
    expect(nav().getByRole('button', { name: 'Talent Discovery' })).toBeTruthy();
    expect(nav().getByRole('button', { name: 'Company Profile' })).toBeTruthy();
    expect(screen.getByText('page body')).toBeTruthy();
  });

  it('navigates to the matching route', () => {
    const onNavigate = vi.fn();
    mount({ onNavigate });

    fireEvent.click(nav().getByRole('button', { name: 'Talent Discovery' }));
    expect(onNavigate).toHaveBeenCalledWith('/company/talent');
  });

  it('marks the active section and shows the organization identity', () => {
    const { container } = mount({ active: 'profile' });

    const active = container.querySelector('.app-nav-item.active');
    expect(active?.textContent).toContain('Company Profile');
    // The sidebar footer and the top bar both name the organization.
    expect(screen.getAllByText('Acme Labs').length).toBeGreaterThan(0);
    expect(screen.getByText('Verified')).toBeTruthy();
  });
});
