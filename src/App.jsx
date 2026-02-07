import Home from './pages/Home'
import { PebbleProvider } from './hooks/usePebbles.jsx'
import AnimatedGarden from './components/AnimatedGarden'
import PebbleCounter from './components/PebbleCounter'

function App() {
  return (
    <PebbleProvider total={7}>
      <AnimatedGarden />
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <PebbleCounter />
      <main id="contenido" className="app">
        <Home />
      </main>
    </PebbleProvider>
  )
}

export default App
