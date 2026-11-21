// Texts (EN / AR) and the navigation helper shared by RegisterChooser and RegisterButton.

export const COPY = {
  en: {
    title: 'Join SkillSpan',
    student: {
      title: "I'm a student",
      desc: 'No experience yet? Start here and build it step by step.',
      bullets: ['Assess your skills', 'Get matched with real projects'],
      cta: 'Continue as student',
    },
    company: {
      title: "I'm a company",
      desc: 'Post projects, review verified talent, and track every application.',
      bullets: ['Post projects in minutes', 'Shortlist from real evidence'],
      cta: 'Continue as company',
    },
    login: 'Already have an account?',
    loginLink: 'Log in',
    loginStudent: 'Log in as student',
    loginCompany: 'as company',
    close: 'Close',
    register: 'Register',
    logIn: 'Log in',
    startJourney: 'Start your journey now',
  },
  ar: {
    title: 'انضم إلى SkillSpan',
    student: {
      title: 'أنا طالب',
      desc: 'ما عندك خبرة؟ ابدأ من هنا وابنِها خطوة بخطوة.',
      bullets: ['قيّم مهاراتك', 'انضم لمشاريع حقيقية'],
      cta: 'متابعة كطالب',
    },
    company: {
      title: 'أنا شركة',
      desc: 'انشر مشاريعك، راجع مواهب موثّقة، وتابع كل طلب.',
      bullets: ['انشر مشروعك بدقائق', 'اختر بناءً على أدلة حقيقية'],
      cta: 'متابعة كشركة',
    },
    login: 'عندك حساب؟',
    loginLink: 'سجّل دخول',
    loginStudent: 'دخول كطالب',
    loginCompany: 'كشركة',
    close: 'إغلاق',
    register: 'سجّل الآن',
    logIn: 'تسجيل الدخول',
    startJourney: 'ابدأ رحلتك الآن',
  },
}

export function goToRole(role, { studentUrl = '/register', companyUrl = '/register/company', onSelect, navigate } = {}) {
  if (typeof onSelect === 'function') return onSelect(role)
  const url = role === 'company' ? companyUrl : studentUrl
  if (typeof navigate === 'function') return navigate(url)
  window.location.assign(url)
}
