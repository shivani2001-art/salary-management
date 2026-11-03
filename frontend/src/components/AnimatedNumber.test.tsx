import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatUSD } from '../format'
import { renderWithMantine } from '../test/render'
import { AnimatedNumber } from './AnimatedNumber'

describe('AnimatedNumber', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders the final value immediately when reduced motion is preferred', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    )
    renderWithMantine(<AnimatedNumber value={76879} format={formatUSD} />)

    // Visible and screen-reader copies both show the settled value.
    expect(screen.getAllByText('$76,879')).toHaveLength(2)
  })

  it('counts up from zero otherwise, keeping the settled value for screen readers', () => {
    renderWithMantine(<AnimatedNumber value={76879} format={formatUSD} />)

    expect(screen.getByText('$0')).toHaveAttribute('aria-hidden')
    expect(screen.getByText('$76,879')).toBeInTheDocument()
  })
})
