import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithMantine } from '../test/render'
import { SalaryCell } from './SalaryCell'

async function startEditing() {
  const onSave = vi.fn()
  renderWithMantine(<SalaryCell value={50000} name="Ada Lovelace" onSave={onSave} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Edit salary for Ada Lovelace' }))
  const input = screen.getByLabelText('Salary for Ada Lovelace')
  await user.clear(input)
  return { onSave, user, input }
}

describe('SalaryCell', () => {
  it('commits a new value on Enter', async () => {
    const { onSave, user, input } = await startEditing()

    await user.type(input, '65000{Enter}')

    expect(onSave).toHaveBeenCalledExactlyOnceWith(65000)
    expect(screen.getByRole('button', { name: 'Edit salary for Ada Lovelace' })).toHaveTextContent('$50,000')
  })

  it('cancels on Esc without saving', async () => {
    const { onSave, user, input } = await startEditing()

    await user.type(input, '65000{Escape}')

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Edit salary for Ada Lovelace' })).toHaveFocus()
  })

  it('does not commit an out-of-range value', async () => {
    const { onSave, user, input } = await startEditing()

    await user.type(input, '20000000{Enter}')

    expect(onSave).not.toHaveBeenCalled()
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('does not save when the value is unchanged', async () => {
    const { onSave, user, input } = await startEditing()

    await user.type(input, '50000{Enter}')

    expect(onSave).not.toHaveBeenCalled()
  })
})
