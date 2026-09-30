// utils/googleAuth.js
//
// NOTE: not currently used by Login.jsx. We switched to collecting
// Terms/Privacy agreement in our own UI BEFORE Google's popup opens (since
// Google's account picker can't host third-party checkboxes), so we always
// send terms_accepted/privacy_accepted = true and this post-hoc "was that
// a new account?" detection is no longer needed for that flow. Kept here
// (and tested) in case a future flow needs to detect this from a response
// after the fact - e.g. if the upfront-consent screen ever needs to be
// removed in favor of only asking new users.
//
// Backend contract (google_login_frontend_guide.pdf) describes the intended
// flow as: existing account -> log in directly; new account -> show
// Terms & Privacy first, then create the account. It does not specify how
// the frontend is supposed to tell the two cases apart before an account
// exists, so this treats either of the following as "this is a new
// account, please accept the terms":
//   - a 422 response whose `errors` object mentions terms_accepted or
//     privacy_accepted
//   - a 428 (Precondition Required) response
// Please confirm this against the real backend behavior.
export function isTermsRequiredError(err) {
  if (!err) return false;
  if (err.status === 428) return true;
  if (err.errors && (err.errors.terms_accepted || err.errors.privacy_accepted)) return true;
  return false;
}
