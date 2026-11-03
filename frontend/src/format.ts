const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const compactUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const formatUSD = (amount: number | null | undefined) => (amount == null ? '—' : usd.format(amount))
export const formatCompactUSD = (amount: number | null | undefined) =>
  amount == null ? '—' : compactUsd.format(amount)
export const formatCount = (n: number) => n.toLocaleString('en-US')
