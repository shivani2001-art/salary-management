import { describe, expect, it } from 'vitest'
import { formatCompactUSD, formatCount, formatUSD } from './format'

describe('format', () => {
  it('formats whole-dollar amounts', () => {
    expect(formatUSD(1234567)).toBe('$1,234,567')
  })

  it('formats large totals compactly', () => {
    expect(formatCompactUSD(768_793_000)).toBe('$768.8M')
  })

  it('shows a dash for missing values instead of $0', () => {
    expect(formatUSD(null)).toBe('—')
    expect(formatCompactUSD(undefined)).toBe('—')
  })

  it('adds thousands separators to counts', () => {
    expect(formatCount(10000)).toBe('10,000')
  })
})
