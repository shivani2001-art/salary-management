import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './styles.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './glass.css' // after App so it layers over page styles
import { cssVariablesResolver, theme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="auto">
      <Notifications position="bottom-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
)
