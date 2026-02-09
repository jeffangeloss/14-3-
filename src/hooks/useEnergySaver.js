import { useEffect, useState } from 'react'
import useLocalStorage from './useLocalStorage'

export default function useEnergySaver() {
  const [manualEnabled, setManualEnabled] = useLocalStorage('energy-saver-enabled', false)
  const [tabHidden, setTabHidden] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'hidden'
  )

  useEffect(() => {
    const onVisibilityChange = () => {
      setTabHidden(document.visibilityState === 'hidden')
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return {
    energySaver: manualEnabled || tabHidden,
    manualEnabled,
    setManualEnabled
  }
}
