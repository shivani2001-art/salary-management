import { Alert, Autocomplete, Button, Group, NumberInput, SimpleGrid, Stack, TextInput } from '@mantine/core'
import { isEmail, isNotEmpty, useForm } from '@mantine/form'
import { useState } from 'react'
import { ApiError, type Employee, type EmployeeInput, type FilterOptions } from '../api'

export const MAX_SALARY = 10_000_000 // mirrors Employee::MAX_SALARY on the server

interface Props {
  employee?: Employee | null
  options: FilterOptions
  onSubmit: (values: EmployeeInput) => Promise<unknown>
  onCancel: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function EmployeeForm({ employee, options, onSubmit, onCancel }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<Omit<EmployeeInput, 'salary'> & { salary: number | string }>({
    initialValues: {
      first_name: employee?.first_name ?? '',
      last_name: employee?.last_name ?? '',
      email: employee?.email ?? '',
      job_title: employee?.job_title ?? '',
      department: employee?.department ?? '',
      country: employee?.country ?? '',
      salary: employee?.salary ?? '',
      hire_date: employee?.hire_date ?? '',
    },
    validate: {
      first_name: isNotEmpty('First name is required'),
      last_name: isNotEmpty('Last name is required'),
      email: isEmail('Enter a valid email'),
      job_title: isNotEmpty('Job title is required'),
      department: isNotEmpty('Department is required'),
      country: isNotEmpty('Country is required'),
      salary: (value) =>
        typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= MAX_SALARY
          ? null
          : `Enter a whole amount between $1 and $${MAX_SALARY.toLocaleString('en-US')}`,
      hire_date: (value) => (!value ? 'Hire date is required' : value > today() ? "Can't be in the future" : null),
    },
  })

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true)
    setFormError(null)
    try {
      await onSubmit({ ...values, salary: Number(values.salary) })
    } catch (error) {
      // Server validation (e.g. duplicate email) lands on the matching field.
      if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
        form.setErrors(Object.fromEntries(Object.entries(error.fieldErrors).map(([k, msgs]) => [k, msgs.join(', ')])))
      } else {
        setFormError((error as Error).message)
      }
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack>
        {formError ? <Alert color="red">{formError}</Alert> : null}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="First name" withAsterisk {...form.getInputProps('first_name')} />
          <TextInput label="Last name" withAsterisk {...form.getInputProps('last_name')} />
        </SimpleGrid>
        <TextInput label="Email" type="email" withAsterisk {...form.getInputProps('email')} />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Autocomplete
            label="Job title"
            withAsterisk
            data={options.job_titles}
            {...form.getInputProps('job_title')}
          />
          <Autocomplete
            label="Department"
            withAsterisk
            data={options.departments}
            {...form.getInputProps('department')}
          />
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Autocomplete label="Country" withAsterisk data={options.countries} {...form.getInputProps('country')} />
          <TextInput label="Hire date" type="date" max={today()} withAsterisk {...form.getInputProps('hire_date')} />
        </SimpleGrid>
        <NumberInput
          label="Annual salary (USD)"
          withAsterisk
          prefix="$"
          thousandSeparator=","
          allowDecimal={false}
          allowNegative={false}
          min={1}
          max={MAX_SALARY}
          {...form.getInputProps('salary')}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {employee ? 'Save changes' : 'Add employee'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
