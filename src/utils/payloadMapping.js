// utils/payloadMapping.js
// Pure mapping functions between our frontend form state and the payload
// shapes the Laravel API expects. Kept separate from components so they
// can be unit tested without rendering anything (see
// src/utils/__tests__/payloadMapping.test.js).

/**
 * Maps the accumulated individual-registration wizard state
 * (RegisterStep1 + RegisterStep2 + RegisterStep3) to the body expected by
 * POST /api/v1/auth/register.
 *
 * Mapping (per backend contract review):
 *   fullName        -> name
 *   confirmPassword -> password_confirmation
 *   academicStatus  -> academic_status
 *   agreeTerms      -> terms_accepted
 *   agreePrivacy    -> privacy_accepted
 */
export function buildRegisterPayload(registerData) {
  const {
    fullName,
    email,
    password,
    confirmPassword,
    academicStatus,
    agreeTerms,
    agreePrivacy,
  } = registerData || {};

  return {
    name: fullName,
    email,
    password,
    password_confirmation: confirmPassword,
    academic_status: academicStatus,
    terms_accepted: !!agreeTerms,
    privacy_accepted: !!agreePrivacy,
  };
}

/**
 * Maps the accumulated organization-registration wizard state
 * (CompanyStep1..CompanyStep4) to a multipart/form-data FormData instance
 * for POST /api/auth/register/organization.
 *
 * Field names follow RegisterOrganizationRequest on the backend. Every
 * organization detail is sent under its `organization_` name; the backend
 * still reads the old unprefixed names as a fallback, but only the prefixed
 * ones are the contract.
 *   - name / email / phone        <- CompanyStep1 administrator account
 *   - organization_contact_email  <- the account's own email
 *   - organization_contact_phone  <- the account's own phone
 *   - organization_name / organization_type / organization_industry
 *   - organization_company_size, organization_website,
 *     organization_description, organization_country, organization_city,
 *     organization_address, organization_postal_code
 *   - proof_file                  <- CompanyStep3 required document (actual
 *                                    File object, not just its name)
 *   - additional_document         <- CompanyStep3 optional document
 *   - terms_accepted / privacy_accepted <- CompanyStep4
 */
export function buildOrganizationFormData(companyData) {
  const {
    administratorName,
    email,
    phone,
    password,
    confirmPassword,
    companyName,
    organizationType,
    industry,
    companySize,
    website,
    companyDescription,
    country,
    city,
    address,
    postalCode,
    proofFile,
    additionalFile,
    agreedTerms,
    agreedPrivacy,
  } = companyData || {};

  const formData = new FormData();

  formData.append('name', administratorName || '');
  formData.append('email', email || '');
  formData.append('phone', phone || '');
  formData.append('password', password || '');
  formData.append('password_confirmation', confirmPassword || '');
  formData.append('organization_contact_email', email || '');
  formData.append('organization_contact_phone', phone || '');
  formData.append('organization_name', companyName || '');
  formData.append('organization_type', organizationType || '');
  formData.append('organization_industry', industry || '');
  formData.append('organization_company_size', companySize || '');
  formData.append('organization_website', website || '');
  formData.append('organization_description', companyDescription || '');
  formData.append('organization_country', country || '');
  formData.append('organization_city', city || '');
  formData.append('organization_address', address || '');
  formData.append('organization_postal_code', postalCode || '');
  formData.append('terms_accepted', agreedTerms ? '1' : '0');
  formData.append('privacy_accepted', agreedPrivacy ? '1' : '0');

  // Actual File objects, never just the file name.
  if (proofFile instanceof File) {
    formData.append('proof_file', proofFile);
  }
  if (additionalFile instanceof File) {
    formData.append('additional_document', additionalFile);
  }

  return formData;
}

/**
 * Maps the Learner Profile Setup form state to the body expected by
 * POST/PUT /api/v1/profile.
 *
 * Confirmed contract with the backend (learner-profile task):
 *   `university`                 -> university_name         (free text)
 *   `studentId`  -> student_university_number
 *   `specialization`             -> specialization          (free text)
 *   `academicLevel`              -> academic_level
 *   `expectedGraduation`         -> expected_graduation     (year, integer)
 *   `bio`                        -> bio
 *   `isPublic` (bool)            -> visibility (public|organization_only|private)
 */
export function buildProfilePayload({
  university,
  studentId,
  specialization,
  academicLevel,
  expectedGraduation,
  bio,
  isPublic,
} = {}) {
  return {
    university_name: university || '',
    student_university_number: studentId || '',
    specialization: specialization || '',
    academic_level: academicLevel || '',
    expected_graduation: expectedGraduation ? Number(expectedGraduation) : null,
    bio: bio || '',
    visibility: isPublic ? 'public' : 'private',
  };
}
