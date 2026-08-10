const BASE_URL = 'https://back-end-zdip.onrender.com/api/auth'

// دالة عامة لمعالجة الطلبات والاستجابات
async function handleResponse(response) {
  const data = await response.json()
  if (!response.ok) {
    // إما أن تكون الأخطاء مصفوفة قادمة من Validation السيرفر أو رسالة مفردة
    const error = data.errors || data.message || 'حدث خطأ في الاتصال بالخادم'
    throw error
  }
  return data
}

// 1. تسجيل فرد
export async function registerIndividual(formData) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  return handleResponse(response)
}

// 2. تسجيل شركة/مؤسسة
export async function registerOrganization(formData) {
  const response = await fetch(`${BASE_URL}/register/organization`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  return handleResponse(response)
}

// 3. تسجيل الدخول
export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  return handleResponse(response)
}

// 4. التحقق من الإيميل (OTP Verification)
export async function verifyEmail(payload) {
  // payload: { email, otp } أو { email, code } بحسب ما يطلبه الـ Backend
  const response = await fetch(`${BASE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(response)
}

// 5. إعادة إرسال OTP
export async function resendOtp(email) {
  const response = await fetch(`${BASE_URL}/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  return handleResponse(response)
}