import heroIllustration from '../assets/hero-illustration.png'

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      {/* soft ambient page glow, echoes the radial navy background from the design */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-page-gradient"
      />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 pb-24 pt-8 lg:grid-cols-2 lg:px-10 lg:pt-16">
        {/* Left column — copy */}
        <div className="max-w-xl">
          <span className="inline-block rounded-full bg-amber/15 px-4 py-1.5 text-xs font-bold tracking-wide text-amber">
            EMPOWERING FUTURES
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] sm:text-5xl">
            Bridge Your Skills
            <br />
            to <span className="text-cyan">Real Careers</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-ice/80">
            SkillSpan helps students and graduates their potential, build real-world
            projects, and get discovered by companies looking for top talent
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#get-started"
              className="flex items-center gap-2 rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition-transform hover:scale-[1.03]"
            >
              Start Your Journey
              <span aria-hidden>→</span>
            </a>
            <a
              href="#platform"
              className="flex items-center gap-3 rounded-full border border-violet/60 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet/10"
            >
              Explore Platform
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-violet/20 text-[10px]"
              >
                ▶
              </span>
            </a>
          </div>
        </div>

        {/* Right column — illustration */}
        <div className="relative mx-auto flex w-full max-w-lg items-center justify-center">
          <div
            aria-hidden
            className="absolute h-[85%] w-[85%] rounded-full bg-cyan/20 blur-3xl"
          />
          <img
            src={heroIllustration}
            alt="Illustration of a student on a laptop surrounded by icons for assessing skills, learning, building projects and portfolio, and getting discovered"
            className="relative w-full"
          />
        </div>
      </div>
    </section>
  )
}
