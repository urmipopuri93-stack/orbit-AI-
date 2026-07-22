import './QuestionPage.css'

function QuestionPage() {
  return (
    <div className="question-popup">
      <div className="header">
        <div className="brand">
          <div className="logo-dot" />
          <span className="brand-name">OrbitAI</span>
        </div>
        <button className="close-btn" aria-label="Close">✕</button>
      </div>

      <div className="progress-label">Lesson progress</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '82%' }} />
      </div>

      <div className="concept-tag">useEffect dependency arrays</div>

      <div className="question-text">What happens when you omit the dependency array?</div>

      <textarea className="answer-box" placeholder="Your answer..." />

      <button className="submit-btn">Submit Answer</button>
    </div>
  )
}

export default QuestionPage