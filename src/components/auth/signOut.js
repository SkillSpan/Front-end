// Shared "log out and land on the public landing page" behaviour.
//
// Clearing the session re-renders the protected page without a user a moment
// before the navigation to '/' is applied, and the route guards (RequireAuth /
// RequireCompanyAuth in App.jsx) would send the user to the login page in that
// gap. The flag below tells the guards that the logout was deliberate, so they
// hand over to the landing page instead. HomeRoute clears it once the landing
// page is showing.
let signedOutOnPurpose = false;

export function signOutToLanding(navigate, logout) {
  signedOutOnPurpose = true;
  logout();
  navigate('/', { replace: true, state: { loggedOut: true } });
}

export const isDeliberateSignOut = () => signedOutOnPurpose;

export function clearDeliberateSignOut() {
  signedOutOnPurpose = false;
}