import { useState, useEffect } from "react";
import "./QuestionPage.css";

interface Segment {
  text: string;
  start: number;
  duration: number;
}

interface QuestionPageProps {
  segments?: Segment[];
  currentTime?: number;
  focusLevel?: string;
  questionNumber?: number;
  totalQuestions?: number;
  progressPercent?: number;
  videoId?: string | null;
  onAnswered?: (result: any) => void;
  onClose?: () => void;
}

export default function QuestionPage({
  segments = [],
  currentTime = 0,
  focusLevel = "basic",
  questionNumber = 1,
  totalQuestions = 1,
  progressPercent = 0,
  onAnswered = () => {},
  onClose = () => {},
}: QuestionPageProps) {
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetch("http://localhost:8000/video/generate-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segments,
        current_time: currentTime,
        focus_level: focusLevel,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const result = data.result;
        setTopic(result.topic);
        setQuestion(result.question);
        setLoading(false);
        setTimeLeft(600); // 10 min countdown, adjust as needed
      });
  }, [segments, currentTime, focusLevel]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    fetch("http://localhost:8000/video/check-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segments,
        current_time: currentTime,
        question,
        user_answer: answer,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmitting(false);
        onAnswered(data.result);
      });
  };

  return (
    <div className="orbit-card">
      <div className="orbit-header">
        <div className="orbit-brand">
          <span className="orbit-star-icon">⭐</span>
          <span>OrbitAI</span>
        </div>
        <button className="orbit-close" onClick={onClose}>✕</button>
      </div>
      <hr className="orbit-divider" />

      <div className="orbit-progress-label">Lesson progress</div>
      <div className="orbit-progress-bar">
        <div
          className="orbit-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <span className="orbit-progress-percent">{progressPercent}%</span>
      </div>

      <div className="orbit-concept-row">
        <span>Concept:</span>
        <span className="orbit-concept-tag">{loading ? "..." : topic}</span>
      </div>
      <hr className="orbit-divider" />

      <div className="orbit-meta-row">
        <span>Question {questionNumber} of {totalQuestions}</span>
        <span className="orbit-timer">🕐 {formatTime(timeLeft)}</span>
      </div>

      <div className="orbit-question-box">
        <p className="orbit-question-text">
          {loading ? "Loading question..." : question}
        </p>
        <textarea
          className="orbit-answer-input"
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <div className="orbit-help-row">
          <span className="orbit-star-icon-small">⭐</span>
          <span>Click to ask Orby for help!</span>
        </div>
      </div>

      <button
        className="orbit-submit-btn"
        onClick={handleSubmit}
        disabled={loading || submitting || !answer.trim()}
      >
        {submitting ? "Checking..." : "Submit Answer"}
      </button>
      <p className="orbit-footer-note">Video will resume after you answer the question</p>
    </div>
  );
}