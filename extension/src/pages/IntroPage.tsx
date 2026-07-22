import './IntroPage.css'

function IntroPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="popup">
      <div className="stars">
        <span className="star" style={{ top: '8%', left: '55%' }} />
        <span className="star" style={{ top: '15%', left: '25%' }} />
        <span className="star" style={{ top: '22%', left: '80%' }} />
        <span className="star" style={{ top: '28%', left: '10%' }} />
        <span className="star" style={{ top: '34%', left: '65%' }} />
        <span className="star" style={{ top: '40%', left: '88%' }} />
        <span className="star" style={{ top: '45%', left: '5%' }} />
        <span className="star" style={{ top: '50%', left: '92%' }} />
        <span className="star" style={{ top: '58%', left: '20%' }} />
        <span className="star" style={{ top: '63%', left: '75%' }} />
        <span className="star" style={{ top: '68%', left: '40%' }} />
        <span className="star" style={{ top: '73%', left: '15%' }} />
        <span className="star" style={{ top: '78%', left: '85%' }} />
        <span className="star" style={{ top: '82%', left: '55%' }} />
        <span className="star" style={{ top: '87%', left: '30%' }} />
      </div>

      <div className="header">
        <div className="brand">
          <div className="logo-dot" />
          <span className="brand-name">OrbitAI</span>
        </div>
        <button className="close-btn" aria-label="Close">
          ✕
        </button>
      </div>

      <div className="planet-wrap">
        <div className="planet-ring">
          <div className="planet-core" />
        </div>
      </div>

      <button className="start-btn" onClick={onStart}>Launch Orbit</button>
    </div>
  )
}

export default IntroPage