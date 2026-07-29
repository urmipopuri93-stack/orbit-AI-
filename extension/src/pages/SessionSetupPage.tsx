import { useEffect, useState } from 'react'
import './SessionSetupPage.css'

type FocusLevel = 'Basic' | 'Intermediate' | 'Mastery'

type VideoInfo = {
  video_id: string
  title: string
  channel_name: string
  duration: string
  thumbnail_url: string
}

function SessionSetupPage({
  onStart,
}: {
  onStart: (focusLevel: FocusLevel, videoId: string) => void
}) {
  const [focus, setFocus] = useState<FocusLevel>('Intermediate')
  const [frequency, setFrequency] = useState(70)

  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [videoError, setVideoError] = useState('')

  useEffect(() => {
    async function loadCurrentVideo() {
      try {
        setIsLoading(true)
        setVideoError('')

        const tabs = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        })

        const currentTab = tabs[0]

        const currentUrl =
          currentTab?.url ??
          currentTab?.pendingUrl

        if (!currentUrl) {
          throw new Error(
            'Could not detect the current browser tab.',
          )
        }

        const url = new URL(currentUrl)

        const isRegularYouTubeVideo =
          url.hostname.includes('youtube.com') &&
          url.pathname === '/watch' &&
          url.searchParams.has('v')

        const isYouTubeShort =
          url.hostname.includes('youtube.com') &&
          url.pathname.startsWith('/shorts/')

        const isYouTubeShortLink =
          url.hostname === 'youtu.be'

        if (
          !isRegularYouTubeVideo &&
          !isYouTubeShort &&
          !isYouTubeShortLink
        ) {
          throw new Error(
            'Open a YouTube video before launching Orbit AI.',
          )
        }

        const endpoint = new URL(
          'http://127.0.0.1:8000/api/video-info',
        )

        endpoint.searchParams.set(
          'video_url',
          currentUrl,
        )

        const response = await fetch(
          endpoint.toString(),
        )

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => null)

          throw new Error(
            errorData?.detail ??
              'Could not retrieve the video information.',
          )
        }

        const data: VideoInfo =
          await response.json()

        setVideoInfo(data)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading the video.'

        setVideoError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadCurrentVideo()
  }, [])

  function getFrequencyLabel() {
    if (frequency < 34) {
      return 'Occasional'
    }

    if (frequency < 67) {
      return 'Moderate'
    }

    return 'Frequent'
  }

  function getFrequencyHint() {
    if (frequency < 34) {
      return 'Orby will ask you a question every 7-10 minutes'
    }

    if (frequency < 67) {
      return 'Orby will ask you a question every 4-6 minutes'
    }

    return 'Orby will ask you a question every 2-3 minutes'
  }

  function handleClose() {
    window.close()
  }

  return (
    <div className="setup-popup">
      <div className="stars">
        <span
          className="star"
          style={{ top: '8%', left: '10%' }}
        />
        <span
          className="star"
          style={{ top: '15%', left: '85%' }}
        />
        <span
          className="star"
          style={{ top: '25%', left: '60%' }}
        />
        <span
          className="star"
          style={{ top: '35%', left: '5%' }}
        />
        <span
          className="star"
          style={{ top: '45%', left: '92%' }}
        />
        <span
          className="star"
          style={{ top: '58%', left: '15%' }}
        />
        <span
          className="star"
          style={{ top: '68%', left: '80%' }}
        />
        <span
          className="star"
          style={{ top: '78%', left: '50%' }}
        />
        <span
          className="star"
          style={{ top: '88%', left: '25%' }}
        />
      </div>

      <div className="header">
        <div className="brand">
          <div className="logo-dot" />
          <span className="brand-name">
            OrbitAI
          </span>
        </div>

        <button
          className="close-btn"
          aria-label="Close"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>

      <div className="section-label">
        Current Video
      </div>

      <div className="video-card">
        {isLoading && (
          <div className="video-loading">
            Loading video information...
          </div>
        )}

        {!isLoading && videoError && (
          <div className="video-error">
            {videoError}
          </div>
        )}

        {!isLoading && videoInfo && (
          <>
            <img
              className="video-thumb"
              src={videoInfo.thumbnail_url}
              alt={videoInfo.title}
            />

            <div className="video-info">
              <div className="video-title">
                {videoInfo.title}
              </div>

              <div className="video-meta">
                {videoInfo.channel_name}
              </div>

              <div className="video-meta">
                {videoInfo.duration}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="section-label">
        Focus Level
      </div>

      <div className="focus-options">
        {(
          [
            'Basic',
            'Intermediate',
            'Mastery',
          ] as const
        ).map((level) => (
          <button
            key={level}
            className={`focus-btn ${
              focus === level ? 'active' : ''
            }`}
            onClick={() => setFocus(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <div className="freq-row">
        <span className="section-label">
          Question Frequency
        </span>

        <span className="freq-value">
          {getFrequencyLabel()}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={frequency}
        onChange={(event) =>
          setFrequency(
            Number(event.target.value),
          )
        }
        className="freq-slider"
      />

      <div className="freq-hint">
        {getFrequencyHint()}
      </div>

      <button
  className="start-btn"
  onClick={() => onStart(focus, videoInfo!.video_id)}
  disabled={isLoading || !videoInfo}
>
  Start Learning
</button>
    </div>
  )
}

export default SessionSetupPage