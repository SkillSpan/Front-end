/*
 * SAMPLE DATA — FOR DESIGN PREVIEW ONLY.
 * "Nova Tech" is the same fictional company the dashboard preview uses.
 * Nothing here comes from the backend; the shape is what normalizeProfile()
 * in companyProfileApi.js returns.
 */

export const SAMPLE_PROFILE_VALUES = {
  companyName: 'Nova Tech',
  organizationType: 'company',
  industry: 'Software & IT Services',
  companySize: '',
  website: '',
  companyDescription: 'Product studio building web and mobile apps for clinics and retailers. We work with learners on real UX, data and engineering projects.',
  country: 'Jordan',
  city: 'Amman',
  address: 'Office 4, Building 12, Example Street',
  postalCode: '11181',
  contactEmail: 'hello@novatech.example',
  contactPhone: '+962 6 000 0000',
};

export const SAMPLE_DOCUMENTS = {
  trade_license: {
    name: 'nova-tech-trade-license.pdf', size: 1288490, mime: 'application/pdf',
    uploadedAt: '2026-10-08T09:30:00Z', version: 1, status: 'approved', available: true,
  },
  additional: null,
};

export const SAMPLE_PROFILE = {
  values: SAMPLE_PROFILE_VALUES,
  documents: SAMPLE_DOCUMENTS,
  verificationStatus: 'verified',
  verifiedAt: '2026-10-12',
  updatedAt: '2026-10-12T11:05:00Z',
};

// ?state=incomplete — a new organization that skipped most optional fields.
export const SAMPLE_PROFILE_INCOMPLETE = {
  values: {
    ...SAMPLE_PROFILE_VALUES,
    industry: '',
    companySize: '',
    website: '',
    companyDescription: '',
    address: '',
    postalCode: '',
    contactPhone: '',
  },
  documents: { trade_license: null, additional: null },
  verificationStatus: 'pending',
  updatedAt: '2026-11-01T08:00:00Z',
};

// ?state=errors on the edit form: what the representative typed, kept as is.
export const SAMPLE_INVALID_VALUES = {
  ...SAMPLE_PROFILE_VALUES,
  website: 'novatech',
  contactEmail: 'hello@novatech',
  contactPhone: '06-ABC',
  city: '',
};

// …and the 422 the server answered with (field codes, so both languages show).
// Same shape as the guide's PROFILE_VALIDATION_FAILED answer, with field
// codes instead of messages so both languages show.
export const SAMPLE_422 = {
  status: 422,
  code: 'PROFILE_VALIDATION_FAILED',
  message: 'The profile could not be saved. Please check the highlighted fields.',
  errors: {
    website: [{ code: 'url' }],
    contact_email: [{ code: 'email' }],
    contact_phone: [{ code: 'phone' }],
    city: [{ code: 'required' }],
  },
};
