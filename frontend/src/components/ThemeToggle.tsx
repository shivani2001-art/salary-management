import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

/** Light/dark switch. Starts from the OS setting; Mantine persists the choice in localStorage. */
export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const current = useComputedColorScheme('light', { getInitialValueInEffect: false })
  const next = current === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} mode`

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        className="theme-toggle"
        variant="default"
        size="lg"
        aria-label={label}
        onClick={() => setColorScheme(next)}
      >
        {current === 'dark' ? <IconSun size={18} stroke={1.8} /> : <IconMoon size={18} stroke={1.8} />}
      </ActionIcon>
    </Tooltip>
  )
}
