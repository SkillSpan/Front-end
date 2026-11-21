// The real signup / login routes in App.jsx, used by the landing page's single
// Register button (Nav + Hero). Same targets the old separate buttons used.
export const REGISTER_ROUTES = {
  studentUrl: '/register/account',        // RegisterWizard   (<Route path="/register/*">)
  companyUrl: '/company/register/account', // CompanyWizard    (<Route path="/company/register/*">)
  loginUrl: '/login',                      // Login            (student)
  companyLoginUrl: '/company/login',       // CompanyLogin
}
