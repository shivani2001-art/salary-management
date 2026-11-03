import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, type Employee } from '../api'
import { renderWithMantine } from '../test/render'
import { EmployeeForm } from './EmployeeForm'

const options = { countries: ['India'], departments: ['Engineering'], job_titles: ['Software Engineer'] }
const employee: Employee = {
  id: 7,
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@acme.example',
  job_title: 'Software Engineer',
  department: 'Engineering',
  country: 'India',
  salary: 50000,
  hire_date: '2020-01-15',
}

function setup(props: Partial<Parameters<typeof EmployeeForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  renderWithMantine(<EmployeeForm options={options} onSubmit={onSubmit} onCancel={() => {}} {...props} />)
  return { onSubmit, user: userEvent.setup() }
}

describe('EmployeeForm', () => {
  it('blocks submission and explains what is missing', async () => {
    const { onSubmit, user } = setup()

    await user.click(screen.getByRole('button', { name: 'Add employee' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.getByText(/Enter a whole amount/)).toBeInTheDocument()
  })

  it('submits the edited salary as a number', async () => {
    const { onSubmit, user } = setup({ employee })
    const salary = screen.getByLabelText(/Annual salary/)

    await user.clear(salary)
    await user.type(salary, '65000')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ email: 'ada@acme.example', salary: 65000 })
  })

  it('shows server-side field errors next to the field', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(422, 'Invalid', { email: ['Email has already been taken'] }))
    const { user } = setup({ employee, onSubmit })

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Email has already been taken')).toBeInTheDocument()
  })

  it('shows unexpected server errors at the top of the form', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(500, 'Request failed (500)'))
    const { user } = setup({ employee, onSubmit })

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Request failed (500)')).toBeInTheDocument()
  })
})
