import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteScrollReset() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    // Query/hash updates preserve reading position; changing pages starts at the top.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.querySelectorAll('.form-right, .form-right-verify, .profile-setup-form-panel, .app-content, .cl-form, .cfp-form, .company-step1-form-sec, .company-step2-form-sec, .company-step3-form-sec, .company-step4-form-sec, .company-step5-form-sec').forEach((element) => { element.scrollTop = 0; });
  }, [pathname]);
  return null;
}
