export interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  job_title: string
  department: string
  country: string
  salary: number
  hire_date: string
}

export type EmployeeInput = Omit<Employee, 'id'>

export interface Page<T> {
  data: T[]
  meta: { page: number; per_page: number; total: number; total_pages: number }
}

export interface FilterOptions {
  countries: string[]
  departments: string[]
  job_titles: string[]
}

export interface Filters {
  country?: string | null
  department?: string | null
  job_title?: string | null
}

export interface ListParams extends Filters {
  q?: string
  sort?: 'name' | 'salary' | 'hire_date'
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface Summary {
  headcount: number
  total_payroll: number
  average_salary: number | null
  median_salary: number | null
}

export type GroupBy = 'country' | 'department' | 'job_title'

export interface BreakdownRow {
  name: string
  headcount: number
  min_salary: number
  max_salary: number
  average_salary: number
  median_salary: number
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/** Drops empty values so the URL only carries filters the user actually set. */
export function toQuery(params: object): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init.headers },
  })
  if (response.status === 204) return undefined as T

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(response.status, body.error ?? `Request failed (${response.status})`, body.errors)
  }
  return body as T
}

export const api = {
  listEmployees: (params: ListParams) => request<Page<Employee>>(`/employees${toQuery(params)}`),
  filterOptions: () => request<FilterOptions>('/employees/filter_options'),
  createEmployee: (employee: EmployeeInput) =>
    request<Employee>('/employees', { method: 'POST', body: JSON.stringify({ employee }) }),
  updateEmployee: (id: number, employee: EmployeeInput) =>
    request<Employee>(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify({ employee }) }),
  deleteEmployee: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),
  summary: (filters: Filters) => request<Summary>(`/insights/summary${toQuery(filters)}`),
  breakdown: (groupBy: GroupBy, filters: Filters) =>
    request<BreakdownRow[]>(`/insights/breakdown${toQuery({ group_by: groupBy, ...filters })}`),
}
