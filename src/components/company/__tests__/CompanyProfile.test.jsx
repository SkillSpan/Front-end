import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

vi.mock('../../../api', () => ({
  getCompanyProfile: vi.fn(),
  updateCompanyProfile: vi.fn(),
  uploadCompanyProfileDocument: vi.fn(),
  getOrganizationProfile: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  patchNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  expireSession: vi.fn(),
  unwrapApiData: (res) => res?.data?.data ?? res?.data ?? res,
  logoutUser: vi.fn(),
  logoutAllDevices: vi.fn(),
}));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import CompanyProfile from '../CompanyProfile';
import { validateProfile, computeCompleteness, changedVerificationFields } from '../profile/profileFields';
import { PREVIEW_PROFILE_KEY, getProfile, mapServerErrors, toPatchPayload, updateProfile } from '../profile/companyProfileApi';
import { isValidEmail, isValidPhone, isValidUrl, validateCompanyDocument } from '../../../utils/companyValidation';
import { COMPANY_DOCUMENT_MAX_BYTES } from '../../../config';

// GET /api/v1/profile/me — the US-COMP-04 frontend guide's response shape.
const API_PROFILE = {
  success: true,
  message: 'Organization profile retrieved successfully.',
  data: {
    id: 12,
    name: 'Acme Labs',
    type: 'company',
    industry: 'Software & IT Services',
    company_size: null,
    website: null,
    description: 'We build things.',
    country: 'Jordan',
    city: 'Amman',
    address: 'Street 1',
    postal_code: '11181',
    contact_email: 'hello@acme.example',
    contact_phone: '+962 6 000 0000',
    logo: null,
    verification_status: 'verified',
    verified_at: '2026-10-20T09:12:00+00:00',
    reverification: { required: false, requested_at: null, policy: 'flag', fields: ['name'], message: null },
    documents: {
      business_registration: {
        id: 5, type: 'business_registration', name: 'license.pdf', mime_type: 'application/pdf', size: 1000, version: 1,
        status: 'pending', uploaded_at: '2026-10-01T10:00:00+00:00', available: true, url: '/api/v1/company/profile/documents/5',
      },
      additional: null,
    },
    profile_completeness: 67,
    profile_fields: [
      { key: 'info', level: 'required', done: true },
      { key: 'contact', level: 'required', done: true },
      { key: 'address', level: 'required', done: true },
      { key: 'size', level: 'recommended', done: false },
      { key: 'website', level: 'recommended', done: false },
      { key: 'description', level: 'recommended', done: true },
    ],
    completeness: { percent: 67, version: 'v1', missing: [{ field: 'size', level: 'recommended' }, { field: 'website', level: 'recommended' }] },
    profile_updated_at: '2026-11-03T14:00:00+00:00',
    updated_at: '2026-11-03T14:00:00+00:00',
  },
};

const REP = { name: 'Rana Saleh', organizations: [{ id: 3, name: 'Acme Labs', verification_status: 'verified' }] };

function Where() {
  const loc = useLocation();
  return <div data-testid="where">{loc.pathname}{loc.search}</div>;
}

function mount(ui, { path = '/company/profile' } = {}) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/pending" element={<div>PENDING SCREEN</div>} />
          <Route path="*" element={<>{ui}<Where /></>} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

const field = (label) => screen.getByLabelText(new RegExp(`^${label}`));
const saveButton = () => screen.getAllByRole('button', { name: /Save changes/ })[0];

beforeEach(() => {
  vi.clearAllMocks();
  api.getCompanyProfile.mockResolvedValue(API_PROFILE);
});
afterEach(() => window.localStorage.clear());

