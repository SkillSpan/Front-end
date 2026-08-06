export default function OptionCard({ icon, title, subtitle, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-5 rounded-3xl px-6 py-6 text-left transition-colors ${
        selected ? 'bg-navy-800 text-white' : 'bg-ice text-navy-950'
      }`}
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white">
        {icon}
      </span>
      <span>
        <span className="block text-xl font-extrabold">{title}</span>
        <span className={`block font-bold ${selected ? 'text-white/90' : 'text-navy-950/80'}`}>{subtitle}</span>
      </span>
    </button>
  )
}
