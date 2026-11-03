import { useCallback, useEffect, useState } from 'react'

/** Runs an async loader whenever deps change; ignores responses from stale requests. */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let current = true
    setLoading(true)
    loader()
      .then((result) => current && (setData(result), setError(null)))
      .catch((err: Error) => current && setError(err))
      .finally(() => current && setLoading(false))
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { data, error, loading, reload }
}
