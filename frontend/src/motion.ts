import { flushSync } from 'react-dom'

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Applies a React state update inside a View Transition so named elements morph between states.
 * Falls back to a plain update when unsupported or when the user prefers reduced motion.
 * `after` runs once the transition (or the plain update) has finished.
 */
export function withViewTransition(update: () => void, after?: () => void) {
  if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion()) {
    update()
    after?.()
    return
  }
  const transition = document.startViewTransition(() => flushSync(update))
  // A newer transition (e.g. a fast second click) aborts this one; that's expected, not an error.
  transition.ready.catch(() => {})
  transition.finished.catch(() => {}).finally(() => after?.())
}

/** A valid, stable view-transition-name for arbitrary text (e.g. a country or job title). */
export const vtName = (prefix: string, value: string | number) =>
  `${prefix}-${String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
