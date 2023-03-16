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
  const initialTime = 25 * 60 // 25 minutes in seconds
  const [timerActive, setTimerActive] = useState(false)
  const [remainingTime, setRemainingTime] = useState(initialTime)

  useEffect(() => {
    const connectedPort = chrome.runtime.connect({ name: 'popup' })

    connectedPort.postMessage({ type: 'getTimerState' })

    connectedPort.onMessage.addListener((response) => {
      if (response.type === 'updateTimerState') {
        setTimerActive(response.timerActive)
        setRemainingTime(response.remainingTime)
      }
    })

    // Add this interval to request updates every second
    const updateInterval = setInterval(() => {
      connectedPort.postMessage({ type: 'getTimerState' })
    }, 1000)

    return () => {
      connectedPort.disconnect()
      clearInterval(updateInterval)
    }
  }, [])

  const toggleTimer = () => {
    console.log('toggleTimer called')
    chrome.runtime.sendMessage({ type: 'toggleTimer' })
  }

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = timeInSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

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
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
const root = createRoot(container)
root.render(<App />)
