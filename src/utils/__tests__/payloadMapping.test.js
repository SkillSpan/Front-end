import { describe, it, expect } from 'vitest';
import { buildRegisterPayload, buildOrganizationFormData, buildProfilePayload } from '../payloadMapping';

describe('buildRegisterPayload', () => {
  it('maps wizard field names to the Laravel API contract', () => {
    const payload = buildRegisterPayload({
      fullName: 'Alex Smith',
      email: 'alex@example.com',
      password: 'SuperSecret1!',
      confirmPassword: 'SuperSecret1!',
      academicStatus: 'student',
      agreeTerms: true,
      agreePrivacy: true,
    });

    expect(payload).toEqual({
      name: 'Alex Smith',
      email: 'alex@example.com',
      password: 'SuperSecret1!',
      password_confirmation: 'SuperSecret1!',
      academic_status: 'student',
      terms_accepted: true,
      privacy_accepted: true,
    });
  });

  it('coerces missing agreement flags to false rather than undefined', () => {
    const payload = buildRegisterPayload({
      fullName: 'Alex Smith',
      email: 'alex@example.com',
      password: 'x',
      confirmPassword: 'x',
      academicStatus: 'graduate',
    });

    expect(payload.terms_accepted).toBe(false);
    expect(payload.privacy_accepted).toBe(false);
  });
});

describe('buildOrganizationFormData', () => {
  const baseCompanyData = {
    administratorName: 'Sam Admin',
    email: 'sam@acme.test',
    phone: '+1-555-0100',
    password: 'orgpass123',
    confirmPassword: 'orgpass123',
    companyName: 'Acme Inc',
    organizationType: 'company',
    industry: 'Software & IT Services',
    companySize: '11 - 50 employees',
    website: 'https://acme.test',
    companyDescription: 'We build things.',
    country: 'Jordan',
    city: 'Amman',
    address: '123 Main St',
    postalCode: '11183',
    agreedTerms: true,
    agreedPrivacy: true,
  };

  it('builds a FormData instance (multipart/form-data), not JSON', () => {
    const fd = buildOrganizationFormData(baseCompanyData);
    expect(fd).toBeInstanceOf(FormData);
  });

  it('maps organization_type separately from organization_industry', () => {
    const fd = buildOrganizationFormData(baseCompanyData);
    expect(fd.get('organization_type')).toBe('company');
    expect(fd.get('organization_industry')).toBe('Software & IT Services');
    expect(fd.get('organization_type')).not.toBe(fd.get('organization_industry'));
  });

  it('uses the real submitted email, never a hardcoded placeholder', () => {
    const fd = buildOrganizationFormData(baseCompanyData);
    expect(fd.get('organization_contact_email')).toBe('sam@acme.test');
    expect(fd.get('organization_contact_email')).not.toBe('info@company.com');
  });

  it('sends the actual File object for the required proof document, not its name', () => {
    const file = new File(['dummy content'], 'registration.pdf', { type: 'application/pdf' });
    const fd = buildOrganizationFormData({ ...baseCompanyData, proofFile: file });

    const sent = fd.get('proof_file');
    expect(sent).toBeInstanceOf(File);
    expect(sent.name).toBe('registration.pdf');
  });

  it('omits the optional document when none was provided', () => {
    const fd = buildOrganizationFormData(baseCompanyData);
    expect(fd.get('additional_document')).toBeNull();
  });

  it('maps administrator name and account fields', () => {
    const fd = buildOrganizationFormData(baseCompanyData);
    expect(fd.get('administrator_name')).toBe('Sam Admin');
    expect(fd.get('password_confirmation')).toBe('orgpass123');
  });
});

describe('buildProfilePayload', () => {
  it('maps the Profile Setup form fields to the API contract', () => {
    const payload = buildProfilePayload({
      university: 'The Islamic University',
      universityId: '2021900123',
      specialization: 'Marketing',
      academicLevel: 'second_year',
      expectedGraduation: '2027',
      bio: 'Aspiring product marketer.',
      isPublic: true,
    });

    expect(payload).toEqual({
      university_name: 'The Islamic University',
      student_university_number: '2021900123',
      specialization: 'Marketing',
      academic_level: 'second_year',
      expected_graduation: '2027',
      bio: 'Aspiring product marketer.',
      visibility: 'public',
    });
  });

  it('defaults missing fields / non-public toggle to private', () => {
    const payload = buildProfilePayload();

    expect(payload).toEqual({
      university_name: '',
      student_university_number: '',
      specialization: '',
      academic_level: '',
      expected_graduation: '',
      bio: '',
      visibility: 'private',
    });
  });
});
