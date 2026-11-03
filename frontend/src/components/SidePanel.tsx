import { CloseButton, FocusTrap } from '@mantine/core'
import { useFocusReturn } from '@mantine/hooks'
import { type ReactNode, useEffect, useId, useState } from 'react'
import { prefersReducedMotion } from '../motion'

interface Props {
  opened: boolean
  title: ReactNode
  kicker?: ReactNode
  onClose: () => void
  children: ReactNode
}

const EXIT_MS = 200

/**
 * Editor panel. Enter/exit are CSS transform + opacity animations on the live element (not View Transition
 * snapshots, which scale a bitmap and look blurry), so text stays crisp and the glass blur keeps working.
 */
export function SidePanel({ opened, title, kicker, onClose, children }: Props) {
  const titleId = useId()
  const [mounted, setMounted] = useState(opened)
  if (opened && !mounted) setMounted(true) // mount immediately on open (state adjusted during render)
  const closing = mounted && !opened
  useFocusReturn({ opened })

  // Stay mounted for the exit animation, then unmount.
  useEffect(() => {
    if (!closing) return
    const timer = setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : EXIT_MS)
    return () => clearTimeout(timer)
  }, [closing])

  useEffect(() => {
    if (!opened) return
    const onKey = (e: KeyboardEvent) => {
      // Let an open dropdown (Autocomplete) swallow its own Esc first.
      if (e.key === 'Escape' && !(e.target as Element | null)?.closest?.('[aria-expanded="true"]')) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [opened, onClose])

  if (!mounted) return null

  return (
    <>
      <div className="scrim" data-closing={closing || undefined} onClick={onClose} aria-hidden />
      <FocusTrap active={opened}>
        <div
          className="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-closing={closing || undefined}
        >
          <div className="panel-head">
            <div>
              {kicker ? <div className="panel-kicker">{kicker}</div> : null}
              <h2 id={titleId} className="panel-title">
                {title}
              </h2>
            </div>
            <CloseButton aria-label="Close" size="lg" radius="xl" onClick={onClose} />
          </div>
          {children}
        </div>
      </FocusTrap>
    </>
  )
}
