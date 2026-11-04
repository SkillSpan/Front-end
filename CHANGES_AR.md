# ملخص التعديلات — فرع `tab-fixes`

كل التعديلات commits محلية على فرع `tab-fixes` فوق `origin/main` (4e0ad48). **ما في أي push لأي remote.**
راجعيها قبل ما توصل main.

## التشغيل

```bash
npm install
npm run dev        # على http://localhost:5173
```

- الـ API الافتراضي صار `https://skillspan.alwaysdata.net`. لتغييره: انسخي `.env.example` إلى `.env` وعدّلي `VITE_API_BASE_URL`.
- **مهم (CORS):** الباك إند بيسمح فقط لـ `http://localhost:5173` و`http://localhost:3000` و`https://skillspan-iota.vercel.app`.
  لذلك منفذ Vite مثبّت على 5173 مع `strictPort`. إذا المنفذ مشغول بيطلع خطأ واضح، بدل ما ينتقل لـ 5174 ويرفض المتصفح كل الطلبات.
  نفس الشي على `127.0.0.1` وعلى روابط Vercel preview: كلها مرفوضة من الباك إند حالياً.
- الفحوصات: `npx vitest run` (153 اختبار ناجح، كانت 114) و`npm run build` ناجح.

## التعديلات حسب قائمة الاجتماع

| # | البند | شو تغيّر | الملفات الأساسية |
|---|---|---|---|
| — | شاشات الـ Evidence (Evidence Status وMy Record) | الباك إند بيكتب تلقائياً سجلات evidence من اختبار الـ baseline (`source=assessment_test`). صرنا نفلترها ونعرض بس إضافات المتعلّم. صفحة Evidence Status رجعت متل Vercel والفيجما: زر Add Evidence بالسايدبار بيفتح `/evidence` دايماً (حتى لو ما في ولا عنصر)، وفيها العنوان والتابات بأرقام حقيقية والبحث والحالة الفاضية "No evidence submitted yet." مع زر Add Evidence. "My Record" وكرت "Record Items" بالداشبورد ظاهرين دايماً. الكروت بتصميم الفيجما وبتظهر بس للعناصر الحقيقية من `GET /evidence`. | `evidenceApi.js`، `EvidencePages.jsx`، `EvidenceStatus.jsx`، `AppLayout.jsx`، `Dashboard.jsx` |
| — | Add Evidence فاضي ومربوط | الفورم بيبدأ فاضي، فيه اختيار النوع (Certificate / Experience / Project) واختيار المهارة من `GET /skills/taxonomy`، وبيبعث `source`. رابط الـ evidence صار يظهر لأنه بيرجع من الـ API بحقل `reference`. | `AddEvidence`، `evidenceApi.js` |
| 1 | Sidebar ثابت بـ Login/Register | السبب كان `overflow-x: hidden` على html/body، وهو بيعطّل `position: sticky`. صار `clip`، مع قواعد sticky للديسكتوب (≥901px) على login وregister وforgot وverify وreset. | `App.css`، `responsive.css` |
| 2 | حجم نص Create account | أحجام الفيجما: الـ eyebrow 24px، العنوان 32px، الوصف 18px. زر Next بالكحلي `#001856`. | `RegisterStep1.jsx`، CSS |
| 3 | OTP autofill | hook مشترك `useOtpInputs` لشاشات الكود الثلاث. فيه `autocomplete="one-time-code"` وكيبورد أرقام. اللصق أو الـ autofill بيعبّي الخانات الست وبيرسل لحاله، وفيه تنقّل بالأسهم وBackspace. | `components/common/useOtpInputs.js`، `OtpVerification`، `VerifyCode`، `CompanyForgotPassword` |
| 4 | Step 3 of 4: تكرار + أيقونات AI | شلنا الـ stepper المكرر من التوب بار ونجمة "AI". التوب بارات صار فيها لوجو SkillSpan بدل البادجات الملونة. | `SkillAssessmentIntro`، `AssessmentBrand.jsx` |
| 5 | Skill Matrix | شلنا الهيدر الداكن جوّا الصفحة وزر "Assistant" (أيقونة الـ AI) من التوب بار؛ المساعد لسا موجود بالسايدبار. المهارات على اليسار صارت حسب تخصص المستخدم: التخصص من البروفايل ← `reference/specializations` ← `career-roles?specialization_id=` ← المهارات المرتبطة بهالأدوار. المهارات اللي عند المستخدم بتضل ظاهرة. إذا ما في تخصص بتظهر كل القائمة. شلنا كمان console.log والرموز الداخلية (AC-09, BR-08…) من النص الظاهر. | `SkillMatrix.jsx`، `specializationFilter.js`، `api.js` (`getCareerRoles`) |
| 6 | الاسم الحقيقي بدل "Learner" | `GET /profile` ما بيرجع اسم، فصرنا ندمجه مع بيانات المستخدم المسجّل. أضفنا helper اسمه `displayName()`. | `utils/displayName.js`، `LearnerWorkspace`، `AppLayout`، `EvidencePages` |
| 7 | شاشة المشاريع: شيل الأيقونات | شلنا كل الإيموجي من الكروت والـ drawer وصفحة تفاصيل المشروع. | `ProjectsView.jsx`، `ProjectDetailsView.jsx` |
| 8 | Get started / Start your journey ← Register | زر Register بالهيدر (اسمه "Get Started" بالفيجما) وزر الهيرو صاروا يروحوا مباشرة على `/register/account` بدل نافذة الاختيار. تسجيل الشركات لسا موجود بقسم الـ CTA تحت. | `Nav.jsx`، `Hero.jsx` |
| — | نص الفوتر بالتسجيل | "Already have an account? Log in" بدل "Already Have a company account? log in". | `RegisterStep1.jsx` + تصحيح الأحرف بخطوات الشركة |

