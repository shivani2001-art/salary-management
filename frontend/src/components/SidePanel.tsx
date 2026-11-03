import { CloseButton, FocusTrap } from '@mantine/core'
import { useFocusReturn } from '@mantine/hooks'
import { type ReactNode, useEffect, useId } from 'react'

interface Props {
  opened: boolean
  title: ReactNode
  kicker?: ReactNode
  onClose: () => void
  children: ReactNode
}

/** Non-blocking-feeling editor panel rendered in-tree so it can morph from its trigger via View Transitions. */
export function SidePanel({ opened, title, kicker, onClose, children }: Props) {
  const titleId = useId()
  useFocusReturn({ opened })

  useEffect(() => {
    if (!opened) return
    const onKey = (e: KeyboardEvent) => {
      // Let an open dropdown (Autocomplete) swallow its own Esc first.
      if (e.key === 'Escape' && !(e.target as Element | null)?.closest?.('[aria-expanded="true"]')) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [opened, onClose])

  if (!opened) return null

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden />
      <FocusTrap active>
        <div
          className="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{ viewTransitionName: 'editor' }}
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
