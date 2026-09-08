// utils/payloadMapping.js
// Pure mapping functions between our frontend form state and the payload
// shapes the Laravel API expects. Kept separate from components so they
// can be unit tested without rendering anything (see
// src/utils/__tests__/payloadMapping.test.js).

/**
 * Maps the accumulated individual-registration wizard state
 * (RegisterStep1 + RegisterStep2 + RegisterStep3) to the body expected by
 * POST /api/auth/register.
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
 * Confirmed against RegisterOrganizationRequest::rules() /
 * AuthService::createUser() + createOrganization() in the backend repo:
 * the endpoint creates TWO separate records from one payload -
 *   1) the admin User account -> needs top-level `name` + `email`
 *      (NOT administrator_name / organization_contact_email - those are
 *      the organization's own contact details, a distinct pair of fields)
 *   2) the Organization row -> every organization_* field below is read
 *      by name verbatim in AuthService::createOrganization(), so the
 *      `organization_` prefix is required on all of them.
 *
 *   - name                        <- CompanyStep1 "Administrator Name"
 *   - email                       <- CompanyStep1 email (the account's own
 *                                    login email, never a hardcoded
 *                                    placeholder)
 *   - phone                       <- CompanyStep1 phone (the admin's own,
 *                                    top-level `phone`, distinct from
 *                                    organization_contact_phone)
 *   - password / password_confirmation
 *   - organization_name          <- CompanyStep2 "Company Name"
 *   - organization_type          <- CompanyStep2, restricted to
 *                                    company | university | training_partner
 *   - organization_industry      <- CompanyStep2 "Industry" (kept distinct
 *                                    from organization_type)
 *   - organization_company_size, organization_website,
 *     organization_description
 *   - organization_country, organization_city, organization_address,
 *     organization_postal_code
 *   - proof_file                 <- CompanyStep3 required document (actual
 *                                    File object, not just its name)
 *   - terms_accepted / privacy_accepted <- CompanyStep4
 *
 * `additional_document` is intentionally NOT sent: it isn't in
 * RegisterOrganizationRequest::rules(), so the backend has no field to
 * store it in yet - sending it just gets silently dropped.
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
    organizationContactEmail,
    industry,
    companySize,
    website,
    companyDescription,
    country,
    city,
    address,
    postalCode,
    proofFile,
    agreedTerms,
    agreedPrivacy,
  } = companyData || {};

  const formData = new FormData();

  // Admin (User) account fields.
  formData.append('name', administratorName || '');
  formData.append('email', email || '');
  formData.append('phone', phone || '');
  formData.append('password', password || '');
  formData.append('password_confirmation', confirmPassword || '');
  formData.append('terms_accepted', agreedTerms ? '1' : '0');
  formData.append('privacy_accepted', agreedPrivacy ? '1' : '0');

  // Organization fields - every key needs the organization_ prefix.
  formData.append('organization_name', companyName || '');
  formData.append('organization_type', organizationType || '');
  formData.append('organization_contact_email', organizationContactEmail || email || '');
  formData.append('organization_industry', industry || '');
  formData.append('organization_company_size', companySize || '');
  formData.append('organization_website', website || '');
  formData.append('organization_description', companyDescription || '');
  formData.append('organization_country', country || '');
  formData.append('organization_city', city || '');
  formData.append('organization_address', address || '');
  formData.append('organization_postal_code', postalCode || '');

  // Actual File objects, never just the file name.
  if (proofFile instanceof File) {
    formData.append('proof_file', proofFile);
  }
  return formData;
}

/**
 * Maps the Learner Profile Setup form state to the body expected by
 * POST/PUT /api/v1/profile.
 *
 * Confirmed contract with the backend (learner-profile task):
 *   `university`                 -> university_name         (free text)
 *   `universityId` (student ID)  -> student_university_number
 *   `specialization`             -> specialization          (free text)
 *   `academicLevel`              -> academic_level
 *   `expectedGraduation`         -> expected_graduation     (YYYY-MM-DD)
 *   `bio`                        -> bio
 *   `isPublic` (bool)            -> visibility (public|organization_only|private)
 */
export function buildProfilePayload({
  university,
  universityId,
  specialization,
  academicLevel,
  expectedGraduation,
  bio,
  isPublic,
} = {}) {
  return {
    university_name: university || '',
    student_university_number: universityId || '',
    specialization: specialization || '',
    academic_level: academicLevel || '',
    expected_graduation: expectedGraduation || '',
    bio: bio || '',
    visibility: isPublic ? 'public' : 'private',
  };
}
