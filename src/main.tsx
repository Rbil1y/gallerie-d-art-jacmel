import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/hanken-grotesk/wght.css'
import '@fontsource-variable/besley/wght.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/signature.css'
import './styles/chrome.css'
import './styles/sections.css'
import './styles/overlays.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