describe('validation rules (AC-04, BR-05)', () => {
  it('flags missing required fields', () => {
    const errors = validateProfile({ companyName: '  ', organizationType: 'company', industry: '', country: 'Jordan', city: 'Amman', address: 'x', contactEmail: 'a@b.co', contactPhone: '+962 6 000 0000' });
    expect(errors.companyName).toEqual({ code: 'required' });
    expect(errors.website).toBeUndefined(); // optional
    // PROFILE_CONTACT_REQUIRED: email and phone cannot both be empty
    const both = validateProfile({ companyName: 'A', contactEmail: '', contactPhone: '' });
    expect(both.contactEmail).toEqual({ code: 'contactRequired' });
    expect(validateProfile({ companyName: 'A', contactEmail: '', contactPhone: '+962 6 000 0000' }).contactEmail).toBeUndefined();
    // the server adds https:// to a bare domain
    expect(validateProfile({ companyName: 'A', contactEmail: 'a@b.co', website: 'acme.com' }).website).toBeUndefined();
  });

  it('checks email, website and phone formats', () => {
    expect(isValidEmail('hello@novatech')).toBe(false);
    expect(isValidEmail('hello@novatech.example')).toBe(true);
    expect(isValidUrl('novatech')).toBe(false);
    expect(isValidUrl('ftp://novatech.example')).toBe(false);
    expect(isValidUrl('https://novatech.example')).toBe(true);
    expect(isValidPhone('06-ABC')).toBe(false);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('+962 (6) 000-0000')).toBe(true);
    const errors = validateProfile({ website: 'novatech', contactEmail: 'x@y', contactPhone: '12ab' });
    expect(errors.website.code).toBe('url');
    expect(errors.contactEmail.code).toBe('email');
    expect(errors.contactPhone.code).toBe('phone');
  });

  it('rejects unsupported and oversized documents (AC-07)', () => {
    expect(validateCompanyDocument(new File(['x'], 'scan.heic', { type: 'image/heic' }))).toBe('type');
    expect(validateCompanyDocument(new File(['x'], 'notes.txt', { type: 'text/plain' }))).toBe('type');
    const big = new File(['x'], 'license.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: COMPANY_DOCUMENT_MAX_BYTES + 1 });
    expect(validateCompanyDocument(big)).toBe('size');
    expect(validateCompanyDocument(new File(['x'], 'license.png', { type: 'image/png' }))).toBeNull();
  });
});

describe('Organization Profile view (AC-01, AC-02, AC-09)', () => {
  it('shows the profile, a read-only verification status and the completeness with missing fields', async () => {
    const onNavigate = vi.fn();
    mount(<CompanyProfile user={REP} onNavigate={onNavigate} />);
    expect(await screen.findByRole('heading', { name: 'Acme Labs' })).toBeTruthy();
    expect(api.getCompanyProfile).toHaveBeenCalledTimes(1);
    // server value (profile_completeness / completeness.percent); size + website missing (recommended)
    expect(screen.getByRole('img', { name: 'Profile 67% complete' })).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Profile completeness' });
    expect(within(card).getByText('Recommended')).toBeTruthy();
    expect(within(card).queryByText('Required')).toBeNull();
    fireEvent.click(within(card).getByRole('button', { name: /Company size/ }));
    expect(onNavigate).toHaveBeenCalledWith('/company/profile/edit?focus=companySize');
    // status: text + "managed by SkillSpan", and nothing to change it with
    const status = screen.getByRole('group', { name: 'Verification status' });
    expect(within(status).getByText('Verified')).toBeTruthy();
    expect(within(status).getByText(/Managed by SkillSpan/)).toBeTruthy();
    expect(within(status).queryByRole('button')).toBeNull();
    expect(within(status).queryByRole('combobox')).toBeNull();
  });

  it('lists required fields first when the profile is incomplete', async () => {
    api.getCompanyProfile.mockResolvedValue({ data: { ...API_PROFILE.data, city: null, completeness: { percent: 50, version: 'v1', missing: [{ field: 'address', level: 'required' }, { field: 'size', level: 'recommended' }, { field: 'website', level: 'recommended' }] } } });
    const onNavigate = vi.fn();
    mount(<CompanyProfile user={REP} onNavigate={onNavigate} />);
    const card = await screen.findByRole('region', { name: 'Profile completeness' });
    expect(within(card).getByText('Required')).toBeTruthy();
    // a missing GROUP ("address") opens its first empty field (city)
    fireEvent.click(within(card).getByRole('button', { name: /Address/ }));
    expect(onNavigate).toHaveBeenCalledWith('/company/profile/edit?focus=city');
    expect(computeCompleteness({ companyName: 'A' }, {}).missing.some((m) => m.key === 'contact' && m.level === 'required')).toBe(true);
  });

  it('401 hands over to the session-expired screen, 403 shows access denied with no data', async () => {
    api.getCompanyProfile.mockRejectedValueOnce({ status: 401 });
    const { unmount } = mount(<CompanyProfile user={REP} />);
    await waitFor(() => expect(api.expireSession).toHaveBeenCalled());
    unmount();
    api.getCompanyProfile.mockRejectedValueOnce({ status: 403, code: 'FORBIDDEN' });
    mount(<CompanyProfile user={REP} />);
    expect(await screen.findByText(/don’t have access/i)).toBeTruthy();
    expect(screen.queryByText('Acme Labs')).toBeNull();
  });
});

