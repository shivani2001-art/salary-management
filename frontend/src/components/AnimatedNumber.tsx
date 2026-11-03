import { VisuallyHidden } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../motion'

const DURATION = 700
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

interface Props {
  value: number
  format: (n: number) => string
}

/** Tweens from the previously shown value to `value`; counts up from 0 on mount. */
export function AnimatedNumber({ value, format }: Props) {
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    if (reduced) {
      shownRef.current = value
      return
    }
    // Start from wherever the last tween got to, so interrupting it stays smooth.
    const from = shownRef.current
    const start = performance.now()
    const raf = { id: 0 }
    raf.id = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / DURATION, 1)
      shownRef.current = from + (value - from) * easeOutExpo(t)
      setShown(shownRef.current)
      if (t < 1) raf.id = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf.id)
  }, [value, reduced])

  const display = format(Math.round(reduced ? value : shown))
  return (
    <span className="num">
      {/* Screen readers get the settled value, not every intermediate frame. */}
      <span aria-hidden>{display}</span>
      <VisuallyHidden>{format(value)}</VisuallyHidden>
    </span>
  )
}
