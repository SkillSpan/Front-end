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
 * Field contract CONFIRMED against the deployed backend (a 422 validation
 * response on an empty POST lists every required field):
 *   - name                       <- CompanyStep1 "Administrator Name"
 *   - email                      <- CompanyStep1 email (the account's own
 *                                    email, never a hardcoded placeholder)
 *   - organization_contact_email <- CompanyStep1 email (same value for now;
 *                                    the backend requires it separately - if
 *                                    it ever needs to differ from the account
 *                                    email, a dedicated UI field must be added)
 *   - phone
 *   - password / password_confirmation
 *   - organization_name          <- CompanyStep2 "Company Name"
 *   - organization_type          <- CompanyStep2, restricted to
 *                                    company | university | training_partner
 *   - organization_industry      <- CompanyStep2 "Industry" (kept distinct
 *                                    from organization_type)
 *   - organization_size, website, description
 *   - country, city, address, postal_code
 *   - proof_file                 <- CompanyStep3 required document (actual
 *                                    File object, not just its name)
 *   - additional_document        <- CompanyStep3 optional document
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
  formData.append('organization_contact_email', email || '');
  formData.append('phone', phone || '');
  formData.append('password', password || '');
  formData.append('password_confirmation', confirmPassword || '');
  formData.append('organization_name', companyName || '');
  formData.append('organization_type', organizationType || '');
  formData.append('organization_industry', industry || '');
  formData.append('organization_size', companySize || '');
  formData.append('website', website || '');
  formData.append('description', companyDescription || '');
  formData.append('country', country || '');
  formData.append('city', city || '');
  formData.append('address', address || '');
  formData.append('postal_code', postalCode || '');
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
