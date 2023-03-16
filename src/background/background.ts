let timerActive = false
let remainingTime = 25 * 60
let initialTime = 25 * 60

const blockedUrls = [
  'https://www.facebook.com/*',
  'https://www.twitter.com/*',
  'https://www.instagram.com/*',
  'https://www.tiktok.com/*',
  'https://www.youtube.com/*',
]

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onMessage.addListener((message) => {
      if (message.type === 'getTimerState') {
        port.postMessage({
          type: 'updateTimerState',
          timerActive,
          remainingTime,
          initialTime,
        })
      }
    })
  }
})

const resetTimer = (stopTimer = false) => {
  if (stopTimer) {
    timerActive = false
    chrome.alarms.clear('timer')
  }
  remainingTime = initialTime
}

const blockRequest = (details: chrome.webRequest.WebRequestBodyDetails) => {
  if (timerActive && blockedUrls.some((url) => details.url.startsWith(url))) {
    console.log('Blocking:', details.url)
    return { cancel: true }
  } else {
    return {}
  }
}

const toggleTimer = () => {
  console.log('toggleTimer called')
  timerActive = !timerActive

  if (timerActive) {
    console.log('Blocking URLs...')
    chrome.alarms.create('timer', { periodInMinutes: 1 / 60 })
    // Block URLs
    chrome.webRequest.onBeforeRequest.addListener(
      blockRequest,
      { urls: blockedUrls },
      ['blocking']
    )
  } else {
    console.log('Unblocking URLs...')
    chrome.alarms.clear('timer')
    // Unblock URLs
    chrome.webRequest.onBeforeRequest.removeListener(blockRequest)
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTimerState') {
    sendResponse({ timerActive, remainingTime })
  } else if (message.type === 'toggleTimer') {
    toggleTimer()
  } else if (message.type === 'optionsChanged') {
    chrome.storage.sync.get('timerDuration', (data) => {
      if (data.timerDuration) {
        initialTime = data.timerDuration * 60
        resetTimer(true)
      }
    })
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'timer') {
    remainingTime -= 1
    if (remainingTime <= 0) {
      timerActive = false
      remainingTime = initialTime
      chrome.alarms.clear('timer')
      // Unblock URLs when timer is over
      chrome.webRequest.onBeforeRequest.removeListener(blockRequest)
    }
  } else {
    console.log('Unknown alarm:', alarm)
  }
})

// Update connected popup(s)
const updateConnectedPopups = () => {
  chrome.runtime.connect({ name: 'popup' }).postMessage({
    type: 'timerDurationChanged',
    initialTime,
    timerActive: timerActive,
    remainingTime: remainingTime,
  })
}

// Add a listener for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.timerDuration) {
    initialTime = changes.timerDuration.newValue * 60
    timerActive = false // Set timerActive to false
    chrome.alarms.clear('timer') // Clear the timer
    resetTimer()
    updateConnectedPopups()
  }
})

// Set timerActive state to false when the extension is reloaded
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update' || details.reason === 'install') {
    timerActive = false
    chrome.alarms.clear('timer')
    remainingTime = initialTime
  }
})
