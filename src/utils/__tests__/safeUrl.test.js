import { describe, expect, it } from 'vitest';
import { safeExternalUrl } from '../safeUrl';

describe('safeExternalUrl', () => {
  it('allows normal web links', () => {
    expect(safeExternalUrl('https://example.com/work')).toBe('https://example.com/work');
    expect(safeExternalUrl('http://example.com/')).toBe('http://example.com/');
  });

  it('rejects script, data and malformed links', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeExternalUrl('not a url')).toBeNull();
  });

  it('can require TLS', () => {
    expect(safeExternalUrl('http://example.com', { httpsOnly: true })).toBeNull();
  });
});
