import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Workspace from './components/Workspace'
import Toast from './components/Toast'
import AncientTextModal from './components/AncientTextModal'

function AppContent() {
  const { loading, error } = useApp()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-logo">📖</div>
          <div className="loading-title">Straight Truth</div>
          <div className="loading-subtitle">Loading Bible data...</div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-title">Failed to Load</div>
          <div className="error-message">{error}</div>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      <Workspace />
      <Toast />
      <AncientTextModal />
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
