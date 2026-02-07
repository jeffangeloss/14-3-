/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react'

export default function useTypewriter(text, speed = 26, start = true) {
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (!start) return
    // Reset and reveal the text progressively for the typewriter effect.
    let index = 0
    setOutput('')

    const interval = setInterval(() => {
      index += 1
      setOutput(text.slice(0, index))
      if (index >= text.length) {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, start])

  return output
}
