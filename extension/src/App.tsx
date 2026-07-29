import { useState, useEffect } from 'react'
import IntroPage from './pages/IntroPage'
import SessionSetupPage from './pages/SessionSetupPage'
import QuestionPage from './pages/QuestionPage'
import './App.css'

type Screen = 'intro' | 'setup' | 'question'

interface Segment {
  text: string
  start: number
  duration: number
}

function App() {
  const [screen, setScreen] = useState<Screen>('intro')
  const [focusLevel, setFocusLevel] = useState('basic')
  const [segments, setSegments] = useState<Segment[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions] = useState(6)

  // Listen for messages from the content script (video pause + timestamp)
  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === 'SHOW_QUESTION') {
        setVideoId(message.videoId)
        setCurrentTime(message.currentTime)
        setScreen('question')
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

const handleStartSession = async (selectedFocusLevel: string, videoId: string) => {
  setFocusLevel(selectedFocusLevel)
  setVideoId(videoId)

  const res = await fetch('http://localhost:8000/video/transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_id: videoId }),
  })
  const data = await res.json()
  setSegments(data.segments)

  setScreen('question')
}

  const handleAnswered = (result: any) => {
    console.log('Answer result:', result)
    setQuestionNumber((n) => n + 1)
    // TODO: show feedback page here, then resume video via content script
  }

  return (
    <>
      {screen === 'intro' && <IntroPage onStart={() => setScreen('setup')} />}
      {screen === 'setup' && (
        <SessionSetupPage onStart={handleStartSession} />
      )}
      {screen === 'question' && (
        <QuestionPage
          segments={segments}
          currentTime={currentTime}
          focusLevel={focusLevel}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          progressPercent={Math.round((questionNumber / totalQuestions) * 100)}
          videoId={videoId}
          onAnswered={handleAnswered}
          onClose={() => setScreen('intro')}
        />
      )}
    </>
  )
}

export default App