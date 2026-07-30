import {
  useEffect,
  useState,
} from 'react'

import IntroPage from './pages/IntroPage'

import SessionSetupPage, {
  type FocusLevel,
  type FrequencyLabel,
} from './pages/SessionSetupPage'

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

interface Segment {
  text: string
  start: number
  duration: number
}

interface TranscriptResponse {
  segments?: Segment[]
}

interface AnswerResult {
  is_correct: boolean
  user_answer: string
  correct_answer: string
  explanation: string
  evidence?: string
  timestamp?: number
}

interface PendingQuestion {
  videoId?: string
  currentTime?: number
  frequency?: FrequencyLabel
  createdAt?: number
}

interface StoredSession {
  focusLevel?: FocusLevel
  frequency?: FrequencyLabel
  videoId?: string
  segments?: Segment[]
}

interface ShowQuestionMessage {
  type: 'SHOW_QUESTION'
  videoId: string
  currentTime: number
}

function formatTimestamp(
  seconds?: number,
): string {
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
    useState<FocusLevel>(
      'Intermediate',
    )

  /*
   * The frequency value itself is not displayed in App,
   * but setFrequency is used while restoring and starting
   * sessions.
   */
  const [, setFrequency] =
    useState<FrequencyLabel>(
      'Moderate',
    )

  const [segments, setSegments] =
    useState<Segment[]>([])

  const [currentTime, setCurrentTime] =
    useState(0)

  const [videoId, setVideoId] =
    useState<string | null>(null)

  const [
    questionNumber,
    setQuestionNumber,
  ] = useState(1)

  const [
    answerResult,
    setAnswerResult,
  ] =
    useState<AnswerResult | null>(
      null,
    )

  const totalQuestions = 6

  /*
   * Restore the learning session and pending question
   * when the popup opens.
   */
  useEffect(() => {
    async function restoreSession() {
      try {
        const stored =
          await chrome.storage.local.get(
            [
              'orbitPendingQuestion',
              'orbitSession',
              'orbitQuestionNumber',
            ],
          )

        const pending =
          stored.orbitPendingQuestion as
            | PendingQuestion
            | undefined

        const session =
          stored.orbitSession as
            | StoredSession
            | undefined

        if (!session) {
          return
        }

        if (
          session.focusLevel
        ) {
          setFocusLevel(
            session.focusLevel,
          )
        }

        if (session.frequency) {
          setFrequency(
            session.frequency,
          )
        }

        if (session.videoId) {
          setVideoId(
            session.videoId,
          )
        }

        if (
          Array.isArray(
            session.segments,
          )
        ) {
          setSegments(
            session.segments,
          )
        }

        if (
          typeof stored.orbitQuestionNumber ===
          'number'
        ) {
          setQuestionNumber(
            stored.orbitQuestionNumber,
          )
        }

        if (pending) {
          setVideoId(
            pending.videoId ??
              session.videoId ??
              null,
          )

          setCurrentTime(
            typeof pending.currentTime ===
              'number'
              ? pending.currentTime
              : 0,
          )

          setAnswerResult(null)
          setScreen('question')
        }
      } catch (error) {
        console.error(
          'Could not restore OrbitAI session:',
          error,
        )
      }
    }

    void restoreSession()
  }, [])

  /*
   * Receive a question message while the popup
   * is already open.
   */
  useEffect(() => {
    const listener = (
      message: ShowQuestionMessage,
    ) => {
      if (
        message.type !==
        'SHOW_QUESTION'
      ) {
        return
      }

      setVideoId(
        message.videoId,
      )

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
   * Starts the learning session.
   */
  async function handleStartSession(
    selectedFocusLevel: FocusLevel,
    selectedVideoId: string,
    selectedFrequency: FrequencyLabel,
  ) {
    setFocusLevel(
      selectedFocusLevel,
    )

    setFrequency(
      selectedFrequency,
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
          video_id:
            selectedVideoId,
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

    if (
      !Array.isArray(
        data.segments,
      ) ||
      data.segments.length === 0
    ) {
      throw new Error(
        'No transcript segments were returned for this video.',
      )
    }

    setSegments(data.segments)

    await chrome.storage.local.set({
      orbitSession: {
        focusLevel:
          selectedFocusLevel,
        frequency:
          selectedFrequency,
        videoId:
          selectedVideoId,
        segments:
          data.segments,
      },
      orbitQuestionNumber: 1,
    })

    const tabs =
      await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

    const activeTabId =
      tabs[0]?.id

    if (!activeTabId) {
      throw new Error(
        'Could not find the active YouTube tab.',
      )
    }

    let contentResponse:
      | {
          success?: boolean
          error?: string
        }
      | undefined

    try {
      contentResponse =
        await chrome.tabs.sendMessage(
          activeTabId,
          {
            type: 'START_SESSION',
            frequency:
              selectedFrequency,
            videoId:
              selectedVideoId,
          },
        )
    } catch {
      throw new Error(
        'OrbitAI could not connect to the YouTube page. Refresh the YouTube page and try again.',
      )
    }

    if (!contentResponse?.success) {
      throw new Error(
        contentResponse?.error ??
          'Could not start the video timer.',
      )
    }

    window.close()
  }

  /*
   * Receives the checked answer from QuestionPage.
   */
  function handleAnswered(
    result: AnswerResult,
  ) {
    setAnswerResult(result)

    if (result.is_correct) {
      setScreen('correct')
    } else {
      setScreen('incorrect')
    }
  }

  /*
   * Resumes the YouTube video after the user
   * finishes reviewing feedback.
   */
  async function handleContinueLearning() {
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
          'Could not find the active YouTube tab.',
        )
      }

      const nextQuestionNumber =
        Math.min(
          questionNumber + 1,
          totalQuestions,
        )

      setQuestionNumber(
        nextQuestionNumber,
      )

      await chrome.storage.local.set({
        orbitQuestionNumber:
          nextQuestionNumber,
      })

      const responseFromContent =
        await chrome.tabs.sendMessage(
          activeTabId,
          {
            type: 'RESUME_VIDEO',
          },
        )

      if (
        !responseFromContent?.success
      ) {
        throw new Error(
          responseFromContent?.error ??
            'Could not resume the video.',
        )
      }

      setAnswerResult(null)
      window.close()
    } catch (error) {
      console.error(
        'Could not resume the video:',
        error,
      )

      window.alert(
        error instanceof Error
          ? error.message
          : 'Could not resume the video.',
      )
    }
  }

  /*
   * Ends the learning session and clears stored data.
   */
  async function handleCloseSession() {
    try {
      const tabs =
        await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })

      const activeTabId =
        tabs[0]?.id

      if (activeTabId) {
        await chrome.tabs
          .sendMessage(
            activeTabId,
            {
              type: 'STOP_SESSION',
            },
          )
          .catch(() => undefined)
      }

      await chrome.storage.local.remove(
        [
          'orbitSession',
          'orbitPendingQuestion',
          'orbitQuestionNumber',
        ],
      )
    } catch (error) {
      console.error(
        'Could not fully stop the session:',
        error,
      )
    }

    setScreen('intro')
    setSegments([])
    setCurrentTime(0)
    setVideoId(null)
    setQuestionNumber(1)
    setAnswerResult(null)
  }

  /*
   * Moves the YouTube video to the feedback timestamp.
   */
  async function handleJumpToSection() {
    const timestamp =
      answerResult?.timestamp

    if (
      timestamp === undefined
    ) {
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
          timestamp,
        },
      )

      window.close()
    } catch (error) {
      console.error(
        'Could not jump to the video section:',
        error,
      )
    }
  }

  function handleFollowUp() {
    window.alert(
      'Orby follow-up is coming soon!',
    )
  }

  const progressPercent =
    Math.min(
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
          onClose={() =>
            void handleCloseSession()
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
            onContinue={() =>
              void handleContinueLearning()
            }
            onFollowUp={
              handleFollowUp
            }
            onClose={() =>
              void handleCloseSession()
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
            onContinue={() =>
              void handleContinueLearning()
            }
            onLearnMore={
              handleFollowUp
            }
            onJumpToSection={() =>
              void handleJumpToSection()
            }
            onClose={() =>
              void handleCloseSession()
            }
          />
        )}
    </>
  )
}

export default App