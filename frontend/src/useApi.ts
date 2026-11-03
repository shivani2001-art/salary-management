import { useCallback, useEffect, useState } from 'react'
import { withViewTransition } from './motion'

/**
 * Runs an async loader whenever deps change; ignores responses from stale requests.
 * With `animate`, new data is applied inside a View Transition so named elements morph.
 * `mutate` allows optimistic local updates.
 */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[], { animate = false } = {}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let current = true
    setLoading(true)
    loader()
      .then((result) => {
        if (!current) return
        const apply = () => {
          setData(result)
          setError(null)
        }
        if (animate) withViewTransition(apply)
        else apply()
      })
      .catch((err: Error) => current && setError(err))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, loading, reload, mutate: setData }
}
