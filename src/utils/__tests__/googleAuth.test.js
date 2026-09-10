import { describe, it, expect } from 'vitest';
import { isTermsRequiredError } from '../googleAuth';

describe('isTermsRequiredError', () => {
  it('returns false for no error', () => {
    expect(isTermsRequiredError(null)).toBe(false);
    expect(isTermsRequiredError(undefined)).toBe(false);
  });

  it('returns true for a 428 Precondition Required response', () => {
    expect(isTermsRequiredError({ status: 428 })).toBe(true);
  });

  it('returns true when validation errors mention terms_accepted', () => {
    expect(
      isTermsRequiredError({
        status: 422,
        errors: { terms_accepted: ['The terms accepted field is required.'] },
      })
    ).toBe(true);
  });

  it('returns true when validation errors mention privacy_accepted', () => {
    expect(
      isTermsRequiredError({
        status: 422,
        errors: { privacy_accepted: ['The privacy accepted field is required.'] },
      })
    ).toBe(true);
  });

  it('returns false for an unrelated validation error', () => {
    expect(
      isTermsRequiredError({
        status: 422,
        errors: { credential: ['The credential is invalid.'] },
      })
    ).toBe(false);
  });

  it('returns false for a plain 401 (invalid credentials, not a new account)', () => {
    expect(isTermsRequiredError({ status: 401, errors: {} })).toBe(false);
  });
});
