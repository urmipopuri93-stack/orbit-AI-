interface OpenQuestionPopupMessage {
  type: 'OPEN_QUESTION_POPUP'
}

chrome.runtime.onMessage.addListener(
  (
    message: OpenQuestionPopupMessage,
    _sender,
    sendResponse,
  ) => {
    if (
      message.type !==
      'OPEN_QUESTION_POPUP'
    ) {
      return
    }

    chrome.action
      .openPopup()
      .then(() => {
        sendResponse({
          success: true,
        })
      })
      .catch((error) => {
        console.error(
          'OrbitAI could not open the popup:',
          error,
        )

        sendResponse({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Could not open popup.',
        })
      })

    return true
  },
)

console.log(
  'OrbitAI background worker loaded',
)