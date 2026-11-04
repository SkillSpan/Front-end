import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import SupportWaitingToast from '../SupportWaitingToast';

describe('support waiting banner', () => {
  it('names the mentor the handoff assigned', () => {
    render(
      <SupportWaitingToast toast={{ id: 1, name: 'Sara Admin' }} onOpen={vi.fn()} onClose={vi.fn()} />,
    );

    expect(screen.getByText('Sara Admin is waiting for you')).toBeTruthy();
    expect(screen.getByText(/picked up the request/)).toBeTruthy();
    // Initials come from the same name, so the avatar is never empty.
    expect(screen.getByText('SA')).toBeTruthy();
  });

  it('falls back to the team when the request is still unclaimed', () => {
    render(<SupportWaitingToast toast={{ id: 2, name: '' }} onOpen={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText('Support is waiting for you')).toBeTruthy();
    expect(screen.getByText(/in the queue/)).toBeTruthy();
  });

  it('renders nothing until a request is created', () => {
    const { container } = render(<SupportWaitingToast toast={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('opens the thread and dismisses on demand', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(<SupportWaitingToast toast={{ id: 3, name: 'Sara' }} onOpen={onOpen} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open the thread' }));
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dismisses on Escape', () => {
    const onClose = vi.fn();
    render(<SupportWaitingToast toast={{ id: 4, name: 'Sara' }} onOpen={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
