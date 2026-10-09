import { describe, expect, it } from 'vitest'
import { sunPosition, sunTimes, moonPhase } from '../sun'
import { soleilDuJour, heure } from '../jacmel'

const MIN = 60_000

describe('soleil sur Jacmel', () => {
  it('lever et coucher du 15 octobre 2026 (référence : 6 h 43 / 18 h 27 EDT)', () => {
    const t = sunTimes(Date.UTC(2026, 9, 15))
    expect(Math.abs(t.sunrise - Date.UTC(2026, 9, 15, 10, 43)) / MIN).toBeLessThan(3)
    expect(Math.abs(t.sunset - Date.UTC(2026, 9, 15, 22, 27)) / MIN).toBeLessThan(3)
    expect(heure(t.sunrise)).toBe('6\u00A0h\u00A043')
  })

  it('le soleil est haut à midi solaire et sous l’horizon à minuit', () => {
    const { noon } = sunTimes(Date.UTC(2026, 9, 15))
    expect(sunPosition(noon).elevation).toBeGreaterThan(60)
    expect(sunPosition(noon + 12 * 60 * MIN).elevation).toBeLessThan(-40)
  })

  it('le matin à l’est, l’après-midi à l’ouest', () => {
    const { noon } = sunTimes(Date.UTC(2026, 9, 15))
    const matin = sunPosition(noon - 4 * 60 * MIN).azimuth
    const soir = sunPosition(noon + 4 * 60 * MIN).azimuth
    expect(matin).toBeGreaterThan(60)
    expect(matin).toBeLessThan(180)
    expect(soir).toBeGreaterThan(180)
    expect(soir).toBeLessThan(300)
  })

  it('soleilDuJour suit le jour civil de Jacmel, pas celui d’UTC', () => {
    // 23 h 30 à Jacmel le 15 = 03 h 30 UTC le 16
    const tard = Date.UTC(2026, 9, 16, 3, 30)
    expect(soleilDuJour(tard).sunrise).toBe(sunTimes(Date.UTC(2026, 9, 15)).sunrise)
  })

  it('phase de lune dans [0, 1[', () => {
    const p = moonPhase(Date.UTC(2026, 9, 8))
    expect(p).toBeGreaterThanOrEqual(0)
    expect(p).toBeLessThan(1)
    // pleine lune connue : 26 octobre 2026 vers 04 h UTC
    expect(Math.abs(moonPhase(Date.UTC(2026, 9, 26, 4)) - 0.5)).toBeLessThan(0.04)
  })
})
