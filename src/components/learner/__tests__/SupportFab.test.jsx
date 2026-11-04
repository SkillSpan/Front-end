import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import SupportFab from '../SupportFab';

describe('support button', () => {
  it('is reachable by an accessible name and goes straight to support', () => {
    const onClick = vi.fn();
    render(<SupportFab onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Contact the support team' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    // The label is visible, not hover-only — the point is discoverability.
    expect(screen.getByText('Need help?')).toBeTruthy();
  });

  it('flags a thread where somebody is waiting', () => {
    const { container, rerender } = render(<SupportFab onClick={vi.fn()} />);
    expect(container.querySelector('.ss-support-fab-dot')).toBeNull();

    rerender(<SupportFab onClick={vi.fn()} waiting />);
    expect(container.querySelector('.ss-support-fab-dot')).toBeTruthy();
  });
});