## إصلاحات طبقة الـ API

- رابط الباك إند الجديد: `api.js` (fallback) و`.env.example` و`MERGED_API_HANDOFF.md`.
- تسجيل الشركة: حقول المنظمة صارت بأسمائها حسب العقد (`organization_*`)، و`expected_graduation` رقم.
- `fetchCareerRoleSkills` كانت دايماً بترجع `[]`، لأن الرد شكله `data: {career_role, skills}`. انصلحت ومعها اختبارات.
- تحديث توثيق الـ evidence endpoints.
- **صفحة Career Roles كانت بتنهار (صفحة بيضا)** مع بيانات الباك إند الحقيقية، لأن الأدوار بلا `demand` ولا `skillRequirements`. صارت تتغذّى من `loadCareerRolesCatalog()`: مهارات كل دور مدموجة مع مستويات المتعلّم، ومعها الـ readiness المحسوب. بيانات سوق العمل بتظهر "No labor-market data for this role yet" لحد ما يصير في endpoint. (`CareerRolesView.jsx`)

## تقارير الـ API (داخل الريبو)

- [`docs/API_TABLE.md`](docs/API_TABLE.md): جدول لكل استدعاء API بالواجهة مقابل الـ Swagger وكود الباك إند، مع نتائج الفحص الحي وCORS، وحالة كل بيانات ثابتة ذكرها ملف الـ PDF.
- [`docs/BACKEND_QUESTIONS_AR.md`](docs/BACKEND_QUESTIONS_AR.md): أسئلة لمطوّر الباك إند (21 سؤال)، كل سؤال مع الـ endpoint والحقل.

## إصلاحات الانهيار (صفحة بيضا) وقراءة البيانات الحقيقية

هاي إصلاحات أمان بس، بدون تغيير بالتصميم:

- **تفاصيل المشروع بعد التقديم:** الـ API بيرجع حالة الطلب بأحرف صغيرة (`submitted`)، و`StatusPill` كان ينهار. صار في تحويل للحالة (`applicationStatusLabel`) وقيمة افتراضية. (`ProjectDetailsView.jsx`، `utils/projectMapping.js`)
- **تفاصيل المشروع:** المقاعد صارت تنقرأ من `capacity_state.seats_remaining`، والأهلية من `eligibility.{eligible, reasons[]}`. البانر ما عاد يقول "You are eligible" لما الـ API بيقول غير مؤهل.
- **قائمة المشاريع:** نسبة التطابق والأهلية صارت من `GET /recommendations` ومن مستويات الـ Skill Matrix، بدل 0% على كل الكروت. (`LearnerWorkspace.jsx`)
- **الداشبورد:** كان يظهر "Phase foundations of NaN"، لأن الـ phase بيجي كلمة (`foundations`/`core_skills`/…). صار يتحوّل لرقم من 1 لـ 4.
- **CompanyTalent:** كان يعرض `career_role` كـ object وينهار. صار يعرض `career_role.title`.
- **تحويل المساعد للدعم:** الفقاعات الفاضية كانت تسبب 422 من الباك إند. صارت تنفلتر قبل الإرسال.
- **متعلّم جديد:** كانت تطلع له رسالة "Some workspace data could not be loaded"، لأن الـ API بيرجع 404 `READINESS_NOT_FOUND` / `DECISION_NOT_FOUND`. هاد صار حالة فارغة مش خطأ. (`LearnerWorkspace.jsx`)
- **Skill Matrix:** الـ id للسطر الجديد صار ينقرأ من `data.id`، فما عاد يصير POST مكرر عند التعديل. ومقارنة `learner_id` صارت بالقيمة.
- **الداشبورد:** شلنا القيم الوهمية: "35%" و"Phase 2 of 4"، وأربع skill gaps وتلات مشاريع وهميين، ونسب التطابق المخترعة (`?? 85`)، و"4 weeks"، و"Score +8pts". هلأ بتظهر البيانات الحقيقية أو الحالة الفارغة. وزر الـ next action صار حسب `type` (assessment / practice / simulated_project / real_project / resource).
- **روابط الإشعارات:** روابط `/applications/…` و`/conversations/…` ما كانت تعمل شي. صارت تفتح Projects أو Mentor.
- **سحب الطلب:** سبب السحب صار ينبعث للباك إند (`withdrawApplication(id, reason)`).

