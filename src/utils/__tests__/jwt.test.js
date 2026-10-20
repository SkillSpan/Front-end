import { describe, it, expect } from 'vitest';
import { decodeJwtPayloadUnsafe } from '../jwt';

function makeFakeJwt(payload) {
  const base64UrlEncode = (obj) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64UrlEncode({ alg: 'none' })}.${base64UrlEncode(payload)}.fakesignature`;
}

describe('decodeJwtPayloadUnsafe', () => {
  it('decodes a well-formed JWT payload', () => {
    const token = makeFakeJwt({ email: 'alex@example.com', name: 'Alex' });
    expect(decodeJwtPayloadUnsafe(token)).toEqual({ email: 'alex@example.com', name: 'Alex' });
  });

  it('returns null for garbage input instead of throwing', () => {
    expect(decodeJwtPayloadUnsafe('not-a-jwt')).toBeNull();
    expect(decodeJwtPayloadUnsafe('')).toBeNull();
  });
});
