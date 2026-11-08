# تعديلات صفحات الشركة فقط (7 نوفمبر)

مبني على ملفك الأصلي نفسه، وما في أي تغيير على صفحات الطالب.

1. صفحة الإعدادات للشركة (/company/settings) بدل "قريباً"
   - الحساب، الأمان (تغيير كلمة المرور + تسجيل الخروج من كل الأجهزة)، الإشعارات، اللغة، منطقة الخطر
   - عربي وإنجليزي، وموبايل
   - مربوط بالباك: POST /api/v1/auth/logout-all و GET/PUT /api/v1/notifications/preferences
   - بدون endpoint لسا (مكتوبين TODO أول الملف): PATCH /api/v1/auth/me ، POST /api/v1/auth/change-password ، POST /api/v1/organizations/{id}/deactivate
2. هامش كرت "Choose a project" بصفحة Applications صار نفس هامش الصفوف
3. القائمة عند الاسم فوق (الملف التعريفي / الإعدادات / تسجيل الخروج)
4. شلت زر "العربية" من الشريط العلوي (اللغة بتتغير من صفحة الإعدادات)
5. شلت زر Replace عن المستند الموثّق (Approved) بالملف التعريفي، لأن الهدف التحقق مرة وحدة. DocumentsCard.jsx
6. الإعدادات صارت تبويبات: كل قسم بيفتح لحاله بدل صفحة طويلة بسكرول، والقسم المفتوح محفوظ بالرابط (?tab=security). CompanySettings.jsx + settings.css + الاختبار
7. رجعت صورة الشعار الناقصة public/image/skillspan-mark.png (كانت مكسورة بهيدر الشركة)

الملفات الجديدة: src/components/company/settings/* ، src/components/common/UserMenu.jsx/.css
الملفات المعدلة: App.jsx (سطرين لربط الإعدادات فقط) ، CompanyTopbar.jsx ، CompanyLayout.jsx ، companyWorkspace.css ، projects.css ، ApplicationsPage.jsx
11. شريط السكرول للصفحة صار ظاهر بصفحات الشركة (App.css كان مخفيه لكل الموقع). التعديل بـ companyWorkspace.css وما بأثر على صفحات الطالب