## الجولة الأخيرة: انتهاء الجلسة (401) والبيانات الوهمية

**المشكلة اللي شافتها روان:** على `/skill-matrix` طلعت رسايل حمرا "Unauthenticated." و"Couldn't load skills from the server … showing a local fallback list".
**السبب:** الـ token القديم (من السيرفر القديم) محفوظ بكوكي `skillspan_token`، مش بالـ localStorage. والكوكيز على `localhost` مشتركة بين كل البورتات، فالنسخة الجديدة فتحت وهي فاكرة إنك مسجلة، والسيرفر الجديد رجّع 401 على كل طلب.

| البند | شو تغيّر | الملفات الأساسية |
|---|---|---|
| معالجة 401 عامة | أي 401 من طلب مسجّل (ما عدا login وregister وOTP وreset password) بيمسح الـ token والمستخدم، وبيوديكِ على شاشة "Your session has expired" (مصمّمة بالفيجما، node 235:115، والكومبوننت `SessionExpired` كان موجود بس مش موصول). زر "Log in again" بيفتح `/login?returnTo=…` (أو `/company/login` لصفحات الشركة) وفوق الفورم سطر واحد: "Your session has expired. Please log in again." لو فشلت كذا طلبات مع بعض بيصير redirect واحد بس، وما في loop إذا كنتِ أصلاً على صفحة login. والـ 401 المتأخر لـ token قديم ما بيطلّع جلسة جديدة. | `api.js` (`handleUnauthorized`، `isPublicAuthEndpoint`، `safeReturnTo`) |
| فحص الجلسة عند فتح التطبيق | إذا في token، التطبيق بيفحصه بـ `GET /profile` قبل ما يعرض أي صفحة داخلية. إذا رجع 401 بيمسحه وبيروح على شاشة انتهاء الجلسة ومنها على login. وبعد تسجيل الدخول بيرجعك على الصفحة اللي كنتِ فيها (`returnTo`). | `AuthContext.jsx`، `App.jsx`، `Login.jsx` |
| Skill Matrix بدون قائمة احتياطية | انحذفت قائمة المهارات المحلية (`taxonomy.js` صار فيه بس مستويات الإتقان). هلأ الصفحة بتعرض: تحميل، بعدين المهارات الحقيقية، أو حالة فاضية، أو رسالة خطأ لطيفة مع زر Retry. ما في أي بيانات وهمية. | `SkillMatrix.jsx`، `taxonomy.js` |
| رسايل التحذير بصفحات الـ Evidence | بدل "Couldn't load your evidence (Unauthenticated.). No preview records are shown…" صار سطر واحد "Couldn't load your evidence." مع Retry. وتحت قائمة المهارات بفورم Add Evidence صار "Couldn't load the skills list." مع Retry بدل نص الخطأ الخام. | `EvidenceShell.jsx`، `EvidencePages.jsx`، `AddEvidence.jsx` |
| كروت الـ Evidence | تاريخ المراجعة واسم المراجِع بيظهروا لما الـ API يرجعهم (متل الفيجما). وتواريخ Laravel (ISO) ما عادت تطلع "Invalid Date". | `EvidenceStatus.jsx`، `lib/evidenceMeta.js` |
| Career Journey | انشال التوست "Some workspace data could not be loaded…" من كل الشاشات. إذا ما في نتيجة readiness بتطلع رسالة قصيرة مع زر "Start Assessment". والعنوان بيعرض الـ career role، وإذا ما في بيعرض التخصص من البروفايل بدل "No career role selected". | `LearnerWorkspace.jsx`، `CareerJourneyView.jsx` |
| Profile | المستوى الدراسي والتخصص بينعرضوا مقروءين ("Fourth year" بدل `fourth_year`). الاسم من نفس مصدر التوب بار (`displayName`). وإذا ما في career role بيطلع "No career role yet". | `ProfileView.jsx`، `utils/formatEnum.js`، `i18n/messages.js` |
| Mentoring وTalent | انشالوا من سايدبار المتعلّم (قرار روان)، لأن السيرفر بيسمح فيهم بس للشركات والمنتورين والطالب كان ياخد 403. الملفات والـ routes ما انحذفت، وشاشة TalentDiscovery (شغل رنين) ما انلمست. وروابط الإشعارات `/conversations/…` و`/mentor/connections/…` ما عادت تفتح صفحة Mentor. | `AppLayout.jsx` |
| اختبارات | 14 اختبار جديد: معالجة الـ 401 (9)، صفحات الـ Evidence، Career Journey، و`formatEnum`. | `src/__tests__/sessionExpiry.test.js` وغيرها |

