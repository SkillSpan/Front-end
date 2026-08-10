import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/authApi'

export default function LoginPage() {
  const navigate = useNavigate()
  
  // 1. الحالات الخاصة بالبيانات والأخطاء
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [clientErrors, setClientErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  // 2. دالة الفحص والتحقق (Validation)
  const validateForm = () => {
    const errors = {}
    if (!formData.email) {
      errors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
    }

    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن لا تقل عن 6 خانات'
    }

    setClientErrors(errors)
    return Object.keys(errors).length === 0
  }

  // تحديث القيم ومسح أخطاء الحقل المحددة أثناء الكتابة
  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
    if (clientErrors[field]) {
      setClientErrors({ ...clientErrors, [field]: '' })
    }
  }

  // 3. دالة معالجة الإرسال
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    if (!validateForm()) return

    setLoading(true)
    try {
      const data = await loginUser(formData)
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      navigate('/dashboard')
    } catch (err) {
      if (typeof err === 'string') {
        setServerError(err)
      } else if (Array.isArray(err)) {
        setServerError(err.join(' - '))
      } else {
        setServerError('فشل تسجيل الدخول، يرجى التأكد من بياناتك.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-navy-900 border border-navy-800 p-8 rounded-2xl shadow-xl">
        
        {/* العناوين والتنسيقات */}
        <h2 className="text-2xl font-bold text-white mb-2 text-center">تسجيل الدخول</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">أهلاً بك مجدداً في منصة SkillSpan</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. عرض أخطاء السيرفر */}
          {serverError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
              {serverError}
            </div>
          )}

          {/* 2. حقل البريد الإلكتروني */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full p-3 bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
              placeholder="name@example.com"
            />
            {clientErrors.email && (
              <span className="text-red-400 text-xs mt-1 block">{clientErrors.email}</span>
            )}
          </div>

          {/* 3. حقل كلمة المرور */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">كلمة المرور</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full p-3 bg-navy-950 border border-navy-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition"
              placeholder="••••••••"
            />
            {clientErrors.password && (
              <span className="text-red-400 text-xs mt-1 block">{clientErrors.password}</span>
            )}
          </div>

          {/* 4. زر التسجيل */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-blue-600/20 mt-2"
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

      </div>
    </div>
  )
}