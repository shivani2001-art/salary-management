import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithMantine } from '../test/render'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('switches between light and dark and says what it will do next', async () => {
    const user = userEvent.setup()
    renderWithMantine(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement).toHaveAttribute('data-mantine-color-scheme', 'dark')

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement).toHaveAttribute('data-mantine-color-scheme', 'light')
  })
})
