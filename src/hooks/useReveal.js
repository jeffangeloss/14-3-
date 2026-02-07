import { useEffect, useRef, useState } from 'react'

const defaultOptions = {}

export default function useReveal(options = defaultOptions) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2, ...options }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [options])

  return [ref, isVisible]
}
