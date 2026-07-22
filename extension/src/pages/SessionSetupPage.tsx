import { useState } from 'react'
import './SessionSetupPage.css'

function SessionSetupPage({ onStart }: { onStart: () => void }) {
  const [focus, setFocus] = useState<'Basic' | 'Intermediate' | 'Mastery'>('Intermediate')
  const [frequency, setFrequency] = useState(70)

  return (
    
    <div className="setup-popup">
        <div className="stars">
  <span className="star" style={{ top: '8%', left: '10%' }} />
  <span className="star" style={{ top: '15%', left: '85%' }} />
  <span className="star" style={{ top: '25%', left: '60%' }} />
  <span className="star" style={{ top: '35%', left: '5%' }} />
  <span className="star" style={{ top: '45%', left: '92%' }} />
  <span className="star" style={{ top: '58%', left: '15%' }} />
  <span className="star" style={{ top: '68%', left: '80%' }} />
  <span className="star" style={{ top: '78%', left: '50%' }} />
  <span className="star" style={{ top: '88%', left: '25%' }} />
</div>

      <div className="header">
        <div className="brand">
          <div className="logo-dot" />
          <span className="brand-name">OrbitAI</span>
        </div>
        <button className="close-btn" aria-label="Close">✕</button>
      </div>

      <div className="section-label">Current Video</div>
      <div className="video-card">
        <div className="video-thumb" />
        <div className="video-info">
          <div className="video-title">React useEffect Hook Tutorial</div>
          <div className="video-meta">DevSimplified</div>
          <div className="video-meta">15:38</div>
        </div>
      </div>

      <div className="section-label">Focus Level</div>
      <div className="focus-options">
        {(['Basic', 'Intermediate', 'Mastery'] as const).map((level) => (
          <button
            key={level}
            className={`focus-btn ${focus === level ? 'active' : ''}`}
            onClick={() => setFocus(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="freq-row">
        <span className="section-label">Question Frequency</span>
        <span className="freq-value">Frequent</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={frequency}
        onChange={(e) => setFrequency(Number(e.target.value))}
        className="freq-slider"
      />
      <div className="freq-hint">Orby will ask you a question every 2-3 minutes</div>

      <button className="start-btn" onClick={onStart}>Start Learning</button>
    </div>
  )
}

export default SessionSetupPage