import { useEffect, useState } from 'react'
import IntroPage from './pages/IntroPage'
import SessionSetupPage from './pages/SessionSetupPage'
import QuestionPage from './pages/QuestionPage'
import CorrectPage from './pages/CorrectPage'
import IncorrectPage from './pages/IncorrectPage'
import './App.css'

type Screen =
  | 'intro'
  | 'setup'
  | 'question'
  | 'correct'
  | 'incorrect'

type FocusLevel =
  | 'Basic'
  | 'Intermediate'
  | 'Mastery'

interface Segment {
  text: string
  start: number
  duration: number
}

export interface AnswerResult {
  is_correct: boolean
  user_answer: string
  correct_answer: string
  explanation: string
  evidence?: string
  timestamp?: number
}

interface TranscriptResponse {
  segments?: Segment[]
}

interface ShowQuestionMessage {
  type: 'SHOW_QUESTION'
  videoId: string
  currentTime: number
}

function formatTimestamp(seconds?: number): string {
  if (
    seconds === undefined ||
    Number.isNaN(seconds)
  ) {
    return '0:00'
  }

  const safeSeconds = Math.max(
    0,
    Math.floor(seconds),
  )

  const minutes = Math.floor(
    safeSeconds / 60,
  )

  const remainingSeconds =
    safeSeconds % 60

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`
}

function App() {
  const [screen, setScreen] =
    useState<Screen>('intro')

  const [focusLevel, setFocusLevel] =
    useState<FocusLevel>('Intermediate')

  const [segments, setSegments] =
    useState<Segment[]>([])

  const [currentTime, setCurrentTime] =
    useState(0)

  const [videoId, setVideoId] =
    useState<string | null>(null)

  const [questionNumber, setQuestionNumber] =
    useState(1)

  const [answerResult, setAnswerResult] =
    useState<AnswerResult | null>(null)

  const totalQuestions = 6

  /*
   * Listen for the YouTube content script.
   * When the video reaches a checkpoint,
   * the content script sends SHOW_QUESTION.
   */
  useEffect(() => {
    const listener = (
      message: ShowQuestionMessage,
    ) => {
      if (
        message.type !== 'SHOW_QUESTION'
      ) {
        return
      }

      setVideoId(message.videoId)
      setCurrentTime(
        message.currentTime,
      )
      setAnswerResult(null)
      setScreen('question')
    }

    chrome.runtime.onMessage.addListener(
      listener,
    )

    return () => {
      chrome.runtime.onMessage.removeListener(
        listener,
      )
    }
  }, [])

  /*
   * Called by SessionSetupPage when the
   * Start Learning button is clicked.
   */
  async function handleStartSession(
    selectedFocusLevel: FocusLevel,
    selectedVideoId: string,
  ) {
    try {
      console.log(
        'Starting learning session',
        {
          selectedFocusLevel,
          selectedVideoId,
        },
      )

      setFocusLevel(
        selectedFocusLevel,
      )

      setVideoId(selectedVideoId)
      setSegments([])
      setCurrentTime(0)
      setQuestionNumber(1)
      setAnswerResult(null)

      const response = await fetch(
        'http://127.0.0.1:8001/video/transcript',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            video_id: selectedVideoId,
          }),
        },
      )

      if (!response.ok) {
        const errorText =
          await response.text()

        throw new Error(
          `Transcript request failed: ${response.status} ${errorText}`,
        )
      }

      const data =
        (await response.json()) as TranscriptResponse

      console.log(
        'Transcript response:',
        data,
      )

      if (
        !Array.isArray(data.segments) ||
        data.segments.length === 0
      ) {
        throw new Error(
          'No transcript segments were returned for this video.',
        )
      }

      setSegments(data.segments)

      /*
       * Select a transcript timestamp that
       * definitely contains some video content.
       */
      const startingIndex = Math.min(
        5,
        data.segments.length - 1,
      )

      setCurrentTime(
        data.segments[
          startingIndex
        ].start,
      )

      /*
       * For your current flow, immediately
       * display the first question.
       */
      setScreen('question')
    } catch (error) {
      console.error(
        'Could not start learning session:',
        error,
      )

      alert(
        error instanceof Error
          ? error.message
          : 'Could not start learning.',
      )
    }
  }

  /*
   * Called by QuestionPage after the user
   * submits an answer.
   */
  function handleAnswered(
    result: AnswerResult,
  ) {
    console.log(
      'Answer result:',
      result,
    )

    setAnswerResult(result)

    if (result.is_correct) {
      setScreen('correct')
    } else {
      setScreen('incorrect')
    }
  }

  /*
   * Continue to another generated question.
   */
  function handleContinueLearning() {
    setQuestionNumber(
      (previousQuestion) =>
        Math.min(
          previousQuestion + 1,
          totalQuestions,
        ),
    )

    setAnswerResult(null)

    /*
     * Move the transcript window forward
     * before generating the next question.
     */
    setCurrentTime(
      (previousTime) =>
        previousTime + 120,
    )

    setScreen('question')
  }

  /*
   * Close the current session and return
   * to the intro page.
   */
  function handleCloseSession() {
    setScreen('intro')
    setSegments([])
    setCurrentTime(0)
    setVideoId(null)
    setQuestionNumber(1)
    setAnswerResult(null)
  }

  /*
   * Send a message to the YouTube content
   * script so it can seek to the relevant
   * timestamp.
   */
  async function handleJumpToSection() {
    if (!answerResult?.timestamp) {
      console.warn(
        'No timestamp was returned.',
      )
      return
    }

    try {
      const tabs =
        await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })

      const activeTabId =
        tabs[0]?.id

      if (!activeTabId) {
        throw new Error(
          'Could not find the YouTube tab.',
        )
      }

      await chrome.tabs.sendMessage(
        activeTabId,
        {
          type: 'JUMP_TO_TIMESTAMP',
          timestamp:
            answerResult.timestamp,
        },
      )
    } catch (error) {
      console.error(
        'Could not jump to timestamp:',
        error,
      )
    }
  }

  function handleFollowUp() {
    console.log(
      'Follow up with Orby clicked',
    )

    /*
     * You can later replace this with an
     * Orby chat page.
     */
    alert(
      'Orby follow-up is coming soon!',
    )
  }

  const progressPercent = Math.min(
    100,
    Math.round(
      (questionNumber /
        totalQuestions) *
        100,
    ),
  )

  const feedbackTimestamp =
    formatTimestamp(
      answerResult?.timestamp,
    )

  return (
    <>
      {screen === 'intro' && (
        <IntroPage
          onStart={() =>
            setScreen('setup')
          }
        />
      )}

      {screen === 'setup' && (
        <SessionSetupPage
          onStart={
            handleStartSession
          }
        />
      )}

      {screen === 'question' && (
        <QuestionPage
          segments={segments}
          currentTime={currentTime}
          focusLevel={focusLevel}
          questionNumber={
            questionNumber
          }
          totalQuestions={
            totalQuestions
          }
          progressPercent={
            progressPercent
          }
          videoId={videoId}
          onAnswered={
            handleAnswered
          }
          onClose={
            handleCloseSession
          }
        />
      )}

      {screen === 'correct' &&
        answerResult && (
          <CorrectPage
            explanation={
              answerResult.explanation
            }
            evidence={
              answerResult.evidence ??
              answerResult.correct_answer
            }
            evidenceTimestamp={
              feedbackTimestamp
            }
            onContinue={
              handleContinueLearning
            }
            onFollowUp={
              handleFollowUp
            }
            onClose={
              handleCloseSession
            }
          />
        )}

      {screen === 'incorrect' &&
        answerResult && (
          <IncorrectPage
            userAnswer={
              answerResult.user_answer
            }
            correctAnswer={
              answerResult.correct_answer
            }
            explanation={
              answerResult.explanation
            }
            relatedTimestamp={
              feedbackTimestamp
            }
            onContinue={
              handleContinueLearning
            }
            onLearnMore={
              handleFollowUp
            }
            onJumpToSection={
              handleJumpToSection
            }
            onClose={
              handleCloseSession
            }
          />
        )}
    </>
  )
}

export default App
