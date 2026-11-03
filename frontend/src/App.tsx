import { Alert, AppShell, Container, Group, Tabs, Text, Title } from '@mantine/core'
import { useState } from 'react'
import { api } from './api'
import { EmployeesPage } from './components/EmployeesPage'
import { InsightsPage } from './components/InsightsPage'
import { useApi } from './useApi'

const EMPTY_OPTIONS = { countries: [], departments: [], job_titles: [] }

export default function App() {
  // Bumped after any create/update/delete so filter options and insights stay current.
  const [dataVersion, setDataVersion] = useState(0)
  const options = useApi(() => api.filterOptions(), [dataVersion])
  const onDataChanged = () => setDataVersion((v) => v + 1)

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Title order={3}>ACME Salary Management</Title>
            <Text c="dimmed" fz="sm">All amounts are annual gross USD</Text>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">
          {options.error ? <Alert color="red" mb="md" title="Couldn't reach the server">{options.error.message}</Alert> : null}
          <Tabs defaultValue="employees" keepMounted={false}>
            <Tabs.List mb="md">
              <Tabs.Tab value="employees">Employees</Tabs.Tab>
              <Tabs.Tab value="insights">Insights</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="employees">
              <EmployeesPage options={options.data ?? EMPTY_OPTIONS} onDataChanged={onDataChanged} />
            </Tabs.Panel>
            <Tabs.Panel value="insights">
              <InsightsPage options={options.data ?? EMPTY_OPTIONS} refreshKey={dataVersion} />
            </Tabs.Panel>
          </Tabs>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
