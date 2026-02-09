import ImmersiveGallery from '../components/ImmersiveGallery'
import Landing from '../components/Landing'
import Letter from '../components/Letter'

export default function Home({ energySaver = false }) {
  return (
    <>
      <Landing energySaver={energySaver} />
      <ImmersiveGallery energySaver={energySaver} />
      <Letter />
    </>
  )
}
