# أسئلة لمطوّر الـ Backend: SkillSpan API

مرحبا 👋 هاي الأسئلة طلعت من مراجعة كل طلبات الواجهة (src/api.js وملفات الـ lib) ومقارنتها مع الـ Swagger الحالي (`/docs?api-docs.json`) ومع كود الـ backend نفسه. السيرفر المرفوع على `https://skillspan.alwaysdata.net` بيطابق فرع **`feature/authentication`** (3c89bd7)، مش `main`. كل الأسطر المذكورة تحت من هاد الفرع.
كل سؤال فيه الـ endpoint والحقل المقصود. الأسئلة مرتبة حسب الأهمية.

---

## أولاً: أخطاء أو نواقص بتأثر على الشاشات مباشرة

**1. `POST /api/v1/evidence`، الحقل `source`**
بـ `EvidenceController::store` القيمة مثبّتة `'source' => 'certificate'` لكل دليل، والحقل مش موجود بقواعد الـ validation. الواجهة هلّق بتبعت `source` بإحدى القيم `certificate | experience | project` حسب نوع الدليل اللي اختاره المتعلّم.
هل ممكن تضيفوا `source` للـ validation (`sometimes|in:certificate,experience,project`) وتخزّنوه بدل القيمة الثابتة؟ وكمان شرط فحص التكرار (`->where('source', 'certificate')`) لازم يستخدم نفس القيمة.

**2. `GET /api/v1/evidence`، صفوف `source = assessment_test`**
بعد الـ baseline assessment الـ backend بيكتب دليل `verified` لكل مهارة (`source = assessment_test`)، وهاد الـ endpoint بيرجّعهم مع أدلة المتعلّم. الواجهة حالياً بتفلترهم من عندها حتى ما تبيّن شاشات الأدلة إلا بعد ما المتعلّم يضيف شهادة أو خبرة أو مشروع.
هل ممكن تضيفوا فلتر `?source=` (أو `?origin=learner`)، أو تستثنوا صفوف الـ assessment افتراضياً من هاد الـ endpoint؟ وشو القائمة الكاملة لقيم `source` اللي ممكن تطلع؟

**3. `GET /api/v1/recommendations`، علاقة `organization:id,title`**
بـ `RecommendationController.php:65` في eager-load لـ `'organization:id,title'`، بس جدول `organizations` ما فيه عمود `title` (فيه `name` بس، وباقي الكود بيستخدم `organization:id,name`). حسب الكود، أول ما يصير عند المتعلّم توصية مرتبطة بمشروع الطلب رح يرجّع خطأ SQL (500)، وهاد بيوقّف كرت "Recommended Projects" بالـ Dashboard وزر Save/Hide بصفحة المشروع.
ممكن تتأكدوا وتغيّروها لـ `organization:id,name`؟ (ما قدرنا نجرّبها live لأنه ما في حساب تجريبي.)

**4. CORS: المتغيّر `CORS_ALLOWED_ORIGINS`**
جرّبنا الـ preflight: `https://skillspan-iota.vercel.app` و `http://localhost:5173` و `http://localhost:3000` مسموحين. أي origin تاني (روابط الـ Preview تبع Vercel، `http://127.0.0.1:5173`، `http://localhost:5174` اللي بيستخدمه Vite لما يكون 5173 مشغول) بيرجعله 204 **بدون** `Access-Control-Allow-Origin`، فالمتصفح بيمنعه.
ممكن تضيفوا `http://localhost:5174` و `http://127.0.0.1:5173` للقائمة، وتعبّوا `allowed_origins_patterns` بـ pattern لروابط الـ preview، مثلاً `#^https://skillspan-[a-z0-9-]+\.vercel\.app$#`؟

**5. ملف الدليل المرفوع: `reference` بـ `skill_evidence`**
لما المتعلّم يرفع ملف، العمود `reference` بيتخزّن فيه مسار داخلي (`evidence/xxx.pdf`) على الـ disk الخاص، وما في رابط عام. فالواجهة ما بتقدر تعرض أو تنزّل الملف، لا للمتعلّم ولا للمراجِع.
هل في نية تعملوا endpoint مثل `GET /api/v1/evidence/{id}/file` (مع نفس شروط الملكية/الأدمن)، أو ترجّعوا رابط موقّع (`file_url`) مع السجل؟