describe('Organization Profile edit form', () => {
  it('blocks the save with field errors + summary on invalid input (AC-04)', async () => {
    mount(<CompanyProfile user={REP} mode="edit" />, { path: '/company/profile/edit' });
    await screen.findByRole('heading', { name: 'Edit company profile' });
    fireEvent.change(field('Company name'), { target: { value: '' } });
    fireEvent.change(field('Company contact email'), { target: { value: 'hello@acme' } });
    fireEvent.change(field('Website'), { target: { value: 'acme' } });
    fireEvent.change(field('Company contact phone'), { target: { value: '06-ABC' } });
    fireEvent.click(saveButton());
    const summary = await screen.findByRole('alert', { name: /Fix 4 fields before saving/ });
    expect(within(summary).getByRole('link', { name: /Company name/ })).toBeTruthy();
    expect(api.updateCompanyProfile).not.toHaveBeenCalled();
    const email = field('Company contact email');
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toContain('pf-contactEmail-err');
    expect(screen.getByText('Enter a valid email, e.g. name@company.com')).toBeTruthy();
    expect(screen.getByText('Enter a full web address starting with https://')).toBeTruthy();
    expect(email.value).toBe('hello@acme');
  });

  it('shows 422 errors on their fields and keeps every entered value (AC-05)', async () => {
    api.updateCompanyProfile.mockRejectedValueOnce({
      status: 422,
      message: 'The given data was invalid.',
      code: 'PROFILE_VALIDATION_FAILED',
      errors: { contact_email: ['This email is already used by another organization.'] },
    });
    mount(<CompanyProfile user={REP} mode="edit" />, { path: '/company/profile/edit' });
    await screen.findByRole('heading', { name: 'Edit company profile' });
    fireEvent.change(field('Company contact email'), { target: { value: 'team@acme.example' } });
    fireEvent.change(field('City'), { target: { value: 'Irbid' } });
    fireEvent.click(saveButton());
    expect(await screen.findByText('This email is already used by another organization.')).toBeTruthy();
    expect(field('Company contact email').value).toBe('team@acme.example');
    expect(field('City').value).toBe('Irbid');
    expect(field('Company name').value).toBe('Acme Labs');
    // only the changed fields went out, under the backend names, never the status
    expect(api.updateCompanyProfile).toHaveBeenCalledWith({ contact_email: 'team@acme.example', city: 'Irbid' });
    expect(screen.getByTestId('where').textContent).toBe('/company/profile/edit');
  });

  it('shows the re-verification notice only for verification-relevant fields (AC-10)', async () => {
    mount(<CompanyProfile user={REP} mode="edit" />, { path: '/company/profile/edit' });
    await screen.findByRole('heading', { name: 'Edit company profile' });
    fireEvent.change(field('City'), { target: { value: 'Irbid' } });
    expect(screen.queryByText('This change will be reviewed again')).toBeNull();
    fireEvent.change(field('Company name'), { target: { value: 'Acme Labs Group' } });
    expect(screen.getByText('This change will be reviewed again')).toBeTruthy();
    expect(screen.getByText(/You changed Company name/)).toBeTruthy();
    fireEvent.change(field('Company name'), { target: { value: 'Acme Labs' } });
    expect(screen.queryByText('This change will be reviewed again')).toBeNull();
    expect(changedVerificationFields({ companyName: 'B' }, { companyName: 'A' })).toEqual(['companyName']);
    // type is read-only on the server: never part of the PATCH body
    expect(toPatchPayload({ organizationType: 'university', companyName: 'A' }, { organizationType: 'company', companyName: 'A' })).toEqual({});
  });

  it('has no control for the verification status or the representative account (BR-03, BR-11)', async () => {
    mount(<CompanyProfile user={REP} mode="edit" />, { path: '/company/profile/edit' });
    const form = await screen.findByRole('form', { name: 'Edit company profile' });
    const names = [...form.querySelectorAll('input, select, textarea')].map((el) => el.name).filter(Boolean);
    expect(names.some((n) => /status|verif|password|full.?name/i.test(n))).toBe(false);
    expect(within(form).getByText('Verified')).toBeTruthy();
    const payload = toPatchPayload({ companyName: 'X', verificationStatus: 'verified' });
    expect(Object.keys(payload)).not.toContain('verification_status');
    expect(Object.keys(payload)).not.toContain('verificationStatus');
  });

  it('saves, goes back to the profile and shows the confirmation', async () => {
    api.updateCompanyProfile.mockResolvedValueOnce({ data: { ...API_PROFILE.data, website: 'https://acme.example' } });
    mount(<CompanyProfile user={REP} mode="edit" />, { path: '/company/profile/edit' });
    await screen.findByRole('heading', { name: 'Edit company profile' });
    fireEvent.change(field('Website'), { target: { value: 'https://acme.example' } });
    fireEvent.click(saveButton());
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/company/profile'));
  });

  it('asks before discarding changes', async () => {
    const onNavigate = vi.fn();
    mount(<CompanyProfile user={REP} mode="edit" onNavigate={onNavigate} />, { path: '/company/profile/edit' });
    await screen.findByRole('heading', { name: 'Edit company profile' });
    fireEvent.change(field('City'), { target: { value: 'Irbid' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Cancel' })[0]);
    const dialog = screen.getByRole('alertdialog', { name: 'Discard your changes?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    expect(field('City').value).toBe('Irbid');
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

// Documents were removed from the company profile page (Nov 7): the
// document is checked once at registration, so these no longer apply.
describe.skip('Documents (AC-06, AC-07)', () => {
  it('rejects an unsupported or oversized file with a message and does not upload it', async () => {
    mount(<CompanyProfile user={REP} />);
    await screen.findByRole('heading', { name: 'Acme Labs' });
    const input = screen.getByTestId('pf-doc-input-additional');
    fireEvent.change(input, { target: { files: [new File(['x'], 'brochure.docx', { type: 'application/msword' })] } });
    expect(await screen.findByText(/“brochure.docx” isn’t a supported file type/)).toBeTruthy();
    const big = new File(['x'], 'brochure.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 12 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [big] } });
    expect(await screen.findByText(/“brochure.pdf” is 12.0 MB. The limit is 5 MB./)).toBeTruthy();
    expect(api.uploadCompanyProfileDocument).not.toHaveBeenCalled();
  });

  it('uploads a valid file and asks before replacing the trade license of a verified org', async () => {
    api.uploadCompanyProfileDocument.mockResolvedValue({
      success: true,
      data: {
        document: { id: 9, type: 'additional', name: 'brochure.pdf', mime_type: 'application/pdf', size: 2048, version: 1, status: 'pending', uploaded_at: '2026-11-01T10:00:00Z', available: true, url: '/api/v1/company/profile/documents/9' },
        replaced: null,
        profile: API_PROFILE.data,
        reverification_triggered: false,
      },
    });
    mount(<CompanyProfile user={REP} />);
    await screen.findByRole('heading', { name: 'Acme Labs' });
    fireEvent.change(screen.getByTestId('pf-doc-input-additional'), { target: { files: [new File(['x'], 'brochure.pdf', { type: 'application/pdf' })] } });
    expect(await screen.findByText('Additional document uploaded.')).toBeTruthy();
    expect(api.uploadCompanyProfileDocument).toHaveBeenCalledTimes(1);
    const form = api.uploadCompanyProfileDocument.mock.calls[0][0];
    expect(form.get('type')).toBe('additional');

    fireEvent.change(screen.getByTestId('pf-doc-input-trade_license'), { target: { files: [new File(['x'], 'new-license.pdf', { type: 'application/pdf' })] } });
    expect(screen.getByText(/Replacing the trade license sends it for review again/)).toBeTruthy();
    expect(api.uploadCompanyProfileDocument).toHaveBeenCalledTimes(1); // waits for the confirmation
    fireEvent.click(screen.getByRole('button', { name: 'Upload and send for review' }));
    await waitFor(() => expect(api.uploadCompanyProfileDocument).toHaveBeenCalledTimes(2));
  });

  it('maps a server 422 on the file to its message', () => {
    const { fieldErrors, other } = mapServerErrors({ status: 422, errors: { website: [{ code: 'url' }], something_else: ['Nope'] } });
    expect(fieldErrors.website).toEqual({ code: 'url' });
    expect(other).toEqual(['Nope']);
  });
});

describe('preview data (VITE_COMPANY_PREVIEW)', () => {
  it('keeps edits in localStorage and flags a verified org for re-verification on a name change (badge stays Verified)', async () => {
    const before = await getProfile({ preview: true });
    expect(before.values.companyName).toBe('Nova Tech');
    expect(before.completeness.percent).toBe(67); // 4 of 6 groups (size + website missing)
    const after = await updateProfile({ ...before.values, companyName: 'Nova Tech Studio' }, { preview: true, saved: before });
    expect(after.verificationStatus).toBe('verified');
    expect(after.reverification.required).toBe(true);
    expect(after.reverificationTriggered).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(PREVIEW_PROFILE_KEY)).values.companyName).toBe('Nova Tech Studio');
    expect((await getProfile({ preview: true })).values.companyName).toBe('Nova Tech Studio');
  });
});
