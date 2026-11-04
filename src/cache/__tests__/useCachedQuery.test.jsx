import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { useCachedQuery } from '../useCachedQuery';
import { apiKey, clearQueryCache, getQueryData } from '../queryCache';

const KEY = apiKey('/api/v1/company/dashboard');

function Probe({ fetcher, options, label = 'probe', onState }) {
  const q = useCachedQuery(KEY, fetcher, options);
  onState?.(q);
  if (q.isLoading) return <p>{label}: loading</p>;
  if (q.status === 'error') return <p>{label}: error</p>;
  return (
    <p>
      {label}: {String(q.data)}
      {q.isRefreshing ? ' (refreshing)' : ''}
    </p>
  );
}

describe('useCachedQuery', () => {
  it('shows the skeleton only on the first visit; a revisit renders cached data at once', async () => {
    const fetcher = vi.fn().mockResolvedValue('v1');
    const first = render(<Probe fetcher={fetcher} />);
    expect(screen.getByText('probe: loading')).toBeTruthy();
    expect(await screen.findByText('probe: v1')).toBeTruthy();
    first.unmount();

    render(<Probe fetcher={fetcher} />);
    // synchronous: no loading state at all on the second visit
    expect(screen.getByText('probe: v1')).toBeTruthy();
    expect(screen.queryByText('probe: loading')).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1); // still fresh → no request
  });

  it('stale-while-revalidate: shows the cached answer, refetches, then updates the UI', async () => {
    let resolveSecond;
    const fetcher = vi.fn()
      .mockResolvedValueOnce('old')
      .mockImplementationOnce(() => new Promise((r) => { resolveSecond = r; }));
    const first = render(<Probe fetcher={fetcher} options={{ staleTime: 0 }} />);
    expect(await screen.findByText('probe: old')).toBeTruthy();
    first.unmount();

    render(<Probe fetcher={fetcher} options={{ staleTime: 0 }} />);
    expect(screen.getByText('probe: old (refreshing)')).toBeTruthy();
    await waitFor(() => expect(resolveSecond).toBeTypeOf('function'));
    await act(async () => { resolveSecond('new'); });
    expect(await screen.findByText('probe: new')).toBeTruthy();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('dedupes: two screens asking for the same key make one request', async () => {
    const fetcher = vi.fn().mockResolvedValue('shared');
    render(
      <>
        <Probe fetcher={fetcher} label="a" />
        <Probe fetcher={fetcher} label="b" />
      </>,
    );
    expect(await screen.findByText('a: shared')).toBeTruthy();
    expect(screen.getByText('b: shared')).toBeTruthy();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps the answer on screen when a background refresh fails, and refetch() retries', async () => {
    let state;
    const fetcher = vi.fn().mockResolvedValueOnce('kept').mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce('again');
    render(<Probe fetcher={fetcher} onState={(q) => { state = q; }} />);
    expect(await screen.findByText('probe: kept')).toBeTruthy();
    await act(async () => { await state.refetch().catch(() => {}); });
    expect(screen.getByText('probe: kept')).toBeTruthy();
    expect(state.error).toEqual({ status: 500 });
    await act(async () => { await state.refetch(); });
    expect(screen.getByText('probe: again')).toBeTruthy();
  });

  it('setData: optimistic change and rollback go through the cache', async () => {
    let state;
    render(<Probe fetcher={async () => 1} onState={(q) => { state = q; }} />);
    expect(await screen.findByText('probe: 1')).toBeTruthy();
    act(() => { state.setData((n) => n + 1); });
    expect(screen.getByText('probe: 2')).toBeTruthy();
    expect(getQueryData(KEY)).toBe(2);
    act(() => { state.setData((n) => n - 1); });
    expect(screen.getByText('probe: 1')).toBeTruthy();
  });

  it('enabled: false makes no request (preview ?state=loading)', () => {
    const fetcher = vi.fn().mockResolvedValue('x');
    render(<Probe fetcher={fetcher} options={{ enabled: false }} />);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('a cleared cache (logout / 401) takes the data off the screen', async () => {
    render(<Probe fetcher={async () => 'private'} />);
    expect(await screen.findByText('probe: private')).toBeTruthy();
    act(() => { clearQueryCache(); });
    await waitFor(() => expect(screen.queryByText('probe: private')).toBeNull());
  });
});
