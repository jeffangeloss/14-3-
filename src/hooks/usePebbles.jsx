/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from 'react'
import useLocalStorage from './useLocalStorage'

const PebbleContext = createContext(null)

export function PebbleProvider({ children, total = 7 }) {
  // Persist found pebbles in localStorage so progress survives reloads.
  const [found, setFound] = useLocalStorage('gaby-pebbles', [])

  const foundSet = useMemo(() => new Set(found), [found])

  const addPebble = (id) => {
    if (foundSet.has(id)) return false
    const next = [...found, id]
    setFound(next)
    return true
  }

  const resetPebbles = () => setFound([])

  const complete = found.length >= total

  const value = {
    total,
    found,
    foundSet,
    addPebble,
    resetPebbles,
    complete
  }

  return <PebbleContext.Provider value={value}>{children}</PebbleContext.Provider>
}

export function usePebbles() {
  const context = useContext(PebbleContext)
  if (!context) {
    throw new Error('usePebbles must be used within a PebbleProvider')
  }
  return context
}
