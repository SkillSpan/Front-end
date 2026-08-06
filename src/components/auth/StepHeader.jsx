export default function StepHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-9">
      <p className="text-sm font-extrabold tracking-wide text-sky">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy-950">{title}</h1>
      {subtitle && <p className="mt-2 text-gray-500">{subtitle}</p>}
    </div>
  )
}