**6. `POST /api/v1/auth/register/organization`، الملف `additional_document`**
فورم تسجيل الشركة فيه خانة "مستند إضافي" اختيارية، والواجهة بتبعته باسم `additional_document`، بس الحقل مش موجود بـ `RegisterOrganizationRequest` ولا بـ `AuthService`، فالملف بيروح وبينرمى.
بدكم تخزّنوه (وشو اسم الحقل الصحيح؟)، ولا نشيل الخانة من الواجهة؟
(ملاحظة: الواجهة صارت تبعت كل الحقول بالأسماء الرسمية `organization_company_size` و `organization_website` و `organization_country` … و `organization_contact_phone`، فالـ aliases القديمة بـ `prepareForValidation` ما عاد إلها داعي من جهتنا.)

**7. "تواصل مع الطالب" من شاشة Talent Discovery**
زر Contact حالياً بيستدعي `POST /api/v1/mentor/connections`، وهاد محمي بـ middleware `mentor`، فالشركة (`company_admin`) دايماً بتاخد 403.
شو الـ endpoint الصحيح اللي لازم تستخدمه الشركة لطلب تواصل مع طالب؟ وإذا مش موجود، هل مخطط إله؟

## ثانياً: حقول ناقصة بتحتاجها شاشات لسا فيها بيانات ثابتة

**8. `GET /api/v1/projects`، حقول المطابقة والأهلية بالقائمة**
شاشة المشاريع بتعرض نسبة التطابق، "Recommended"، سبب التوصية، الأهلية، والمهارات المطابقة/الناقصة. `ProjectResource` بالقائمة ما فيه أي منها (`eligibility` و `capacity_state` بيطلعوا `null` بالقائمة وبيتعبّوا بس بالـ show). حالياً عم نربط كل مشروع مع `GET /recommendations` حسب `project_id`.
هل هاد هو الأسلوب المعتمد؟ ولا ممكن ترجّعوا `match_score` و `eligibility` (ولو مختصرة) مع كل مشروع بالقائمة؟ وشو بالنسبة لـ `estimated_hours` و `tags` اللي بالتصميم؟

**9. أنواع المشاريع: الحقل `type`**
الـ backend بيرجّع بس `simulation | company_sponsored`، بس التصميم والفلاتر بالواجهة فيها `Practice Task, Assessment, Capstone`. هل في أنواع جاية، ولا نعتمد النوعين بس؟

**10. شكل عناصر `skill_results` (بالتوصيات وبـ `POST /projects/{id}/match`) وعناصر `eligibility.skill_failures`**
Laravel بيتحقق بس من `status` و `is_critical_entry`، وباقي المفاتيح جايين من خدمة الـ Data Science زي ما هنّي. ممكن توثّقوا شكل العنصر الكامل (اسم المهارة، المستوى الحالي، المطلوب…) بالـ Swagger حتى نعرض المهارات المطابقة/الناقصة بدون تخمين؟

**11. `GET /api/v1/intelligence/latest`، الـ milestones بالـ roadmap**
شاشة Career Journey فيها قسم "Milestones"، والـ roadmap بيرجّع `phases` و `actions` بس. هل في حقل `milestones` مخطط، ولا نبني المراحل من `actions` حسب `phase`؟ وكمان بنأكّد إنه `phase` قيمة نصية (`foundations | core_skills | applied_practice | career_readiness`) وما في رقم ترتيب للمرحلة؟

**12. `GET /api/v1/career-roles`، التصنيف والطلب بالسوق والأدوار المحفوظة**
شاشة Career Roles بتجمّع الأدوار حسب category وبتعرض "الطلب بالسوق" وبتسمح بحفظ الأدوار. `CareerRole` ما فيه `category`، وما في endpoint لبيانات الطلب ولا لحفظ الأدوار.
هل في نية تضيفوا `category` (أو نستخدم الـ specializations المرتبطة؟) وendpoint للحفظ (`POST/DELETE /career-roles/{id}/save`)؟ ولا نشيل هالأجزاء من الشاشة؟

