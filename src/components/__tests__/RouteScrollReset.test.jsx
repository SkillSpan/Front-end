import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import Reset from '../RouteScrollReset';
function Page() {
  const navigate = useNavigate();
  return <><Reset /><button onClick={() => navigate('/register/status')}>Next step</button><button onClick={() => navigate('?filter=all')}>Filter</button><div className="form-right" data-testid="panel" /></>;
}
describe('route scrolling', () => {
  it('resets page and form scrolling on step changes but preserves query updates', () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<MemoryRouter initialEntries={['/register/account']}><Page /></MemoryRouter>);
    const panel = screen.getByTestId('panel');
    panel.scrollTop = 200;
    scroll.mockClear();
    fireEvent.click(screen.getByText('Next step'));
    expect(panel.scrollTop).toBe(0);
    expect(scroll).toHaveBeenCalledOnce();
    panel.scrollTop = 150;
    scroll.mockClear();
    fireEvent.click(screen.getByText('Filter'));
    expect(panel.scrollTop).toBe(150);
    expect(scroll).not.toHaveBeenCalled();
    scroll.mockRestore();
  });
});
