// popup.tsx
import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './popup.css'
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const App: React.FC<{}> = () => {
  const [initialTime, setInitialTime] = useState(25 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const [remainingTime, setRemainingTime] = useState(initialTime)

  useEffect(() => {
    const connectedPort = chrome.runtime.connect({ name: 'popup' })

    const updateTimerState = () => {
      connectedPort.postMessage({ type: 'getTimerState' })
    }

    updateTimerState()
    const timerUpdateInterval = setInterval(updateTimerState, 500)

    connectedPort.onMessage.addListener((response) => {
      if (response.type === 'updateTimerState') {
        setTimerActive(response.timerActive)
        setRemainingTime(response.remainingTime)
        setInitialTime(response.initialTime)
      } else if (response.type === 'timerDurationChanged') {
        setTimerActive(response.timerActive)
        setRemainingTime(response.remainingTime)
        setInitialTime(response.initialTime)
      }
    })

    return () => {
      connectedPort.disconnect()
      clearInterval(timerUpdateInterval)
    }
  }, [])

  const toggleTimer = () => {
    console.log('toggleTimer called')
    setTimerActive(!timerActive)
    chrome.runtime.sendMessage({ type: 'toggleTimer' })
  }

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  const progress = (remainingTime / initialTime) * 100 // Update this line to use initialTime

  return (
    <div className="container">
      <h1 className="title">Honk!</h1>
      <p className="subtitle">Pomodoro Study Timer</p>
      <div className="circular-progressbar-container">
        <CircularProgressbarWithChildren
          value={((initialTime - remainingTime) / initialTime) * 100}
          styles={buildStyles({
            strokeLinecap: 'butt',
            pathColor: 'turquoise',
            trailColor: '#eee',
            textSize: '16px',
          })}
        >
          <img
            style={{ width: '50%', height: 'auto' }}
            src={chrome.runtime.getURL('assets/goose1.png')}
            alt="mr goose"
          />
        </CircularProgressbarWithChildren>
      </div>
      <p className="timer">{formatTime(remainingTime)}</p>
      <button
        className={`timer-toggle ${timerActive ? 'active' : ''}`}
        onClick={toggleTimer}
      >
        {timerActive ? 'Stop Studying' : 'Start Studying'}
      </button>
      <button
        className="settings-btn"
        onClick={() => chrome.runtime.openOptionsPage()}
      >
        Settings
      </button>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
const root = createRoot(container)
root.render(<App />)
