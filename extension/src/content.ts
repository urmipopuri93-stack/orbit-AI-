type FrequencyLabel =
  | 'Occasional'
  | 'Moderate'
  | 'Frequent'

interface StartSessionMessage {
  type: 'START_SESSION'
  frequency: FrequencyLabel
  videoId: string
}

interface ResumeVideoMessage {
  type: 'RESUME_VIDEO'
}

interface StopSessionMessage {
  type: 'STOP_SESSION'
}

interface JumpToTimestampMessage {
  type: 'JUMP_TO_TIMESTAMP'
  timestamp: number
}

type OrbitMessage =
  | StartSessionMessage
  | ResumeVideoMessage
  | StopSessionMessage
  | JumpToTimestampMessage

/*
 * Testing intervals:
 * Occasional = 30 seconds
 * Moderate = 20 seconds
 * Frequent = 10 seconds
 */
const QUESTION_INTERVALS: Record<
  FrequencyLabel,
  number
> = {
  Occasional: 30,
  Moderate: 20,
  Frequent: 10,
}

let sessionActive = false
let questionActive = false
let nextQuestionTime = 0

let selectedFrequency: FrequencyLabel =
  'Moderate'

let activeVideoId = ''

function getVideoElement():
  | HTMLVideoElement
  | null {
  return document.querySelector<HTMLVideoElement>(
    'video.html5-main-video',
  )
}

function getCurrentVideoId(): string {
  const url = new URL(window.location.href)

  if (url.pathname.startsWith('/shorts/')) {
    return (
      url.pathname
        .split('/shorts/')[1]
        ?.split('/')[0] ?? ''
    )
  }

  return url.searchParams.get('v') ?? ''
}

function removePauseOverlay(): void {
  document
    .getElementById('orbit-ai-pause-overlay')
    ?.remove()
}

function showPauseOverlay(): void {
  removePauseOverlay()

  const overlay = document.createElement('div')
  overlay.id = 'orbit-ai-pause-overlay'

  Object.assign(overlay.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: '2147483647',
    width: '290px',
    padding: '18px',
    borderRadius: '16px',
    background:
      'linear-gradient(145deg, #20276d, #111b4f)',
    color: '#ffffff',
    boxShadow:
      '0 14px 40px rgba(0, 0, 0, 0.45)',
    border:
      '1px solid rgba(255,255,255,0.35)',
    fontFamily:
      'Arial, Helvetica, sans-serif',
    textAlign: 'center',
  })

  const title = document.createElement('div')
  title.textContent = '⭐ OrbitAI Checkpoint'

  Object.assign(title.style, {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '8px',
  })

  const message = document.createElement('div')
  message.textContent =
    'Your video is paused. Open the OrbitAI extension to answer your question.'

  Object.assign(message.style, {
    fontSize: '14px',
    lineHeight: '1.45',
    opacity: '0.95',
  })

  overlay.append(title, message)
  document.body.appendChild(overlay)
}

function scheduleNextQuestion(
  video: HTMLVideoElement,
): void {
  const interval =
    QUESTION_INTERVALS[selectedFrequency]

  nextQuestionTime =
    video.currentTime + interval

  console.log(
    '[OrbitAI] Next question scheduled',
    {
      currentTime: video.currentTime,
      interval,
      nextQuestionTime,
      selectedFrequency,
    },
  )
}

async function triggerQuestion(
  video: HTMLVideoElement,
): Promise<void> {
  if (questionActive || !sessionActive) {
    return
  }

  questionActive = true

  /*
   * Pause first and keep it paused.
   */
  video.pause()

  const currentTime = video.currentTime

  const videoId =
    getCurrentVideoId() || activeVideoId

  console.log(
    '[OrbitAI] Pausing for question',
    {
      currentTime,
      videoId,
    },
  )

  await chrome.storage.local.set({
    orbitPendingQuestion: {
      videoId,
      currentTime,
      frequency: selectedFrequency,
      createdAt: Date.now(),
    },
  })

  showPauseOverlay()

  /*
   * Try to open the popup automatically.
   * Edge may reject this because it was not caused
   * directly by a user click. Do not resume the video
   * when that happens.
   */
  try {
    await chrome.runtime.sendMessage({
      type: 'OPEN_QUESTION_POPUP',
    })
  } catch (error) {
    console.warn(
      '[OrbitAI] Automatic popup was blocked. The video remains paused.',
      error,
    )
  }
}

function monitorVideo(): void {
  if (!sessionActive || questionActive) {
    return
  }

  const video = getVideoElement()

  if (!video) {
    return
  }

  if (
    video.ended ||
    video.paused ||
    video.seeking
  ) {
    return
  }

  if (video.currentTime >= nextQuestionTime) {
    void triggerQuestion(video)
  }
}

function startSession(
  message: StartSessionMessage,
): void {
  const video = getVideoElement()

  if (!video) {
    throw new Error(
      'YouTube video player was not found.',
    )
  }

  selectedFrequency =
    message.frequency

  activeVideoId =
    message.videoId ||
    getCurrentVideoId()

  sessionActive = true
  questionActive = false

  removePauseOverlay()
  scheduleNextQuestion(video)

  console.log(
    '[OrbitAI] Session started',
    {
      selectedFrequency,
      activeVideoId,
      currentTime: video.currentTime,
      nextQuestionTime,
    },
  )
}

async function resumeVideo(): Promise<void> {
  const video = getVideoElement()

  questionActive = false
  removePauseOverlay()

  await chrome.storage.local.remove(
    'orbitPendingQuestion',
  )

  if (!video) {
    return
  }

  scheduleNextQuestion(video)

  try {
    await video.play()
  } catch (error) {
    console.error(
      '[OrbitAI] Could not resume video',
      error,
    )
  }
}

function stopSession(): void {
  sessionActive = false
  questionActive = false
  activeVideoId = ''
  nextQuestionTime = 0

  removePauseOverlay()

  void chrome.storage.local.remove([
    'orbitPendingQuestion',
    'orbitSession',
    'orbitQuestionNumber',
  ])

  console.log(
    '[OrbitAI] Session stopped',
  )
}

async function jumpToTimestamp(
  timestamp: number,
): Promise<void> {
  const video = getVideoElement()

  if (!video) {
    return
  }

  video.currentTime = Math.max(
    0,
    timestamp,
  )

  removePauseOverlay()
  questionActive = false

  try {
    await video.play()
  } catch (error) {
    console.error(
      '[OrbitAI] Could not play video',
      error,
    )
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: OrbitMessage,
    _sender,
    sendResponse,
  ) => {
    try {
      if (message.type === 'START_SESSION') {
        startSession(message)

        sendResponse({
          success: true,
        })

        return
      }

      if (message.type === 'RESUME_VIDEO') {
        void resumeVideo()

        sendResponse({
          success: true,
        })

        return
      }

      if (message.type === 'STOP_SESSION') {
        stopSession()

        sendResponse({
          success: true,
        })

        return
      }

      if (
        message.type ===
        'JUMP_TO_TIMESTAMP'
      ) {
        void jumpToTimestamp(
          message.timestamp,
        )

        sendResponse({
          success: true,
        })
      }
    } catch (error) {
      console.error(
        '[OrbitAI] Message error',
        error,
      )

      sendResponse({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown OrbitAI error.',
      })
    }

    return true
  },
)

window.setInterval(
  monitorVideo,
  500,
)

console.log(
  '[OrbitAI] Content script loaded',
)