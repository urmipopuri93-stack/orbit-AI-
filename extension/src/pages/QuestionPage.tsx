import { useEffect, useState } from 'react'
import './QuestionPage.css'

interface Segment {
  text: string
  start: number
  duration: number
}

interface GeneratedQuestion {
  topic?: string
  question?: string
  correct_answer?: string
  explanation?: string
  evidence?: string
  timestamp?: number
}

interface AnswerCheckResult {
  is_correct?: boolean
  correct?: boolean
  user_answer?: string
  correct_answer?: string
  explanation?: string
  evidence?: string
  timestamp?: number
}

export interface AnswerResult {
  is_correct: boolean
  user_answer: string
  correct_answer: string
  explanation: string
  evidence?: string
  timestamp?: number
}

interface QuestionPageProps {
  segments?: Segment[]
  currentTime?: number
  focusLevel?: string
  questionNumber?: number
  totalQuestions?: number
  progressPercent?: number
  videoId?: string | null
  onAnswered?: (result: AnswerResult) => void
  onClose?: () => void
}

export default function QuestionPage({
  segments = [],
  currentTime = 0,
  focusLevel = 'Basic',
  questionNumber = 1,
  totalQuestions = 1,
  progressPercent = 0,
  videoId = null,
  onAnswered = () => {},
  onClose = () => {},
}: QuestionPageProps) {
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [correctAnswer, setCorrectAnswer] =
    useState('')
  const [questionExplanation, setQuestionExplanation] =
    useState('')
  const [questionEvidence, setQuestionEvidence] =
    useState('')
  const [questionTimestamp, setQuestionTimestamp] =
    useState(currentTime)

  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600)

  useEffect(() => {
    const controller = new AbortController()

    async function generateQuestion() {
      try {
        setLoading(true)
        setError('')
        setAnswer('')

        const response = await fetch(
          'http://127.0.0.1:8001/video/generate-question',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              segments,
              current_time: currentTime,
              focus_level: focusLevel.toLowerCase(),
              video_id: videoId,
            }),
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          const errorText = await response.text()

          throw new Error(
            `Question generation failed: ${response.status} ${errorText}`,
          )
        }

        const data = await response.json()

        console.log(
          'Question generation response:',
          data,
        )

        const result: GeneratedQuestion =
          data.result ?? data

        if (!result.question) {
          throw new Error(
            'The backend did not return a question.',
          )
        }

        setTopic(result.topic ?? 'Video concept')
        setQuestion(result.question)
        setCorrectAnswer(
          result.correct_answer ?? '',
        )
        setQuestionExplanation(
          result.explanation ?? '',
        )
        setQuestionEvidence(
          result.evidence ?? '',
        )
        setQuestionTimestamp(
          result.timestamp ?? currentTime,
        )

        setTimeLeft(600)
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return
        }

        console.error(
          'Could not generate question:',
          requestError,
        )

        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Could not generate a question.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void generateQuestion()

    return () => {
      controller.abort()
    }
  }, [
    segments,
    currentTime,
    focusLevel,
    videoId,
  ])

  useEffect(() => {
    if (timeLeft <= 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((previousTime) =>
        Math.max(0, previousTime - 1),
      )
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [timeLeft])

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }

  async function handleSubmit() {
    const trimmedAnswer = answer.trim()

    if (
      !trimmedAnswer ||
      loading ||
      submitting
    ) {
      return
    }

    try {
      setSubmitting(true)
      setError('')

      const response = await fetch(
        'http://127.0.0.1:8001/video/check-answer',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            segments,
            current_time: currentTime,
            focus_level: focusLevel.toLowerCase(),
            video_id: videoId,
            question,
            user_answer: trimmedAnswer,
            correct_answer: correctAnswer,
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()

        throw new Error(
          `Answer check failed: ${response.status} ${errorText}`,
        )
      }

      const data = await response.json()

      console.log(
        'Answer check response:',
        data,
      )

      const result: AnswerCheckResult =
        data.result ?? data

      const isCorrect =
        result.is_correct ??
        result.correct ??
        false

      onAnswered({
        is_correct: Boolean(isCorrect),
        user_answer:
          result.user_answer ??
          trimmedAnswer,
        correct_answer:
          result.correct_answer ??
          correctAnswer,
        explanation:
          result.explanation ??
          questionExplanation ??
          'Review the related section of the video.',
        evidence:
          result.evidence ??
          questionEvidence,
        timestamp:
          result.timestamp ??
          questionTimestamp ??
          currentTime,
      })
    } catch (requestError) {
      console.error(
        'Could not check answer:',
        requestError,
      )

      /*
       * Fallback:
       * If the answer-check endpoint fails but the generated
       * question included a correct answer, compare locally.
       */
      if (correctAnswer) {
        const normalizedUserAnswer =
          trimmedAnswer.toLowerCase()

        const normalizedCorrectAnswer =
          correctAnswer
            .trim()
            .toLowerCase()

        const isCorrect =
          normalizedUserAnswer ===
          normalizedCorrectAnswer

        onAnswered({
          is_correct: isCorrect,
          user_answer: trimmedAnswer,
          correct_answer: correctAnswer,
          explanation:
            questionExplanation ||
            'Review the related section of the video.',
          evidence: questionEvidence,
          timestamp:
            questionTimestamp ??
            currentTime,
        })

        return
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not check your answer.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault()
      void handleSubmit()
    }
  }

  return (
    <div className="orbit-card">
      <div className="orbit-header">
        <div className="orbit-brand">
          <span className="orbit-star-icon">
            â­
          </span>

          <span>OrbitAI</span>
        </div>

        <button
          type="button"
          className="orbit-close"
          aria-label="Close"
          onClick={onClose}
        >
          âœ•
        </button>
      </div>

      <hr className="orbit-divider" />

      <div className="orbit-progress-label">
        Lesson progress
      </div>

      <div className="orbit-progress-bar">
        <div
          className="orbit-progress-fill"
          style={{
            width: `${Math.min(
              100,
              Math.max(0, progressPercent),
            )}%`,
          }}
        />

        <span className="orbit-progress-percent">
          {progressPercent}%
        </span>
      </div>

      <div className="orbit-concept-row">
        <span>Concept:</span>

        <span className="orbit-concept-tag">
          {loading ? '...' : topic}
        </span>
      </div>

      <hr className="orbit-divider" />

      <div className="orbit-meta-row">
        <span>
          Question {questionNumber} of{' '}
          {totalQuestions}
        </span>

        <span className="orbit-timer">
          ðŸ• {formatTime(timeLeft)}
        </span>
      </div>

      <div className="orbit-question-box">
        <p className="orbit-question-text">
          {loading
            ? 'Loading question...'
            : error && !question
              ? 'Question could not be loaded.'
              : question}
        </p>

        {error && (
          <p
            style={{
              margin: '8px 0',
              color: '#ffb8c0',
              fontSize: '13px',
            }}
          >
            {error}
          </p>
        )}

        <textarea
          className="orbit-answer-input"
          placeholder="Type your answer here..."
          value={answer}
          disabled={
            loading ||
            submitting ||
            !question
          }
          onChange={(event) =>
            setAnswer(event.target.value)
          }
          onKeyDown={handleKeyDown}
        />

        <div className="orbit-help-row">
          <span className="orbit-star-icon-small">
            â­
          </span>

          <span>
            Click to ask Orby for help!
          </span>
        </div>
      </div>

      <button
        type="button"
        className="orbit-submit-btn"
        onClick={() => void handleSubmit()}
        disabled={
          loading ||
          submitting ||
          !question ||
          !answer.trim()
        }
      >
        {submitting
          ? 'Checking...'
          : 'Submit Answer'}
      </button>

      <p className="orbit-footer-note">
        Video will resume after you answer the
        question
      </p>
    </div>
  )
}
