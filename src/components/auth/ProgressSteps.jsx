export default function ProgressSteps({ step, total = 3 }) {
  const percent = Math.round((step / total) * 100)

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between text-sm font-bold text-amber">
        <span>
          STEP {step} OF {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="mt-3 flex gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-amber' : 'bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  )
}
