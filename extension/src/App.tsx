import { useState } from 'react'
import IntroPage from './pages/IntroPage'
import SessionSetupPage from './pages/SessionSetupPage'
import QuestionPage from './pages/QuestionPage'
import './App.css'

type Screen = 'intro' | 'setup' | 'question'

function App() {
  const [screen, setScreen] = useState<Screen>('intro')

  return (
    <>
      {screen === 'intro' && <IntroPage onStart={() => setScreen('setup')} />}
      {screen === 'setup' && <SessionSetupPage onStart={() => setScreen('question')} />}
      {screen === 'question' && <QuestionPage />}
    </>
  )
}

export default App