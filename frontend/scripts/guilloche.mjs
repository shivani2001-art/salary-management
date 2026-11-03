// Generates src/assets/guilloche.svg: a banknote-style engraved rosette used as the page backdrop.
// Each band is K phase-shifted copies of r(θ) = R + A·sin(nθ + φk) + B·sin(mθ), which weave into a braid.
import { writeFileSync } from 'node:fs'

const SIZE = 1000
const C = SIZE / 2

const bands = [
  { R: 400, A: 34, n: 24, B: 16, m: 8, K: 8 },
  { R: 290, A: 30, n: 18, B: 12, m: 6, K: 7 },
  { R: 185, A: 24, n: 12, B: 9, m: 4, K: 6 },
  { R: 95, A: 26, n: 8, B: 0, m: 0, K: 6 },
]

const paths = bands.flatMap(({ R, A, n, B, m, K }) =>
  Array.from({ length: K }, (_, k) => {
    const phase = (2 * Math.PI * k) / K
    const steps = n * 12 // ~12 points per wave keeps curves smooth without bloating the file
    let d = ''
    for (let i = 0; i <= steps; i++) {
      const t = (2 * Math.PI * i) / steps
      const r = R + A * Math.sin(n * t + phase) + B * Math.sin(m * t)
      d += `${i ? 'L' : 'M'}${Math.round(C + r * Math.cos(t))} ${Math.round(C + r * Math.sin(t))}`
    }
    return `<path d="${d}Z"/>`
  }),
)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" fill="none" stroke="#000" stroke-width="1.3">${paths.join('')}</svg>\n`
writeFileSync(new URL('../src/assets/guilloche.svg', import.meta.url), svg)
console.log(`guilloche.svg: ${paths.length} paths, ${(svg.length / 1024).toFixed(1)} KB`)
