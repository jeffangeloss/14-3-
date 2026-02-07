import useReveal from '../hooks/useReveal'

export default function Reveal({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useReveal()

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? 'reveal-visible' : ''} ${className}`}
      style={{ '--delay': `${delay}ms` }}
    >
      {children}
    </div>
  )
}
