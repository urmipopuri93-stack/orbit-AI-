import './FeedbackPage.css'

interface IncorrectPageProps {
  userAnswer: string
  correctAnswer: string
  explanation: string
  relatedTimestamp?: string
  onContinue: () => void
  onLearnMore: () => void
  onJumpToSection: () => void
  onClose: () => void
}

function IncorrectPage({
  userAnswer,
  correctAnswer,
  explanation,
  relatedTimestamp = '8:30',
  onContinue,
  onLearnMore,
  onJumpToSection,
  onClose,
}: IncorrectPageProps) {
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
          Incorrect
        </h1>

        <div className="mascot-circle incorrect-circle">
          <div className="mascot-star incorrect-star">
            <span className="mascot-eye left" />
            <span className="mascot-eye right" />
            <span className="mascot-frown" />
          </div>

          <div className="mascot-sparkle">
            âœ¦
          </div>
        </div>

        <section className="answer-section">
          <p className="answer-label">
            Your answer
          </p>

          <div className="answer-box user-answer-box">
            {userAnswer}
          </div>
        </section>

        <section className="answer-section">
          <p className="answer-label">
            Correct Answer
          </p>

          <div className="answer-box correct-answer-box">
            {correctAnswer}
          </div>
        </section>

        <section className="answer-section">
          <p className="answer-label">
            Explanation
          </p>

          <div className="answer-box explanation-box">
            {explanation}
          </div>
        </section>

        <div className="related-row">
          <span>
            Related section in video:
          </span>

          <button
            type="button"
            className="jump-btn"
            onClick={onJumpToSection}
          >
            Jump to {relatedTimestamp}
          </button>
        </div>

        <div className="feedback-actions incorrect-actions">
          <button
            type="button"
            className="primary-feedback-btn"
            onClick={onContinue}
          >
            Start Learning
          </button>

          <button
            type="button"
            className="secondary-feedback-btn"
            onClick={onLearnMore}
          >
            Learn with Orby
            <span aria-hidden="true"> â­</span>
          </button>
        </div>
      </main>
    </div>
  )
}

export default IncorrectPage
