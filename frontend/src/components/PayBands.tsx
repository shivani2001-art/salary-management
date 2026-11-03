import { VisuallyHidden } from '@mantine/core'
import type { CSSProperties } from 'react'
import type { BreakdownRow } from '../api'
import { formatCompactUSD, formatCount, formatUSD } from '../format'
import { vtName } from '../motion'
import './insights.css'

const STEPS = [10_000, 20_000, 25_000, 50_000, 100_000]
const MAX_INTERVALS = 5 // 0 plus five steps = at most six axis ticks

/** A shared $0 → top scale with a round step, so every row's band is comparable. */
function bandScale(max: number) {
  const step =
    STEPS.find((s) => Math.ceil(max / s) <= MAX_INTERVALS) ?? Math.ceil(max / MAX_INTERVALS / 100_000) * 100_000
  const top = Math.max(Math.ceil(max / step), 1) * step
  return { step, top }
}

const pct = (value: number, top: number) => `${(value / top) * 100}%`

export function PayBands({ rows, label }: { rows: BreakdownRow[]; label: string }) {
  if (rows.length === 0) {
    return (
      <div className="empty">
        <h3>No one matches this filter yet.</h3>
      </div>
    )
  }

  const { step, top } = bandScale(Math.max(...rows.map((r) => r.max_salary)))
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step)

  return (
    <div className="pay-bands">
      <div className="legend" aria-hidden>
        <span><i className="sw-band" />Lowest to highest</span>
        <span><i className="sw-median" />Median</span>
        <span><i className="sw-avg" />Average</span>
      </div>
      <div className="bands-wrap">
        <table className="bands">
          <caption className="sr-only">Pay by {label.toLowerCase()}</caption>
          <thead>
            <tr>
              <th className="c-name">{label}</th>
              <th className="c-band">
                <VisuallyHidden>Pay band</VisuallyHidden>
                <div className="band-axis" aria-hidden>
                  {ticks.map((t) => (
                    <span key={t} style={{ left: pct(t, top) }}>{formatCompactUSD(t)}</span>
                  ))}
                </div>
              </th>
              <th className="c-med right">Median</th>
              <th className="c-avg right">Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.name}
                style={{ viewTransitionName: vtName('band', row.name), '--i': i } as CSSProperties}
              >
                <td className="c-name">
                  <div className="band-name">{row.name}</div>
                  <div className="band-sub num">
                    {formatCount(row.headcount)} {row.headcount === 1 ? 'person' : 'people'}
                  </div>
                </td>
                <td className="c-band">
                  <VisuallyHidden>
                    Range {formatUSD(row.min_salary)} to {formatUSD(row.max_salary)}
                  </VisuallyHidden>
                  <div aria-hidden>
                    <div className="band-track" style={{ '--tick': pct(step, top) } as CSSProperties}>
                      <div
                        className="band"
                        data-testid={`band-${row.name}`}
                        style={{ left: pct(row.min_salary, top), width: pct(row.max_salary - row.min_salary, top) }}
                      />
                      <div className="band-median" style={{ left: pct(row.median_salary, top) }} />
                      <div className="band-avg" style={{ left: pct(row.average_salary, top) }} />
                    </div>
                    <div
                      className="band-range"
                      style={{ marginLeft: pct(row.min_salary, top), width: pct(row.max_salary - row.min_salary, top) }}
                    >
                      <span>{formatCompactUSD(row.min_salary)}</span>
                      <span>{formatCompactUSD(row.max_salary)}</span>
                    </div>
                  </div>
                </td>
                <td className="c-med right num" data-label="Median">{formatUSD(row.median_salary)}</td>
                <td className="c-avg right num" data-label="Average">{formatUSD(row.average_salary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
