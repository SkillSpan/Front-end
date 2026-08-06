export default function FormInput({ label, type = 'text', value, onChange, name, autoComplete, error }) {
  return (
    <div className="w-full text-left">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        autoComplete={autoComplete}
        aria-label={label}
        className={`w-full rounded-2xl border-2 bg-ice px-6 py-4 font-semibold text-navy-800/70 placeholder:text-navy-800/50 focus:outline-none focus:ring-2 focus:ring-cyan ${
          error ? 'border-red-500' : 'border-sky'
        }`}
      />
      {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}