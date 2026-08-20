import DinoGame from './components/DinoGame'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <section id="dino-section">
        <h1 className="main-title">🦖 T-Rex Night Mode Adventure</h1>
        <p className="main-subtitle">Gunakan Panah / WASD untuk bergerak • Tekan R untuk Auman Roar • Tap layar untuk bermain</p>
        <DinoGame />
      </section>
    </div>
  )
}

export default App