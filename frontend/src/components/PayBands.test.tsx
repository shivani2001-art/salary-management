import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithMantine } from '../test/render'
import { PayBands } from './PayBands'

const row = (name: string, average_salary: number) => ({
  name,
  headcount: 10,
  min_salary: 1000,
  max_salary: 9000,
  median_salary: average_salary - 500,
  average_salary,
})

describe('PayBands', () => {
  it('renders one row per group with formatted stats and an accessible range', () => {
    renderWithMantine(<PayBands label="Country" rows={[row('Germany', 6000), row('India', 3000)]} />)

    const india = screen.getByText('India').closest('tr')!
    expect(within(india).getByText('10 people')).toBeInTheDocument()
    expect(within(india).getByText('$2,500')).toBeInTheDocument() // median
    expect(within(india).getByText('$3,000')).toBeInTheDocument() // average
    expect(within(india).getByText('Range $1,000 to $9,000')).toBeInTheDocument()
  })

  it('places each band on a shared scale from $0 to a round top', () => {
    renderWithMantine(<PayBands label="Country" rows={[row('Germany', 6000), row('India', 3000)]} />)

    // max 9,000 → step 10k, top 10k: band runs 1,000 → 9,000 = left 10%, width 80%.
    expect(screen.getByTestId('band-India')).toHaveStyle({ left: '10%', width: '80%' })
  })

  it.each([
    [9000, ['$0', '$10K']],
    [230_000, ['$0', '$50K', '$100K', '$150K', '$200K', '$250K']],
    [480_000, ['$0', '$100K', '$200K', '$300K', '$400K', '$500K']],
    [1_200_000, ['$0', '$300K', '$600K', '$900K', '$1.2M']],
  ])('picks a round axis of six ticks or fewer for a max of %i', (max, ticks) => {
    const { container } = renderWithMantine(<PayBands label="Country" rows={[{ ...row('A', 5000), max_salary: max }]} />)
    expect([...container.querySelectorAll('.band-axis span')].map((s) => s.textContent)).toEqual(ticks)
  })

  it('shows an empty state', () => {
    renderWithMantine(<PayBands label="Country" rows={[]} />)
    expect(screen.getByText('No one matches this filter yet.')).toBeInTheDocument()
  })
})
