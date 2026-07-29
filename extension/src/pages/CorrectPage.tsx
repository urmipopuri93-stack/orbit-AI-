import './FeedbackPage.css'

interface CorrectPageProps {
  explanation: string
  evidence: string
  evidenceTimestamp?: string
  onContinue: () => void
  onFollowUp: () => void
  onClose: () => void
}

function CorrectPage({
  explanation,
  evidence,
  evidenceTimestamp = '8:21',
  onContinue,
  onFollowUp,
  onClose,
}: CorrectPageProps) {
  return (
    <div className="feedback-popup">
      <div className="feedback-stars" />

      <header className="feedback-header">
        <div className="feedback-brand">
          <div className="feedback-logo">â­</div>
          <span>OrbitAI</span>
        </div>

        <button
          type="button"
          className="feedback-close"
          aria-label="Close"
          onClick={onClose}
        >
          âœ•
        </button>
      </header>

      <main className="feedback-content">
        <h1 className="feedback-title">
          Correct
        </h1>

        <div className="mascot-circle correct-circle">
          <div className="mascot-star correct-star">
            <span className="mascot-eye left" />
            <span className="mascot-eye right" />
            <span className="mascot-smile" />
          </div>

          <div className="mascot-sparkle">
            âœ¦
          </div>
        </div>

        <div className="feedback-message correct-message">
          {explanation}
        </div>

        <div className="evidence-card">
          <p className="evidence-label">
            Evidence from video ({evidenceTimestamp})
          </p>

          <blockquote className="evidence-quote">
            â€œ{evidence}â€
          </blockquote>
        </div>

        <div className="feedback-actions correct-actions">
          <button
            type="button"
            className="primary-feedback-btn"
            onClick={onContinue}
          >
            Got it
          </button>

          <button
            type="button"
            className="secondary-feedback-btn"
            onClick={onFollowUp}
          >
            Follow up with Orby
            <span aria-hidden="true"> â­</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default CorrectPage