**13. `GET /api/v1/mentor/students` و `/mentor/students/{student}`**
لوحة المرشد بتعرض جاهزية الطالب ومهاراته ومشاريعه وآخر نشاط إله. الـ endpoint بيرجّع بس `id, name, email, university_name, specialization, career_status, visibility, completeness_percent` (والـ summary بيزيد interests و availability). هل رح تضيفوا `readiness` و `skills` و `projects`؟ ومن وين بيجيب المرشد قائمة المشاريع اللي بيقدر يربط فيها الطالب (`project_id` بـ `POST /mentor/connections`)؟

**14. `GET /api/v1/talent`، نسبة التطابق**
بـ `TalentDiscoveryService.php:64` مكتوب إنه الترتيب حسب `match` انشال لأنه ما في match score مخزّن. هل هاد نهائي؟ (رح نعتمد `readiness` للترتيب ونشيل "% match" من الواجهة.)

**15. `GET/PUT /api/v1/notifications/preferences`، قيم `category`**
بدنا نعمل شاشة إعدادات للإشعارات. شو القائمة الكاملة لقيم `category` المدعومة، وهل كل category بتدعم القناتين `in_app` و `email`؟

## ثالثاً: التوثيق والسلوك العام

**16. مسارات موجودة بالسيرفر وناقصة بالـ Swagger**
`POST/GET/DELETE /api/v1/profile/avatar`، `POST/GET /api/v1/support/requests`، `GET /api/v1/support/requests/{id}`، `POST /api/v1/support/requests/{id}/messages`، `GET /api/v1/support/avatar/{user}`، `POST /api/v1/auth/check-email`. كلهن بيردّوا (401 بدون توكن) بس مش موثّقين. ممكن تضيفوهم للـ Swagger مع شكل الطلب والرد؟

**17. اختلافات بين الـ Swagger والرد الحقيقي**
- `GET /recommendations`: الـ Swagger بيقول `reasons` مصفوفة نصوص، والكود بيرجّع نص واحد مفصول بأسطر (`implode("\n", …)`). أيهم المعتمد؟
- `POST /projects/{id}/match`: الـ Swagger بيقول `explanation` نص، والكود بيرجّع مصفوفة.
- `POST /assistant/ask` (201): الرد فيه `handoff_available` و `answer_status` و `grounded`، وما في منهم شي بالـ Swagger.

**18. `per_page` ما بينحسب**
`GET /conversations` و `/conversations/{id}/messages` و `/notifications` و `/mentor/connections` بيتجاهلوا `per_page` (ثابت 20/50/20/20 بالإعدادات). هل ممكن تقبلوه (بحد أعلى)، أو توثّقوا إنه ثابت؟ وبالنسبة لـ `/conversations/{id}/messages`: الرسائل بترجع من الأحدث للأقدم (`latest('created_at')`)، فهل هاد مقصود؟

**19. `GET /api/v1/reference/countries/{country}/universities`**
الـ `{country}` لازم يكون رقم الـ id (`JO` بيرجّع 404). هل ممكن يقبل كمان `iso2`؟ (مش ضروري، بس بيسهّل الحالة اللي بتفشل فيها قائمة الدول.)

**20. الفرع المرفوع**
السيرفر الحالي بيطابق `feature/authentication` (فيه `DELETE /conversations/{id}` و `/profile/avatar`) و`main` لسا وراه. هل `feature/authentication` هو المرجع لحد التسليم يوم الاثنين، ورح ينعمل merge لـ `main`؟ حتى نقارن دايماً مع الفرع الصح.

**21. رموز الخطأ للمتعلّم الجديد**
`GET /readiness/latest` بيرجّع 404 `READINESS_NOT_FOUND` و `GET /intelligence/latest` بيرجّع 404 `DECISION_NOT_FOUND` للمتعلّم اللي لسا ما عمل تقييم. الواجهة رح تعتبرهم "ما في بيانات بعد" مش خطأ. بنأكّد إنه هالرموز ثابتة وما رح تتغيّر؟

---
شكراً كتير 🙏 أي جواب، ولو مختصر، بيساعدنا نشيل آخر البيانات الثابتة من الواجهة قبل التسليم.
