import { Alert, SegmentedControl, Select, Skeleton, Stack } from '@mantine/core'
import type { CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { api, type FilterOptions, type GroupBy } from '../api'
import { formatCompactUSD, formatCount, formatUSD } from '../format'
import { useApi } from '../useApi'
import { AnimatedNumber } from './AnimatedNumber'
import { PayBands } from './PayBands'
import './insights.css'

const GROUP_LABELS: Record<GroupBy, string> = { country: 'Country', department: 'Department', job_title: 'Job title' }

interface Props {
  options: FilterOptions
  refreshKey: number
}

const skel = (width: string) => <span className="num-skel" style={{ '--w': width } as CSSProperties} />

export function InsightsPage({ options, refreshKey }: Props) {
  const [country, setCountry] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('country')
  const filters = { country }

  // Independent requests: fired in parallel, not chained.
  // Each result carries the question it answers, so the copy never mixes a new filter with old numbers.
  const summary = useApi(() => api.summary(filters).then((data) => ({ ...data, country })), [country, refreshKey])
  const breakdown = useApi(() => api.breakdown(groupBy, filters).then((rows) => ({ rows, groupBy })),
    [groupBy, country, refreshKey], { animate: true })
  const error = summary.error ?? breakdown.error
  const s = summary.data

  let people: ReactNode = skel('5ch')
  let payroll: ReactNode = skel('4ch')
  if (s) {
    people = (
      <mark className="hl">
        <AnimatedNumber value={s.headcount} format={formatCount} /> {s.headcount === 1 ? 'person' : 'people'}
      </mark>
    )
    payroll = (
      <mark className="hl" style={{ '--d': '450ms' } as CSSProperties}>
        <AnimatedNumber value={s.total_payroll} format={formatCompactUSD} />
      </mark>
    )
  }

  return (
    <Stack gap={48}>
      <header>
        <h1 className="headline">
          {s?.country ? `In ${s.country}, ACME` : 'ACME'} pays {people} {payroll} a year.
        </h1>
        <p className="headline-sub">
          {!s ? (
            <>Half earn less than {skel('6ch')}; the average is {skel('6ch')}.</>
          ) : s.median_salary == null || s.average_salary == null ? (
            'No salaries on record here yet.'
          ) : (
            <>
              Half earn less than <b><AnimatedNumber value={s.median_salary} format={formatUSD} /></b>; the average is{' '}
              <b><AnimatedNumber value={s.average_salary} format={formatUSD} /></b>.
            </>
          )}
        </p>
      </header>

      {error ? <Alert color="red" title="Couldn't load insights">{error.message}</Alert> : null}

      <section aria-label="Pay breakdown">
        <Stack gap="xl">
          <div className="question">
            <span id="q-by">Break pay down by</span>
            <div className="q-seg">
              <SegmentedControl
                aria-labelledby="q-by"
                fullWidth
                value={groupBy}
                onChange={(value) => setGroupBy(value as GroupBy)}
                data={Object.entries(GROUP_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
            <span className="q-in">
              in
              <Select
                aria-label="Country"
                variant="unstyled"
                className="q-country"
                data-active={country ? true : undefined}
                comboboxProps={{ width: 240, position: 'bottom-start', offset: 10 }}
                placeholder="all countries"
                data={options.countries}
                value={country}
                onChange={(value) => {
                  setCountry(value)
                  // Grouping by country inside one country is a single row; job title is the useful next question.
                  if (value && groupBy === 'country') setGroupBy('job_title')
                }}
                clearable
                searchable
              />
            </span>
          </div>

          {breakdown.data ? (
            <PayBands rows={breakdown.data.rows} label={GROUP_LABELS[breakdown.data.groupBy]} />
          ) : (
            <Stack gap="md" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={44} radius="sm" />)}
            </Stack>
          )}
        </Stack>
      </section>
    </Stack>
  )
}
