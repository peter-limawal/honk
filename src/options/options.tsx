import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './options.css'

const App: React.FC<{}> = () => {
  const [timerDuration, setTimerDuration] = useState(25)

  useEffect(() => {
    chrome.storage.sync.get('timerDuration', (data) => {
      if (data.timerDuration) {
        setTimerDuration(data.timerDuration)
      }
    })
  }, [])

  const saveOptions = () => {
    chrome.storage.sync.set({ timerDuration }, () => {
      console.log('Timer duration saved:', timerDuration)
      chrome.runtime.sendMessage({ type: 'optionsChanged' }) // Add this line
    })
  }

  return (
    <div>
      <div>
        <label htmlFor="timer-duration">Timer Duration (minutes): </label>
        <input
          id="timer-duration"
          type="number"
          min="1"
          value={timerDuration}
          onChange={(e) => setTimerDuration(parseInt(e.target.value))}
        />
        <button onClick={saveOptions}>Save</button>
      </div>
    </div>
  )
}

const container = document.createElement('div')
document.body.appendChild(container)
const root = createRoot(container)
root.render(<App />)
