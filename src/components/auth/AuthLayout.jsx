import AuthSidebar from './AuthSidebar'

export default function AuthLayout({ children, contentClassName = '' }) {
  return (
    <div className="flex min-h-screen bg-white">
      <AuthSidebar />
      <main className={`flex flex-1 justify-center px-6 py-14 sm:px-12 ${contentClassName}`}>
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  )
}
