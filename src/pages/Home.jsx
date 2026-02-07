import ImmersiveGallery from '../components/ImmersiveGallery'
import Landing from '../components/Landing'
import Letter from '../components/Letter'
import Music from '../components/Music'
import PebbleGame from '../components/PebbleGame'
import Timeline from '../components/Timeline'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Landing />
      <ImmersiveGallery />
      <Timeline />
      <PebbleGame />
      <Music />
      <Letter />
      <Footer />
    </>
  )
}
