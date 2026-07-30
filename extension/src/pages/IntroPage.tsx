import './IntroPage.css'
import heroImage from '../assets/hero.png'

interface IntroPageProps {
  onStart: () => void
}

function IntroPage({ onStart }: IntroPageProps) {
  function handleClose() {
    window.close()
  }

  return (
    <div className="intro-popup">
      <div className="intro-background-stars">
        <span className="tiny-star star-1" />
        <span className="tiny-star star-2" />
        <span className="tiny-star star-3" />
        <span className="tiny-star star-4" />
        <span className="tiny-star star-5" />
        <span className="tiny-star star-6" />
        <span className="tiny-star star-7" />
        <span className="tiny-star star-8" />
        <span className="tiny-star star-9" />
        <span className="tiny-star star-10" />
        <span className="tiny-star star-11" />
        <span className="tiny-star star-12" />
      </div>

      <header className="intro-header">
        <div className="intro-brand">
          <div className="intro-logo-circle">
            <img
              src={heroImage}
              alt="OrbitAI mascot"
              className="intro-logo-image"
            />
          </div>

          <span className="intro-brand-name">
            OrbitAI
          </span>
        </div>

        <button
          type="button"
          className="intro-close-button"
          aria-label="Close OrbitAI"
          onClick={handleClose}
        >
          ✕
        </button>
      </header>

      <div className="intro-divider" />

      <main className="intro-main">
        <div className="constellation constellation-top-left">
          <span className="constellation-dot dot-a" />
          <span className="constellation-dot dot-b" />
          <span className="constellation-dot dot-c" />
          <span className="constellation-line line-a" />
          <span className="constellation-line line-b" />
        </div>

        <div className="constellation constellation-top-right">
          <span className="constellation-dot dot-a" />
          <span className="constellation-dot dot-b" />
          <span className="constellation-dot dot-c" />
          <span className="constellation-dot dot-d" />
          <span className="constellation-line line-a" />
          <span className="constellation-line line-b" />
          <span className="constellation-line line-c" />
        </div>

        <div className="constellation constellation-left">
          <span className="constellation-dot dot-a" />
          <span className="constellation-dot dot-b" />
          <span className="constellation-dot dot-c" />
          <span className="constellation-line line-a" />
          <span className="constellation-line line-b" />
        </div>

        <div className="constellation constellation-right">
          <span className="constellation-dot dot-a" />
          <span className="constellation-dot dot-b" />
          <span className="constellation-dot dot-c" />
          <span className="constellation-line line-a" />
          <span className="constellation-line line-b" />
        </div>

        <div className="constellation constellation-bottom-left">
          <span className="constellation-dot dot-a" />
          <span className="constellation-dot dot-b" />
          <span className="constellation-dot dot-c" />
          <span className="constellation-dot dot-d" />
          <span className="constellation-line line-a" />
          <span className="constellation-line line-b" />
          <span className="constellation-line line-c" />
        </div>

        <div className="constellation constellation-bottom-right">
          <span className="constellation-dot dot-a" />
          <span className="constellation-dot dot-b" />
          <span className="constellation-dot dot-c" />
          <span className="constellation-dot dot-d" />
          <span className="constellation-line line-a" />
          <span className="constellation-line line-b" />
          <span className="constellation-line line-c" />
        </div>

        <div className="intro-hero-wrapper">
          <div className="intro-hero-glow">
            <img
              src={heroImage}
              alt="OrbitAI star mascot"
              className="intro-hero-image"
            />
          </div>
        </div>

        <button
          type="button"
          className="launch-orbit-button"
          onClick={onStart}
        >
          Launch Orbit
        </button>
      </main>
    </div>
  )
}

export default IntroPage