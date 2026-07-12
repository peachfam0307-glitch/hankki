import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { StoreProvider } from './store'
import { TimerProvider } from './timer'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </StoreProvider>
  </React.StrictMode>
)
