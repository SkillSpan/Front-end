import { describe, it, expect } from 'vitest';
import { displayName } from '../displayName';

describe('displayName', () => {
  it('prefers the account name', () => {
    expect(displayName({ name: 'Rawan Haddad', email: 'r@x.io' })).toBe('Rawan Haddad');
  });

  it('falls back to full_name, first/last name, nested user and email', () => {
    expect(displayName({ full_name: 'Sara Ali' })).toBe('Sara Ali');
    expect(displayName({ first_name: 'Sara', last_name: 'Ali' })).toBe('Sara Ali');
    expect(displayName({ user: { name: 'Omar' } })).toBe('Omar');
    expect(displayName({ email: 'lina@example.com' })).toBe('lina');
  });

  it('returns the fallback when nothing identifies the person', () => {
    expect(displayName({ id: 5, university_name: 'IUG' }, 'there')).toBe('there');
    expect(displayName(null, 'there')).toBe('there');
  });
});
