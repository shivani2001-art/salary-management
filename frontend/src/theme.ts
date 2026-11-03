import {
  ActionIcon,
  Autocomplete,
  Button,
  type CSSVariablesResolver,
  createTheme,
  NumberInput,
  Pagination,
  SegmentedControl,
  Select,
  TextInput,
} from '@mantine/core'

const display = '"Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif'

export const theme = createTheme({
  primaryColor: 'pine',
  primaryShade: { light: 8, dark: 4 },
  colors: {
    pine: ['#e9f6ef', '#d2ebdf', '#a3d6bf', '#71c09d', '#49ad81', '#31a06f', '#239965', '#148454', '#0a7449', '#00643c'],
    // Mantine's "dark" scale drives dark-mode surfaces; tinted toward pine so dark mode isn't flat gray.
    dark: ['#d7e0db', '#b1bdb6', '#86948c', '#5f6d66', '#3b4742', '#28332e', '#1c2622', '#141c18', '#0f1612', '#0a0f0c'],
  },
  fontFamily: '"Instrument Sans", system-ui, sans-serif',
  headings: { fontFamily: display, fontWeight: '700' },
  defaultRadius: 'md',
  cursorType: 'pointer',
  components: {
    Button: Button.extend({ defaultProps: { radius: 'xl' } }),
    ActionIcon: ActionIcon.extend({ defaultProps: { radius: 'xl' } }),
    TextInput: TextInput.extend({ defaultProps: { radius: 'xl' } }),
    Select: Select.extend({ defaultProps: { radius: 'xl' } }),
    Autocomplete: Autocomplete.extend({ defaultProps: { radius: 'xl' } }),
    NumberInput: NumberInput.extend({ defaultProps: { radius: 'xl' } }),
    SegmentedControl: SegmentedControl.extend({ defaultProps: { radius: 'xl' } }),
    Pagination: Pagination.extend({ defaultProps: { radius: 'xl' } }),
  },
})

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--mantine-color-body': '#f5f8f4',
    '--mantine-color-text': '#13201a',
    '--mantine-color-dimmed': '#55665d',
    '--mantine-color-default-border': '#d9e2dc',
  },
  dark: {
    '--mantine-color-body': '#0f1612',
    '--mantine-color-text': '#e6eee8',
    '--mantine-color-dimmed': '#98a9a0',
    '--mantine-color-default-border': '#26332d',
  },
})
