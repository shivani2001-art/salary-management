import { NumberInput } from '@mantine/core'
import { useEffect, useRef, useState } from 'react'
import { formatUSD } from '../format'
import { MAX_SALARY } from './EmployeeForm'

interface Props {
  value: number
  /** Full name, used in labels ("Edit salary for Ada Lovelace"). */
  name: string
  onSave: (salary: number) => void
}

const isValid = (v: number | string): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= MAX_SALARY

/** Salary that turns into an input on click. Enter or blur commits, Esc cancels. */
export function SalaryCell({ value, name, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<number | string>(value)
  const [invalid, setInvalid] = useState(false)
  // Set when the user leaves with the keyboard, so focus lands back on the button.
  const [refocus, setRefocus] = useState(false)
  const settled = useRef(false)
  const input = useRef<HTMLInputElement>(null)

  // Select all once mounted; deferred so react-number-format's own caret placement runs first.
  useEffect(() => {
    if (!editing) return
    const t = setTimeout(() => input.current?.select())
    return () => clearTimeout(t)
  }, [editing])

  const finish = (commit: boolean, viaKeyboard: boolean) => {
    if (settled.current) return
    if (commit && !isValid(draft)) {
      if (viaKeyboard) return setInvalid(true)
      commit = false // blurring away from an invalid value just reverts
    }
    settled.current = true
    setEditing(false)
    setRefocus(viaKeyboard)
    if (commit && draft !== value) onSave(draft as number)
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="salary-btn"
        aria-label={`Edit salary for ${name}`}
        autoFocus={refocus}
        onClick={() => {
          settled.current = false
          setDraft(value)
          setInvalid(false)
          setEditing(true)
        }}
      >
        {formatUSD(value)}
      </button>
    )
  }

  return (
    <NumberInput
      ref={input}
      className="salary-input"
      aria-label={`Salary for ${name}`}
      value={draft}
      onChange={(v) => {
        setDraft(v)
        setInvalid(false)
      }}
      error={invalid ? `$1 to $${MAX_SALARY.toLocaleString('en-US')}` : undefined}
      prefix="$"
      thousandSeparator=","
      allowDecimal={false}
      allowNegative={false}
      hideControls
      size="xs"
      radius="md"
      autoFocus
      onBlur={() => finish(true, false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          finish(true, true)
        } else if (e.key === 'Escape') {
          e.stopPropagation()
          finish(false, true)
        }
      }}
    />
  )
}
