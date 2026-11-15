import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CareerGoalControl from '../CareerGoalControl';

const role = { id: 99, title: 'Data Analyst' };

describe('career goal actions', () => {
  it('selects a goal separately from bookmarks and reports missing analysis honestly', async () => {
    const onSelect = vi.fn().mockResolvedValue({ analysisReady: false });
    render(<CareerGoalControl role={role} currentGoalId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Set as Career Goal' }));
    expect(onSelect).toHaveBeenCalledWith(role);
    expect(await screen.findByRole('status')).toHaveTextContent('Career goal saved. No analysis is available yet.');
  });

  it('identifies the persisted goal and allows explicit calculation', async () => {
    const onCalculate = vi.fn().mockResolvedValue({ analysisReady: true });
    const onSelect = vi.fn();
    render(<CareerGoalControl role={role} currentGoalId="99" onSelect={onSelect} onCalculate={onCalculate} />);
    expect(screen.getByRole('button', { name: 'Current Career Goal' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Calculate Career Analysis' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Career analysis updated.');
    expect(onCalculate).toHaveBeenCalledWith(role);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reports missing skill assessments without claiming calculation succeeded', async () => {
    const onCalculate = vi.fn().mockRejectedValue({ code: 'ASSESSMENT_INCOMPLETE' });
    render(<CareerGoalControl role={role} currentGoalId={99} onCalculate={onCalculate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Calculate Career Analysis' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Complete assessments for all skills required');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('guards duplicate clicks and can retry a failed update', async () => {
    let reject;
    const onSelect = vi.fn().mockImplementationOnce(() => new Promise((_, no) => { reject = no; }))
      .mockResolvedValue({ analysisReady: true });
    render(<CareerGoalControl role={role} onSelect={onSelect} />);
    const button = screen.getByRole('button', { name: 'Set as Career Goal' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
    reject({ message: 'Role is unavailable.' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Role is unavailable.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Set as Career Goal' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Set as Career Goal' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Career goal saved. Your analysis is available');
  });
});
