import { Alert, Box, Container, Group, Tabs, Text } from '@mantine/core'
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
    <Tabs defaultValue="insights" keepMounted={false} variant="pills">
      <Box component="header" className="appbar" pos="sticky" top={0} style={{ zIndex: 100 }}>
        <Container size="xl" py={10}>
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <div className="wordmark" aria-label="ACME Pay">
              <i aria-hidden />
              ACME<span>Pay</span>
            </div>
            <Tabs.List className="nav-list">
              <Tabs.Tab value="insights" className="nav-tab">Insights</Tabs.Tab>
              <Tabs.Tab value="employees" className="nav-tab">People</Tabs.Tab>
            </Tabs.List>
            <Text c="dimmed" fz="xs" visibleFrom="md">Annual gross · USD</Text>
          </Group>
        </Container>
      </Box>
      <Container size="xl" component="main" py={{ base: 'lg', sm: 40 }}>
        {options.error ? (
          <Alert color="red" mb="md" title="Can't reach the server">
            {options.error.message}. Check that the API is running, then reload.
          </Alert>
        ) : null}
        <Tabs.Panel value="insights">
          <InsightsPage options={options.data ?? EMPTY_OPTIONS} refreshKey={dataVersion} />
        </Tabs.Panel>
        <Tabs.Panel value="employees">
          <EmployeesPage options={options.data ?? EMPTY_OPTIONS} onDataChanged={onDataChanged} />
        </Tabs.Panel>
      </Container>
    </Tabs>
  )
}
