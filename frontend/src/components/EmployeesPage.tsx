import {
  ActionIcon,
  Alert,
  Button,
  Group,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { api, type Employee, type EmployeeInput, type FilterOptions, type ListParams } from '../api'
import { formatCount, formatUSD } from '../format'
import { useApi } from '../useApi'
import { EmployeeForm } from './EmployeeForm'

type SortKey = NonNullable<ListParams['sort']>
const PER_PAGE = 25

interface Props {
  options: FilterOptions
  onDataChanged: () => void
}

export function EmployeesPage({ options, onDataChanged }: Props) {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search.trim(), 300)
  const [country, setCountry] = useState<string | null>(null)
  const [department, setDepartment] = useState<string | null>(null)
  const [jobTitle, setJobTitle] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('name')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  // undefined = closed, null = creating, Employee = editing
  const [editing, setEditing] = useState<Employee | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Employee | null>(null)

  const { data, error, loading, reload } = useApi(
    () =>
      api.listEmployees({
        q: debouncedSearch,
        country,
        department,
        job_title: jobTitle,
        sort,
        direction,
        page,
        per_page: PER_PAGE,
      }),
    [debouncedSearch, country, department, jobTitle, sort, direction, page],
  )

  // Any filter change sends the user back to page 1.
  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setPage(1)
    }

  const toggleSort = (key: SortKey) => {
    if (key === sort) setDirection(direction === 'asc' ? 'desc' : 'asc')
    else {
      setSort(key)
      setDirection(key === 'name' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  const afterChange = (message: string) => {
    notifications.show({ message, color: 'teal' })
    reload()
    onDataChanged()
  }

  const save = async (values: EmployeeInput) => {
    if (editing) await api.updateEmployee(editing.id, values)
    else await api.createEmployee(values)
    afterChange(editing ? `Saved ${values.first_name} ${values.last_name}` : `Added ${values.first_name} ${values.last_name}`)
    setEditing(undefined)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    try {
      await api.deleteEmployee(deleting.id)
      afterChange(`Deleted ${deleting.first_name} ${deleting.last_name}`)
    } catch (err) {
      notifications.show({ message: (err as Error).message, color: 'red' })
    } finally {
      setDeleting(null)
    }
  }

  const sortLabel = (key: SortKey, label: string) => (
    <UnstyledButton onClick={() => toggleSort(key)} fw={600} fz="sm" aria-label={`Sort by ${label}`}>
      {label} {sort === key ? (direction === 'asc' ? '▲' : '▼') : ''}
    </UnstyledButton>
  )

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <TextInput
            label="Search"
            placeholder="Name, email or job title"
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            w={240}
          />
          <Select label="Country" placeholder="All" data={options.countries} value={country} onChange={withPageReset(setCountry)} clearable searchable w={180} />
          <Select label="Department" placeholder="All" data={options.departments} value={department} onChange={withPageReset(setDepartment)} clearable searchable w={180} />
          <Select label="Job title" placeholder="All" data={options.job_titles} value={jobTitle} onChange={withPageReset(setJobTitle)} clearable searchable w={220} />
        </Group>
        <Button onClick={() => setEditing(null)}>Add employee</Button>
      </Group>

      {error ? <Alert color="red" title="Couldn't load employees">{error.message}</Alert> : null}

      <Paper withBorder radius="md" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
        <Table.ScrollContainer minWidth={800}>
          <Table striped highlightOnHover verticalSpacing="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{sortLabel('name', 'Name')}</Table.Th>
                <Table.Th>Job title</Table.Th>
                <Table.Th>Department</Table.Th>
                <Table.Th>Country</Table.Th>
                <Table.Th>{sortLabel('hire_date', 'Hired')}</Table.Th>
                <Table.Th ta="right">{sortLabel('salary', 'Salary')}</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data?.data.map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td>
                    <Text fz="sm" fw={500}>{e.first_name} {e.last_name}</Text>
                    <Text fz="xs" c="dimmed">{e.email}</Text>
                  </Table.Td>
                  <Table.Td>{e.job_title}</Table.Td>
                  <Table.Td>{e.department}</Table.Td>
                  <Table.Td>{e.country}</Table.Td>
                  <Table.Td>{e.hire_date}</Table.Td>
                  <Table.Td ta="right" ff="monospace">{formatUSD(e.salary)}</Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <ActionIcon variant="subtle" aria-label={`Edit ${e.first_name} ${e.last_name}`} onClick={() => setEditing(e)}>✎</ActionIcon>
                      <ActionIcon variant="subtle" color="red" aria-label={`Delete ${e.first_name} ${e.last_name}`} onClick={() => setDeleting(e)}>✕</ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
              {data && data.data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text ta="center" c="dimmed" py="lg">No employees match these filters.</Text>
                  </Table.Td>
                </Table.Tr>
              ) : null}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {data ? (
        <Group justify="space-between">
          <Text fz="sm" c="dimmed">{formatCount(data.meta.total)} employees</Text>
          <Pagination value={page} onChange={setPage} total={data.meta.total_pages} siblings={1} />
        </Group>
      ) : null}

      <Modal opened={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit employee' : 'Add employee'} size="lg">
        <EmployeeForm key={editing?.id ?? 'new'} employee={editing} options={options} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>

      <Modal opened={deleting !== null} onClose={() => setDeleting(null)} title="Delete employee?">
        <Stack>
          <Text>
            This permanently removes <b>{deleting?.first_name} {deleting?.last_name}</b> and their salary record.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button color="red" onClick={confirmDelete}>Delete</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
