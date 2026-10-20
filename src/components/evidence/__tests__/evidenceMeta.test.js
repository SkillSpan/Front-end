import { describe, it, expect } from 'vitest';

import {
  MAX_EVIDENCE_BYTES,
  MAX_EVIDENCE_DESCRIPTION,
  TYPE_META,
  validateFile,
  validateUrl,
} from '../lib/evidenceMeta';

// The API (`Api\EvidenceController@store`) validates:
//   'evidence_file' => 'mimes:pdf,jpg,jpeg,png,webp', 'max:10000'
//   'evidence_url'  => 'url'
//   'description'   => 'max:500'
// The form used to offer .doc/.docx/.zip/.fig and a 20 MB cap, so a learner
// could pick a file the API answers with 422. These tests pin the two lists
// together.
const API_MIMES = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

function fakeFile(name, size = 1024) {
  return { name, size };
}

describe('evidence form contract', () => {
  it('only offers extensions the API accepts', () => {
    Object.values(TYPE_META).forEach((meta) => {
      (meta.accept || []).forEach((extension) => {
        expect(API_MIMES).toContain(extension);
      });
    });
  });

  it('rejects the types the API refuses', () => {
    ['.doc', '.docx', '.zip', '.fig', '.sketch', '.php', '.svg'].forEach((extension) => {
      expect(validateFile(fakeFile(`proof${extension}`), 'document')).toMatch(
        /Unsupported file type/,
      );
    });
  });

  it('accepts a PDF and an image', () => {
    expect(validateFile(fakeFile('certificate.pdf'), 'document')).toBe('');
    expect(validateFile(fakeFile('shot.PNG'), 'design')).toBe('');
  });

  it('caps uploads at the API limit', () => {
    expect(MAX_EVIDENCE_BYTES).toBe(10 * 1024 * 1024);
    expect(validateFile(fakeFile('big.pdf', MAX_EVIDENCE_BYTES + 1), 'document')).toMatch(
      /too large/,
    );
    expect(validateFile(fakeFile('ok.pdf', MAX_EVIDENCE_BYTES), 'document')).toBe('');
  });

  it('matches the API description ceiling', () => {
    expect(MAX_EVIDENCE_DESCRIPTION).toBe(500);
  });

  it('requires an https GitHub URL for repository evidence', () => {
    expect(validateUrl('github', 'https://github.com/user/repo')).toBe('');
    expect(validateUrl('github', 'http://github.com/user/repo')).toMatch(/https/);
    expect(validateUrl('github', 'https://gitlab.com/user/repo')).toMatch(/GitHub/);
    expect(validateUrl('live', 'https://app.vercel.app')).toBe('');
  });
});
