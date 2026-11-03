import { Alert, Group, Paper, Progress, SegmentedControl, Select, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import { useState } from 'react'
import { api, type BreakdownRow, type FilterOptions, type GroupBy } from '../api'
import { formatCompactUSD, formatCount, formatUSD } from '../format'
import { useApi } from '../useApi'

const GROUP_LABELS: Record<GroupBy, string> = { country: 'Country', department: 'Department', job_title: 'Job title' }

interface Props {
  options: FilterOptions
  refreshKey: number
}

export function InsightsPage({ options, refreshKey }: Props) {
  const [country, setCountry] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('country')
  const filters = { country }

  // Independent requests: fired in parallel, not chained.
  const summary = useApi(() => api.summary(filters), [country, refreshKey])
  const breakdown = useApi(() => api.breakdown(groupBy, filters), [groupBy, country, refreshKey])
  const error = summary.error ?? breakdown.error

  return (
    <Stack>
      <Group align="flex-end" justify="space-between">
        <Select
          label="Country"
          placeholder="All countries"
          data={options.countries}
          value={country}
          onChange={(value) => {
            setCountry(value)
            // Grouping by country inside one country is a single row; job title is the useful next question.
            if (value && groupBy === 'country') setGroupBy('job_title')
          }}
          clearable
          searchable
          w={240}
        />
        <div>
          <Text fz="sm" fw={500} mb={4}>Break down by</Text>
          <SegmentedControl
            value={groupBy}
            onChange={(value) => setGroupBy(value as GroupBy)}
            data={Object.entries(GROUP_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </Group>

      {error ? <Alert color="red" title="Couldn't load insights">{error.message}</Alert> : null}

      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <Stat label="Headcount" value={summary.data ? formatCount(summary.data.headcount) : '—'} />
        <Stat label="Annual payroll" value={formatCompactUSD(summary.data?.total_payroll)} />
        <Stat label="Average salary" value={formatUSD(summary.data?.average_salary)} />
        <Stat label="Median salary" value={formatUSD(summary.data?.median_salary)} />
      </SimpleGrid>

      <Paper withBorder radius="md" p="md">
        <Title order={4} mb="sm">
          Salary by {GROUP_LABELS[groupBy].toLowerCase()}
          {country ? ` in ${country}` : ''}
        </Title>
        <BreakdownTable rows={breakdown.data ?? []} label={GROUP_LABELS[groupBy]} />
      </Paper>
    </Stack>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text fz="xs" tt="uppercase" fw={600} c="dimmed">{label}</Text>
      <Text fz="xl" fw={700}>{value}</Text>
    </Paper>
  )
}

export function BreakdownTable({ rows, label }: { rows: BreakdownRow[]; label: string }) {
  const top = Math.max(...rows.map((r) => r.average_salary), 1)
  if (rows.length === 0) return <Text c="dimmed">No data.</Text>

  return (
    <Table.ScrollContainer minWidth={760}>
      <Table striped verticalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{label}</Table.Th>
            <Table.Th ta="right">Headcount</Table.Th>
            <Table.Th ta="right">Min</Table.Th>
            <Table.Th ta="right">Median</Table.Th>
            <Table.Th ta="right">Max</Table.Th>
            <Table.Th ta="right">Average</Table.Th>
            <Table.Th w={180} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.name}>
              <Table.Td fw={500}>{row.name}</Table.Td>
              <Table.Td ta="right">{formatCount(row.headcount)}</Table.Td>
              <Table.Td ta="right" ff="monospace">{formatUSD(row.min_salary)}</Table.Td>
              <Table.Td ta="right" ff="monospace">{formatUSD(row.median_salary)}</Table.Td>
              <Table.Td ta="right" ff="monospace">{formatUSD(row.max_salary)}</Table.Td>
              <Table.Td ta="right" ff="monospace" fw={600}>{formatUSD(row.average_salary)}</Table.Td>
              <Table.Td>
                <Progress value={(row.average_salary / top) * 100} aria-label={`${row.name} average relative to highest`} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
