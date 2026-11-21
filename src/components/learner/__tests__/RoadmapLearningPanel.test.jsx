import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RoadmapLearningPanel from '../RoadmapLearningPanel';
import { getRoadmapResources, startRoadmapResource, updateRoadmapProgress } from '../../../api';

vi.mock('../../../api', () => ({ getRoadmapResources: vi.fn(), startRoadmapResource: vi.fn(), updateRoadmapProgress: vi.fn() }));
const resource = { id: 7, title: 'Official SQL tutorial', provider: 'PostgreSQL', language: 'en', url: 'https://www.postgresql.org/docs/current/tutorial-sql.html' };
const action = { id: 3, objective: 'Learn SQL' };
describe('roadmap learning', () => {
  beforeEach(() => vi.resetAllMocks());
  it('shows an honest empty state when no resource is approved', async () => {
    getRoadmapResources.mockResolvedValue({ data: { resources: [], activity: null } });
    render(<RoadmapLearningPanel action={action} onClose={() => {}} />);
    expect(await screen.findByText(/No approved resource/)).toBeInTheDocument();
    expect(startRoadmapResource).not.toHaveBeenCalled();
  });
  it('records start before offering the external link and submits evidence as pending', async () => {
    getRoadmapResources.mockResolvedValue({ data: { resources: [resource], activity: null } });
    startRoadmapResource.mockResolvedValue({ data: { activity: { learning_resource_id: 7, progress_value: 0, verification_state: 'unverified' }, url: resource.url } });
    updateRoadmapProgress.mockResolvedValue({ data: { learning_resource_id: 7, progress_value: 100, verification_state: 'pending' } });
    render(<RoadmapLearningPanel action={action} onClose={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Start learning' }));
    expect(await screen.findByRole('link', { name: /Resume learning/ })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(startRoadmapResource).toHaveBeenCalledWith(3, 7);
    fireEvent.change(screen.getByLabelText(/Self-reported progress/), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Completion evidence'), { target: { value: 'Query and explanation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save progress' }));
    await waitFor(() => expect(updateRoadmapProgress).toHaveBeenCalledWith(3, { progress_value: 100, completion_evidence: 'Query and explanation' }));
    expect(await screen.findByText(/Evidence submitted as pending review/)).toBeInTheDocument();
  });
  it('shows a server rejection without opening a resource', async () => {
    getRoadmapResources.mockResolvedValue({ data: { resources: [resource], activity: null } });
    startRoadmapResource.mockRejectedValue({ message: 'This roadmap has been superseded.' });
    render(<RoadmapLearningPanel action={action} onClose={() => {}} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Start learning' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('superseded');
    expect(screen.queryByRole('link', { name: /Resume learning/ })).not.toBeInTheDocument();
  });
  it('resumes a saved resource without posting start again or changing progress', async () => {
    getRoadmapResources.mockResolvedValue({ data: { resources: [resource], activity: { learning_resource_id: 7, progress_value: '25.00', verification_state: 'unverified' } } });
    render(<RoadmapLearningPanel action={action} onClose={() => {}} />);
    const resume = await screen.findByRole('link', { name: /Resume learning/ });
    expect(resume).toHaveAttribute('href', resource.url);
    expect(resume).toHaveAttribute('target', '_blank');
    expect(screen.getByLabelText(/Self-reported progress/)).toHaveValue(25);
    expect(screen.queryByRole('button', { name: /Resume learning/ })).not.toBeInTheDocument();
    expect(startRoadmapResource).not.toHaveBeenCalled();
  });
});