**زر Add Evidence اللي "اختفى":** بالنسخة الثانية كان زر Add Evidence بالسايدبار بيفتح الفورم مباشرة لما ما في عناصر، و"My Record" مخفي. رجّعناه متل Vercel: بيفتح صفحة Evidence Status، وفيها زرّين Add Evidence (فوق وبالحالة الفاضية).

## ملاحظات لسا مفتوحة

- **Tailwind CDN بـ `index.html`:** ما شلناه. شاشات المتعلّم (Projects وCareer وغيرها) بتعتمد على كلاسات Tailwind، وإعداد PostCSS بيولّد Tailwind لمجلد evidence فقط (`content` + `important: '.evidence-scope'`). لو شلنا الـ CDN بتخرب هالشاشات. الحل الصحيح لاحقاً: توسيع `content` بشكل مدروس، وبعدين نشيل الـ CDN.
- `TalentDiscoveryView` (شاشة فريق تاني) بيقرأ حقول مش موجودة بالـ API (`topSkills` و`hiddenFields` و`evalSummary`). ما لمسناه، وموثّق بتقرير الـ API.
- أخطاء lint قديمة (43 قبل التعديلات، وهلأ 41، معظمها set-state-in-effect ومتغيرات غير مستخدمة): ما زدناها، والتنظيف الكامل خطوة منفصلة.
- مقارنة كل الشاشات مع الفيجما: صفحة Evidence Status اتطابقت. باقي الإطارات اللي ما كانت ملتقطة (reset password وResume State بالـ assessment) لسا بتنفحص، وأي فرق بينضاف هون.

## توصيات (قرار الفريق، ما نفذناها)

- حذف ملفات `dashboard/*` الميتة (مش مستخدمة بأي route).
- توسيع إعداد Tailwind بشكل مدروس، وبعدها نشيل الـ CDN من `index.html`.

## أسئلة للباك إند (الأهم، والقائمة الكاملة بـ docs/BACKEND_QUESTIONS_AR.md)

1. `POST /api/v1/evidence`: الـ controller بيثبّت `source='certificate'`. الواجهة بتبعث `source` (certificate | experience | project) ولازم ينحفظ.
2. `GET /api/v1/evidence` بيخلط سجلات `assessment_test` مع إضافات المتعلّم. يا ريت فلتر (`?source=` أو استثناء افتراضي).
3. `GET /profile` ما بيرجع الاسم. يا ريت يرجع `name` أو `first_name`/`last_name`.
4. `profile.specialization` نص حر. الأفضل يرجع `specialization_id` كمان، عشان فلترة الـ Skill Matrix ما تعتمد على مطابقة الاسم.
5. `RecommendationController` بيعمل load لـ `organization:id,title`، بس العمود اسمه `name`. على الأغلب بيطلع 500 أو المنظمة بتطلع فاضية.
6. CORS: إضافة `localhost:5174` و`127.0.0.1:5173` وروابط Vercel preview (`CORS_ALLOWED_ORIGINS` حالياً قائمة ثابتة بدون patterns).
