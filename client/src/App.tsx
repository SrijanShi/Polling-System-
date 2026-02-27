import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [serverStatus, setServerStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Test connection to backend
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    fetch(`${apiUrl}/api/health`)
      .then(res => res.json())
      .then(data => {
        setServerStatus(`${data.message}`)
      })
      .catch(() => {
        setServerStatus('Server connection failed')
      })
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resilient Live Polling System</h1>
        <p>Built with Vite + React + TypeScript</p>
        <div className="server-status">
          <strong>Backend Status:</strong> {serverStatus}
        </div>
      </header>
    </div>
  )
}

export default App