import React, { Component } from 'react'
import DinoGame from './components/DinoGame'
import './App.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Game Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#fff', padding: '30px 15px', textAlign: 'center', background: 'rgba(18, 22, 50, 0.9)', borderRadius: '16px', margin: '20px auto', maxWidth: '600px', border: '1px solid #b388ff' }}>
          <h2>🦖 Oops! Terjadi kesalahan saat memuat game.</h2>
          <p style={{ color: '#ff8a80', fontFamily: 'monospace', fontSize: '13px', margin: '10px 0' }}>
            {this.state.error?.toString()}
          </p>
          <button
            type="button"
            style={{
              background: 'linear-gradient(135deg, #7c4dff, #651fff)',
              color: '#fff',
              border: '1.5px solid #b388ff',
              padding: '10px 24px',
              borderRadius: '20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '15px',
              boxShadow: '0 4px 15px rgba(124, 77, 255, 0.5)'
            }}
            onClick={() => {
              try {
                localStorage.clear();
              } catch (_) {}
              window.location.reload();
            }}
          >
            🔄 Reset Data & Muat Ulang Game
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <div className="app-container">
      <section id="dino-section">
        <h1 className="main-title">🦖 T-Rex Night Mode Adventure</h1>
        <p className="main-subtitle">Gunakan Panah / WASD untuk bergerak • Tekan R untuk Auman Roar • Tap layar untuk bermain</p>
        <ErrorBoundary>
          <DinoGame />
        </ErrorBoundary>
      </section>
    </div>
  )
}

export default App