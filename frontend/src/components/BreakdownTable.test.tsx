import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithMantine } from '../test/render'
import { BreakdownTable } from './InsightsPage'

const row = (name: string, average_salary: number) => ({
  name,
  headcount: 10,
  min_salary: 1000,
  max_salary: 9000,
  median_salary: average_salary,
  average_salary,
})

describe('BreakdownTable', () => {
  it('renders one row per group with formatted stats', () => {
    renderWithMantine(<BreakdownTable label="Country" rows={[row('Germany', 90000), row('India', 30000)]} />)

    const india = screen.getByText('India').closest('tr')!
    expect(within(india).getAllByText('$30,000')).toHaveLength(2) // median + average
    expect(within(india).getByText('$1,000')).toBeInTheDocument()
  })

  it('scales bars relative to the highest average', () => {
    renderWithMantine(<BreakdownTable label="Country" rows={[row('Germany', 90000), row('India', 30000)]} />)

    expect(screen.getByLabelText('Germany average relative to highest')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByLabelText('India average relative to highest')).toHaveAttribute('aria-valuenow', '33')
  })

  it('shows an empty state', () => {
    renderWithMantine(<BreakdownTable label="Country" rows={[]} />)
    expect(screen.getByText('No data.')).toBeInTheDocument()
  })
})
