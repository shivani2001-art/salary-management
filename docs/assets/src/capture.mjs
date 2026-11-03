// Regenerates the README images: banner, screenshots (light/dark, desktop/phone) and the demo GIF.
//   APP_URL=http://localhost:3100 PLAYWRIGHT=/path/to/playwright node docs/assets/src/capture.mjs
// Needs Playwright, Google Chrome and ffmpeg. The demo edits one salary and restores it by id afterwards.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const { chromium } = await import(process.env.PLAYWRIGHT ? pathToFileURL(join(process.env.PLAYWRIGHT, 'index.mjs')).href : 'playwright')
const APP = process.env.APP_URL ?? 'http://localhost:3100'
const here = dirname(fileURLToPath(import.meta.url))
const out = join(here, '..')
const shots = join(out, 'screenshots')
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'], // the banner masks a local SVG
})

async function page(options) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, ...options })
  return [context, await context.newPage()]
}

const settle = (p, ms = 900) => p.waitForTimeout(ms)
const openTab = async (p, name) => {
  await p.getByRole('tab', { name }).click()
  await settle(p, 300)
}
const waitPeople = (p) => p.locator('.who-name').first().waitFor()
const waitBands = async (p) => {
  await p.locator('.band').first().waitFor()
  await settle(p, 1600) // let the bands draw in and the headline numbers finish counting
}
const pickCountry = async (p, country) => {
  await p.locator('.q-country input').click()
  await p.getByRole('option', { name: country, exact: true }).click()
  await waitBands(p)
}
const snap = (p, name) => p.screenshot({ path: join(shots, `${name}.jpg`), type: 'jpeg', quality: 88 })

// ---------- Banner ----------
for (const theme of ['light', 'dark']) {
  const [ctx, p] = await page({ viewport: { width: 1600, height: 600 } })
  await p.goto(`${pathToFileURL(join(here, 'banner.html')).href}?theme=${theme}`)
  await p.evaluate(() => document.fonts.ready)
  await settle(p, 400)
  await p.screenshot({ path: join(out, `banner-${theme}.png`), omitBackground: true })
  await ctx.close()
}

// ---------- Desktop screenshots ----------
for (const theme of ['light', 'dark']) {
  const [ctx, p] = await page({ colorScheme: theme })
  await p.goto(APP)
  await waitPeople(p)
  await settle(p)
  await snap(p, `people-${theme}`)

  await openTab(p, 'Insights')
  await waitBands(p)
  await snap(p, `insights-${theme}`)

  await pickCountry(p, 'India')
  await snap(p, `insights-india-${theme}`)
  await ctx.close()
}

{
  const [ctx, p] = await page({ colorScheme: 'light' })
  await p.goto(APP)
  await waitPeople(p)
  // A set filter, to show the filter tiles' active state
  await p.getByLabel('Department').click()
  await p.getByRole('option', { name: 'Engineering', exact: true }).click()
  await settle(p)
  await snap(p, 'filters-light')

  await p.locator('tbody tr').first().hover()
  await p.getByRole('button', { name: /^Edit (?!salary)/ }).first().click()
  await settle(p, 700)
  await snap(p, 'edit-panel-light')
  await ctx.close()
}

// ---------- Phone screenshots ----------
for (const theme of ['light', 'dark']) {
  const [ctx, p] = await page({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: theme })
  await p.goto(APP)
  await waitPeople(p)
  await settle(p)
  await snap(p, `phone-people-${theme}`)
  await openTab(p, 'Insights')
  await waitBands(p)
  await snap(p, `phone-insights-${theme}`)
  await ctx.close()
}

// ---------- Demo GIF ----------
const videoDir = join(here, '.video')
rmSync(videoDir, { recursive: true, force: true })
// Playwright's bundled headless Chromium records full-height frames (system Chrome pads them with a grey strip).
const recorder = await chromium.launch().catch(() => browser)
{
  const ctx = await recorder.newContext({
    viewport: { width: 1280, height: 760 },
    colorScheme: 'light',
    recordVideo: { dir: videoDir, size: { width: 1280, height: 760 } },
  })
  const p = await ctx.newPage()
  await p.goto(APP)
  await waitPeople(p)
  await settle(p, 1200)

  await p.getByPlaceholder('Search name, email or job title').pressSequentially('engineer', { delay: 90 })
  await settle(p, 900)
  await p.getByRole('button', { name: /Salary/ }).first().click() // sort by salary, highest first
  await settle(p, 1300)

  // Click-to-edit the top salary. Remember exactly who it was (by id) so the restore can't hit anyone else.
  const target = (await (await fetch(`${APP}/api/employees?q=engineer&sort=salary&direction=desc&per_page=1`)).json()).data[0]
  try {
    await p.locator('.salary-btn').first().click()
    await p.keyboard.press('ControlOrMeta+a')
    await p.keyboard.type(String(target.salary + 11500), { delay: 110 })
    await p.keyboard.press('Enter')
    await settle(p, 1800)

    await openTab(p, 'Insights')
    await waitBands(p)
    await settle(p, 600)
    await pickCountry(p, 'India')
    await settle(p, 1200)
    await p.getByText('Department', { exact: true }).click()
    await settle(p, 2000)
  } finally {
    await fetch(`${APP}/api/employees/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee: { salary: target.salary } }),
    })
  }
  await ctx.close()
}
if (recorder !== browser) await recorder.close()
await browser.close()

const webm = join(videoDir, readdirSync(videoDir).find((f) => f.endsWith('.webm')))
const palette = join(videoDir, 'palette.png')
const filters = 'fps=8,scale=720:-1:flags=lanczos'
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-vf', `${filters},palettegen=stats_mode=diff`, palette])
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-i', palette, '-lavfi', `${filters} [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, join(out, 'demo.gif')])
rmSync(videoDir, { recursive: true, force: true })
console.log('Captured banner, screenshots and demo.gif into', out)
