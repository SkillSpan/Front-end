import { ArrowRightIcon } from './icons'

export default function StepNavButtons({ onBack, onNext, nextLabel = 'Next', nextDisabled = false, showBack = true }) {
  return (
    <div className={`mt-10 flex gap-4 ${showBack ? '' : 'justify-end'}`}>
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-2xl bg-navy-800 py-4 text-lg font-extrabold text-white transition-opacity hover:opacity-90"
        >
          Back
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-navy-950 py-4 text-lg font-extrabold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {nextLabel}
        {nextLabel === 'Next' && <ArrowRightIcon className="h-4 w-4" />}
      </button>
    </div>
  )
}
