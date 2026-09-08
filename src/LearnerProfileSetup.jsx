import { useEffect, useState } from 'react';
import './LearnerProfileSetup.css';
import SearchableSelect from './SearchableSelect';
import {
  createProfile,
  getProfile,
  getUniversities,
  getSpecializations,
  getCountries,
  getUniversitiesByCountry,
} from './api';
import { buildProfilePayload } from './utils/payloadMapping';

// Fallback reference universities for the West Bank / Palestine region,
// since that's who this build is currently serving. Used only if
// GET /api/v1/reference/universities is unreachable (offline, backend not
// deployed yet, etc.) - see the reference-data effect below. "Other" always lets
// someone type their own so this never blocks a real submission either way.
const FALLBACK_UNIVERSITIES = [
  'The Islamic University',
  'An-Najah National University',
  'Birzeit University',
  'Al-Quds University',
  'Palestine Polytechnic University',
  'Hebron University',
  'Islamic University of Gaza',
  'Other',
];

const FALLBACK_SPECIALIZATIONS = [
  'Computer Science',
  'Software Engineering',
  'Information Technology',
  'Business Administration',
  'Marketing',
  'Finance',
  'Accounting',
  'Civil Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Graphic Design',
  'Law',
  'Medicine',
  'Pharmacy',
  'Other',
];

// Fallback country list - used only if GET /api/v1/reference/countries is
// unreachable, so the Country field (and the University-by-country
// filtering it drives) is always visible instead of silently disappearing
// when the backend isn't reachable yet.
const FALLBACK_COUNTRIES = ['Palestine'];

// GET /api/v1/reference/{universities,specializations,countries} (see
// api.js) return shapes aren't confirmed with the backend yet - this
// accepts either a plain array of strings or an array of
// {id, name}-shaped objects and always produces a flat string list, so the
// <select> below never breaks on whichever shape the API actually sends.
const normalizeNameList = (res) => {
  const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  return list
    .map((item) => (typeof item === 'string' ? item : item?.name ?? item?.title ?? null))
    .filter(Boolean);
};

const ACADEMIC_LEVELS = [
  { value: 'first_year', label: 'First year' },
  { value: 'second_year', label: 'Second year' },
  { value: 'third_year', label: 'Third year' },
  { value: 'fourth_year', label: 'Fourth year' },
  { value: 'fifth_year', label: 'Fifth year' },
  { value: 'graduate', label: 'Graduate' },
];

const CURRENT_YEAR = new Date().getFullYear();
// Starts at 2015 so learners who already graduated years ago can still
// pick their real graduation year, and still runs a few years into the
// future for people who haven't graduated yet.
const GRADUATION_START_YEAR = 2015;
const GRADUATION_YEARS = Array.from(
  { length: CURRENT_YEAR + 6 - GRADUATION_START_YEAR + 1 },
  (_, i) => GRADUATION_START_YEAR + i
);

// Steps shown in the sidebar. This screen is always "Profile Setup" (step
// 3) - Account and Email Verification are already done by the time a
// learner reaches here, and Assessment comes right after.
const STEPS = [
  { label: 'Account', status: 'done' },
  { label: 'Email Verification', status: 'done' },
  { label: 'Profile Setup', status: 'active' },
  { label: 'Assessment', status: 'upcoming' },
];

const AvatarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Learner Profile Setup — sits between email verification and the
 * readiness assessment in the registration wizard (see RegisterWizard.jsx).
 * Talks to the learner profile endpoints documented in
 * api_endpoints_render.md (POST/GET/PUT /api/v1/profile, role:learner only,
 * requires a bearer token - the wizard makes sure one exists before
 * routing here).
 *
 * `onComplete` fires after a successful save (there's no Assessment page
 * in this codebase yet, so the wizard currently sends the learner home).
 * `onSkip` fires for "Save and complete later" - we still make a
 * best-effort save of whatever was filled in, but never block navigation
 * on it.
 */
