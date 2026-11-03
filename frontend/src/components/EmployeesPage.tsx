import { ActionIcon, Alert, Button, Group, Pagination, Popover, Select, Skeleton, Text, TextInput, VisuallyHidden } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import { IconArrowDown, IconArrowUp, IconPencil, IconPlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react'
import { type CSSProperties, useCallback, useRef, useState } from 'react'
import { api, type Employee, type EmployeeInput, type FilterOptions, type ListParams } from '../api'
import { formatCount, formatUSD } from '../format'
import { vtName, withViewTransition } from '../motion'
import { useApi } from '../useApi'
import { EmployeeForm } from './EmployeeForm'
import './people.css'
import { SalaryCell } from './SalaryCell'
import { SidePanel } from './SidePanel'

type SortKey = NonNullable<ListParams['sort']>
const PER_PAGE = 25
const SKELETON_ROWS = Array.from({ length: 10 }, (_, i) => i)

const fullName = (e: Pick<Employee, 'first_name' | 'last_name'>) => `${e.first_name} ${e.last_name}`
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
/** Stable hue per department so avatars and dots group visually. */
const hueOf = (s: string) => ({ '--h': [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 17) }) as CSSProperties
/** withViewTransition as a promise, so follow-up work waits for the animation instead of interrupting it. */
const transition = (update: () => void) => new Promise<void>((resolve) => withViewTransition(update, resolve))

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
  // undefined = closed, null = adding, Employee = editing
  const [editing, setEditing] = useState<Employee | null | undefined>(undefined)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)
  const [flashId, setFlashId] = useState<number | null>(null)
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const trigger = useRef<HTMLElement | null>(null)

  const { data, error, loading, reload, mutate } = useApi(
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
    { animate: true },
  )

  const filtersActive = Boolean(search.trim() || country || department || jobTitle)
  const resultsFiltered = Boolean(debouncedSearch || country || department || jobTitle)

  // Any filter change sends the user back to page 1.
  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value)
      setPage(1)
    }

  const clearFilters = () => {
    setSearch('')
    setCountry(null)
    setDepartment(null)
    setJobTitle(null)
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

  const flash = (id: number) => {
    clearTimeout(flashTimer.current)
    setFlashId(id)
    flashTimer.current = setTimeout(() => setFlashId(null), 1400)
  }

  const patchRow = (id: number, changes: Partial<Employee>) =>
    mutate((d) => d && { ...d, data: d.data.map((e) => (e.id === id ? { ...e, ...changes } : e)) })

  // ---------- Side panel with a morph from/to its trigger ----------
  const openPanel = (employee: Employee | null, from: HTMLElement | null) => {
    trigger.current = from
    if (from) from.style.viewTransitionName = 'editor'
    withViewTransition(() => {
      if (from) from.style.viewTransitionName = ''
      setEditing(employee)
    })
  }

  const closePanel = useCallback(() => {
    const from = trigger.current
    return new Promise<void>((resolve) =>
      withViewTransition(
        () => {
          setEditing(undefined)
          if (from?.isConnected) from.style.viewTransitionName = 'editor'
        },
        () => {
          if (from) from.style.viewTransitionName = ''
          resolve()
        },
      ),
    )
  }, [])

  const save = async (values: EmployeeInput) => {
    const name = fullName(values)
    if (editing) await api.updateEmployee(editing.id, values)
    else await api.createEmployee(values)
    await closePanel()
    notifications.show({ color: 'teal', message: editing ? `Saved ${name}` : `Added ${name}` })
    reload()
    onDataChanged()
  }

  // ---------- Inline salary edit (optimistic) ----------
  const saveSalary = async (employee: Employee, salary: number) => {
    const name = fullName(employee)
    patchRow(employee.id, { salary })
    flash(employee.id)
    try {
      await api.updateEmployee(employee.id, { salary })
      notifications.show({ color: 'teal', message: `Saved ${name}'s salary: ${formatUSD(salary)}` })
      onDataChanged()
    } catch (err) {
      patchRow(employee.id, { salary: employee.salary })
      notifications.show({ color: 'red', message: `Couldn't save salary for ${name}: ${(err as Error).message}` })
    }
  }

  // ---------- Delete (optimistic) ----------
  const remove = async (employee: Employee) => {
    const name = fullName(employee)
    setConfirmingDelete(null)
    const removed = transition(() =>
      mutate(
        (d) =>
          d && {
            ...d,
            data: d.data.filter((e) => e.id !== employee.id),
            meta: { ...d.meta, total: d.meta.total - 1 },
          },
      ),
    )
    try {
      await api.deleteEmployee(employee.id)
      notifications.show({ color: 'teal', message: `Deleted ${name}` })
      onDataChanged()
    } catch (err) {
      notifications.show({ color: 'red', message: `Couldn't delete ${name}: ${(err as Error).message}` })
    }
    await removed
    reload() // refill the page (or restore the row on failure)
  }

  const sortTh = (key: SortKey, label: string, className?: string) => {
    const active = sort === key
    return (
      <th className={className} aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : undefined}>
        <button type="button" className="sort-btn" data-active={active || undefined} onClick={() => toggleSort(key)}>
          {label}
          {active ? direction === 'asc' ? <IconArrowUp size={13} stroke={2.4} /> : <IconArrowDown size={13} stroke={2.4} /> : null}
        </button>
      </th>
    )
  }

  const total = data?.meta.total ?? 0
  const first = total === 0 ? 0 : (page - 1) * PER_PAGE + 1
  const last = Math.min(total, first + (data?.data.length ?? 0) - 1)

  return (
    <div className="people-page">
      <header className="people-head">
        <div>
          <h1 className="page-title">People</h1>
          <p className="page-kicker" aria-live="polite">
            {data ? (
              <>
                <b className="num">{formatCount(total)}</b> {resultsFiltered ? 'match these filters' : 'on payroll'}
              </>
            ) : (
              ' '
            )}
          </p>
        </div>
        <Button size="md" leftSection={<IconPlus size={18} stroke={2.4} />} onClick={(e) => openPanel(null, e.currentTarget)}>
          Add employee
        </Button>
      </header>

      <div className="filters" role="search">
        <TextInput
          aria-label="Search people"
          placeholder="Search name, email or job title"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value)
            setPage(1)
          }}
        />
        <Select aria-label="Country" placeholder="All countries" data={options.countries} value={country} onChange={withPageReset(setCountry)} clearable searchable />
        <Select aria-label="Department" placeholder="All departments" data={options.departments} value={department} onChange={withPageReset(setDepartment)} clearable searchable />
        <Select aria-label="Job title" placeholder="All job titles" data={options.job_titles} value={jobTitle} onChange={withPageReset(setJobTitle)} clearable searchable />
        {filtersActive ? (
          <Button variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert color="red" title="Couldn't load people" mb="md">
          {error.message}
        </Alert>
      ) : null}

      {data && data.data.length === 0 ? (
        <div className="empty">
          {resultsFiltered ? (
            <>
              <h3>No one matches these filters</h3>
              <Text c="dimmed" mb="lg">
                Try a different name or loosen a filter to see more people.
              </Text>
              <Button variant="light" onClick={clearFilters}>
                Clear filters
              </Button>
            </>
          ) : (
            <>
              <h3>No one on payroll yet</h3>
              <Text c="dimmed">Add your first employee to get started.</Text>
            </>
          )}
        </div>
      ) : (
        <div className="people-scroll" data-busy={loading && data ? true : undefined} aria-busy={loading}>
          <table className="people">
            <thead>
              <tr>
                {sortTh('name', 'Name')}
                <th className="c-title">Job title</th>
                <th className="c-dept">Department</th>
                <th className="c-country">Country</th>
                {sortTh('hire_date', 'Hired')}
                {sortTh('salary', 'Salary', 'right')}
                <th className="c-actions">
                  <VisuallyHidden>Actions</VisuallyHidden>
                </th>
              </tr>
            </thead>
            <tbody>
              {data
                ? data.data.map((e) => {
                    const name = fullName(e)
                    const hue = hueOf(e.department)
                    return (
                      <tr
                        key={e.id}
                        className={flashId === e.id ? 'flash' : undefined}
                        style={{ viewTransitionName: vtName('emp', e.id) }}
                      >
                        <td className="c-who">
                          <div className="who">
                            <span className="avatar" style={hue} aria-hidden>
                              {e.first_name[0]}
                              {e.last_name[0]}
                            </span>
                            <div className="who-text">
                              <div className="who-name">{name}</div>
                              <div className="who-email">{e.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="c-title">{e.job_title}</td>
                        <td className="c-dept">
                          <span className="dept" style={hue}>
                            {e.department}
                          </span>
                        </td>
                        <td className="c-country">{e.country}</td>
                        <td className="c-hired num">{monthYear.format(new Date(e.hire_date))}</td>
                        <td className="c-salary right">
                          <SalaryCell value={e.salary} name={name} onSave={(salary) => saveSalary(e, salary)} />
                        </td>
                        <td className="c-actions">
                          <Group className="row-actions" gap={2} justify="flex-end" wrap="nowrap">
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              aria-label={`Edit ${name}`}
                              onClick={(ev) => openPanel(e, ev.currentTarget.closest('tr')?.querySelector<HTMLElement>('.who') ?? null)}
                            >
                              <IconPencil size={17} />
                            </ActionIcon>
                            <Popover
                              opened={confirmingDelete === e.id}
                              onChange={(o) => !o && setConfirmingDelete(null)}
                              position="bottom-end"
                              shadow="md"
                              radius="lg"
                              width={260}
                              trapFocus
                              returnFocus
                            >
                              <Popover.Target>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  aria-label={`Delete ${name}`}
                                  onClick={() => setConfirmingDelete(confirmingDelete === e.id ? null : e.id)}
                                >
                                  <IconTrash size={17} />
                                </ActionIcon>
                              </Popover.Target>
                              <Popover.Dropdown>
                                <Text fw={700} fz="sm">
                                  Delete {name}?
                                </Text>
                                <Text fz="sm" c="dimmed" mt={2}>
                                  This removes their salary record.
                                </Text>
                                <Group gap="xs" mt="md" justify="flex-end">
                                  <Button size="xs" variant="default" onClick={() => setConfirmingDelete(null)}>
                                    Cancel
                                  </Button>
                                  <Button size="xs" color="red" onClick={() => remove(e)}>
                                    Delete
                                  </Button>
                                </Group>
                              </Popover.Dropdown>
                            </Popover>
                          </Group>
                        </td>
                      </tr>
                    )
                  })
                : SKELETON_ROWS.map((i) => (
                    <tr key={i} aria-hidden>
                      <td className="c-who">
                        <div className="who">
                          <Skeleton circle height={34} />
                          <div className="who-text">
                            <Skeleton height={10} width={120} mb={6} />
                            <Skeleton height={8} width={160} />
                          </div>
                        </div>
                      </td>
                      <td className="c-title"><Skeleton height={10} width={110} /></td>
                      <td className="c-dept"><Skeleton height={10} width={90} /></td>
                      <td className="c-country"><Skeleton height={10} width={70} /></td>
                      <td className="c-hired"><Skeleton height={10} width={60} /></td>
                      <td className="c-salary right"><Skeleton height={12} width={80} ml="auto" /></td>
                      <td className="c-actions" />
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      )}

      {data && total > 0 ? (
        <div className="people-foot">
          <Text fz="sm" c="dimmed" className="num">
            Showing {formatCount(first)}–{formatCount(last)} of {formatCount(total)}
          </Text>
          {data.meta.total_pages > 1 ? (
            <Pagination value={page} onChange={setPage} total={data.meta.total_pages} siblings={1} size="sm" />
          ) : null}
        </div>
      ) : null}

      <SidePanel
        opened={editing !== undefined}
        kicker={editing ? 'Edit employee' : undefined}
        title={editing ? fullName(editing) : 'Add employee'}
        onClose={closePanel}
      >
        <EmployeeForm key={editing?.id ?? 'new'} employee={editing} options={options} onSubmit={save} onCancel={closePanel} />
      </SidePanel>
    </div>
  )
}