/**
 * Formats an API error into a single string for display. Laravel returns
 * *all* failing fields in `errors` at once (not just the first), so when
 * the request body doesn't match the backend's contract we show every
 * failing field's message together - that surfaces every mismatch in one
 * round trip instead of a slow whack-a-mole across repeated submits.
 */
const formatApiError = (err) => {
  if (err.errors && Object.keys(err.errors).length > 0) {
    return Object.values(err.errors)
      .flat()
      .join(' ');
  }
  return err.message || 'Something went wrong while saving your profile.';
};

const LearnerProfileSetup = ({ onComplete, onSkip }) => {
  const [university, setUniversity] = useState('');
  const [universityOther, setUniversityOther] = useState('');
  // The learner's own university/student ID number (their matriculation
  // number), typed in directly - separate from the university's name.
  const [universityIdNumber, setUniversityIdNumber] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [specializationOther, setSpecializationOther] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [expectedGraduation, setExpectedGraduation] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [error, setError] = useState('');

  // Reference data (GET /api/v1/reference/*, see api.js) - public, no
  // token required. Falls back to the static lists above if the backend
  // is unreachable, so this screen never gets stuck with empty dropdowns.
  const [universities, setUniversities] = useState(FALLBACK_UNIVERSITIES);
  const [specializations, setSpecializations] = useState(FALLBACK_SPECIALIZATIONS);
  const [countries, setCountries] = useState(FALLBACK_COUNTRIES);
  // Country -> University coupling: picking a country re-fetches the
  // University dropdown scoped to it via
  // GET /api/v1/reference/countries/{country}/universities (see api.js).
  // Left unset ("All countries"), the full unfiltered university list is
  // shown instead. This is purely a UI filter - `country` is never sent to
  // POST /api/v1/profile (no such field in that confirmed contract).
  const [country, setCountry] = useState('');
  const [universitiesLoading, setUniversitiesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [uniRes, specRes, countryRes] = await Promise.all([
          getUniversities(),
          getSpecializations(),
          getCountries(),
        ]);
        if (cancelled) return;
        const uniList = normalizeNameList(uniRes);
        const specList = normalizeNameList(specRes);
        const countryList = normalizeNameList(countryRes);
        if (uniList.length) setUniversities([...uniList, 'Other']);
        if (specList.length) setSpecializations([...specList, 'Other']);
        if (countryList.length) setCountries(countryList);
      } catch {
        // Reference endpoints unreachable - keep the fallback lists above.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-fetches the university list scoped to the chosen country and drops
  // whatever was previously selected if it doesn't exist in the new list
  // (so the form never silently keeps an out-of-country university
  // selected). Best effort - a failed/empty response just leaves the
  // current (unfiltered) list in place instead of blocking the field.
  const handleCountryChange = async (value) => {
    setCountry(value);

    if (!value) {
      try {
        const res = await getUniversities();
        const list = normalizeNameList(res);
        if (list.length) setUniversities([...list, 'Other']);
      } catch {
        // Keep whatever university list is already showing.
      }
      return;
    }

    setUniversitiesLoading(true);
    try {
      const res = await getUniversitiesByCountry(value);
      const list = normalizeNameList(res);
      if (list.length) {
        const nextUniversities = [...list, 'Other'];
        setUniversities(nextUniversities);
        setUniversity((prev) => (nextUniversities.includes(prev) ? prev : ''));
      } else {
        // No universities returned for this country - don't leave the
        // learner stuck with a stale list from a different country.
        setUniversities(['Other']);
        setUniversity((prev) => (prev === 'Other' ? prev : ''));
      }
    } catch {
      // Keep whatever university list is already showing.
    } finally {
      setUniversitiesLoading(false);
    }
  };

  // Best-effort prefill in case the learner already started (or fully
  // completed) their profile in an earlier session. A missing profile
  // (404) or any other failure is expected/harmless here - we just start
  // from a blank form.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getProfile();
        const data = res?.data || res || {};
        if (cancelled || !data) return;
        if (data.university_name) setUniversity(data.university_name);
        if (data.student_university_number) setUniversityIdNumber(String(data.student_university_number));
        if (data.specialization) setSpecialization(data.specialization);
        if (data.academic_level) setAcademicLevel(data.academic_level);
        if (data.expected_graduation) setExpectedGraduation(String(data.expected_graduation));
        if (data.bio) setBio(data.bio);
        if (typeof data.visibility === 'string') setIsPublic(data.visibility === 'public');
      } catch {
        // No existing profile yet (or not reachable) - that's fine, the
        // learner is filling this in for the first time.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedUniversity = university === 'Other' ? universityOther.trim() : university;
  const resolvedSpecialization = specialization === 'Other' ? specializationOther.trim() : specialization;

  const requiredFields = [
    resolvedUniversity,
    universityIdNumber.trim(),
    resolvedSpecialization,
    academicLevel,
    expectedGraduation,
  ];
  const filledRequiredCount = requiredFields.filter(Boolean).length;
  const isComplete = filledRequiredCount === requiredFields.length;

  // 5 required fields + the visibility toggle each count for one sixth of
  // the progress bar. Bio is optional and doesn't affect completion.
  const completionPct = Math.round(((filledRequiredCount + (isPublic ? 1 : 0)) / 6) * 100);

  const markTouched = () => {
    if (!touched) setTouched(true);
  };

  const buildPayload = () =>
    buildProfilePayload({
      university: resolvedUniversity,
      universityId: universityIdNumber.trim(),
      specialization: resolvedSpecialization,
      academicLevel,
      expectedGraduation,
      bio,
      isPublic,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    markTouched();
    if (!isComplete) {
      setError('Please fill in all required fields before continuing.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await createProfile(buildPayload());
      if (typeof onComplete === 'function') onComplete();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLater = async () => {
    setIsSkipping(true);
    const hasAnyInput = filledRequiredCount > 0 || bio.trim() || isPublic;
    if (hasAnyInput) {
      try {
        await createProfile(buildPayload());
      } catch {
        // Best effort only - we never want an incomplete/invalid partial
        // save to trap someone on this screen when they've asked to leave.
      }
    }
    setIsSkipping(false);
    if (typeof onSkip === 'function') onSkip();
  };

  return (
    <div className="profile-setup-wrapper">
      <div className="profile-setup-card">
        <div className="profile-setup-sidebar">
          <div className="profile-setup-brand">SkillSpan</div>

          <div className="profile-setup-avatar-box">
            <span className="profile-setup-dot dot-1" />
            <span className="profile-setup-dot dot-2" />
            <span className="profile-setup-dot dot-3" />
            <div className="profile-setup-avatar-circle">
              <AvatarIcon />
            </div>
          </div>

          <h2 className="profile-setup-heading">Build Your Professional Profile</h2>
          <p className="profile-setup-desc">
            Complete your profile to unlock your personalized learning journey and continue to the
            assessment.
          </p>

          <ul className="profile-setup-steps">
            {STEPS.map((step, index) => (
              <li key={step.label} className={`profile-setup-step ${step.status}`}>
                <span className="profile-setup-step-marker">
                  {step.status === 'done' ? <CheckIcon /> : index + 1}
                </span>
                <span className="profile-setup-step-label">{step.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="profile-setup-form-panel">
          <h1>Complete Your Profile</h1>
          <p>Tell us about yourself so we can personalize your SkillSpan journey.</p>

          <div className="profile-setup-completion-box">
            <div className="profile-setup-completion-row">
              <span className="profile-setup-completion-label">Profile completion</span>
              <span className="profile-setup-completion-pct">{completionPct}% Complete</span>
            </div>
            <div className="profile-setup-progress-track">
              <div className="profile-setup-progress-fill" style={{ width: `${completionPct}%` }} />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="profile-setup-field">
              <label>Country</label>
              <SearchableSelect
                options={countries}
                value={country}
                onChange={handleCountryChange}
                placeholder="All countries"
                searchPlaceholder="Search countries…"
                allowClear
                clearLabel="All countries"
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Pick a country to filter the University list below to that country only.
              </span>
            </div>

            <div className={`profile-setup-field ${touched && !resolvedUniversity ? 'field-error' : ''}`}>
              <label>
                University<span className="required-star">*</span>
              </label>
              <SearchableSelect
                options={universities}
                value={university}
                onChange={(value) => {
                  setUniversity(value);
                  markTouched();
                }}
                placeholder="Select your university"
                searchPlaceholder="Search universities…"
                loading={universitiesLoading}
                hasError={touched && !resolvedUniversity}
              />
              {university === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your university name"
                  value={universityOther}
                  onChange={(e) => setUniversityOther(e.target.value)}
                  style={{ marginTop: '10px' }}
                />
              )}
            </div>

            <div className={`profile-setup-field ${touched && !universityIdNumber.trim() ? 'field-error' : ''}`}>
              <label>
                University ID Number<span className="required-star">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter your student/university ID number"
                value={universityIdNumber}
                onChange={(e) => {
                  setUniversityIdNumber(e.target.value);
                  markTouched();
                }}
              />
            </div>

            <div
              className={`profile-setup-field ${touched && !resolvedSpecialization ? 'field-error' : ''}`}
            >
              <label>
                Specialization<span className="required-star">*</span>
              </label>
              <SearchableSelect
                options={specializations}
                value={specialization}
                onChange={(value) => {
                  setSpecialization(value);
                  markTouched();
                }}
                placeholder="Select your specialization"
                searchPlaceholder="Search specializations…"
                hasError={touched && !resolvedSpecialization}
              />
              {specialization === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter your specialization"
                  value={specializationOther}
                  onChange={(e) => setSpecializationOther(e.target.value)}
                  style={{ marginTop: '10px' }}
                />
              )}
            </div>

            <div className="profile-setup-row">
              <div className={`profile-setup-field ${touched && !academicLevel ? 'field-error' : ''}`}>
                <label>
                  Academic Level<span className="required-star">*</span>
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => {
                    setAcademicLevel(e.target.value);
                    markTouched();
                  }}
                >
                  <option value="">Select level</option>
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl.value} value={lvl.value}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className={`profile-setup-field ${touched && !expectedGraduation ? 'field-error' : ''}`}
              >
                <label>
                  Expected Graduation<span className="required-star">*</span>
                </label>
                <select
                  value={expectedGraduation}
                  onChange={(e) => {
                    setExpectedGraduation(e.target.value);
                    markTouched();
                  }}
                >
                  <option value="">Select year</option>
                  {GRADUATION_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="profile-setup-field">
              <label>Short Bio (optional)</label>
              <textarea
                placeholder="Tell us briefly about yourself, your interests, or your career goals..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="profile-setup-visibility">
              <div className="profile-setup-visibility-text">
                <strong>Profile Visibility</strong>
                <span>Allow companies and educational institutions to view your professional profile.</span>
              </div>
              <div className="profile-setup-visibility-toggle">
                <span>Public</span>
                <button
                  type="button"
                  className={`profile-setup-switch ${isPublic ? 'on' : ''}`}
                  role="switch"
                  aria-checked={isPublic}
                  aria-label="Profile visibility"
                  onClick={() => setIsPublic((prev) => !prev)}
                >
                  <span className="profile-setup-switch-knob" />
                </button>
              </div>
            </div>

            {error && <div className="profile-setup-server-error">{error}</div>}

            <button type="submit" className="profile-setup-submit" disabled={!isComplete || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Proceed to Assessment →'}
            </button>
          </form>

          <button type="button" className="profile-setup-later" onClick={handleSaveLater} disabled={isSkipping}>
            {isSkipping ? 'Saving...' : 'Save and complete later'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearnerProfileSetup;
