import { describe, expect, it } from 'vitest'
import { openState, ligneDuJour, etatExposition, heure } from '../jacmel'

// Octobre 2026 : Jacmel est à UTC−4. Le 12 est un lundi.
const at = (d: number, h: number, m = 0) => Date.UTC(2026, 9, d, h + 4, m)

describe('horaires de la maison', () => {
  it('fermé le lundi, rouvre mardi', () => {
    const s = openState(at(12, 12))
    expect(s.open).toBe(false)
    expect(s.label).toBe('Fermé · rouvre demain, 10\u00A0h')
  })
  it('mardi avant 10 h : ouvre à 10 h', () => {
    expect(openState(at(13, 9, 59)).label).toBe('Fermé · ouvre à 10\u00A0h')
  })
  it('mardi 10 h : ouvert jusqu’à 18 h', () => {
    const s = openState(at(13, 10))
    expect(s.open).toBe(true)
    expect(s.label).toBe('Ouvert · jusqu’à 18\u00A0h')
  })
  it('vendredi 18 h : fermé, rouvre demain', () => {
    expect(openState(at(16, 18)).label).toBe('Fermé · rouvre demain, 10\u00A0h')
  })
  it('samedi 18 h 30 : encore ouvert jusqu’à 19 h', () => {
    expect(openState(at(17, 18, 30)).label).toBe('Ouvert · jusqu’à 19\u00A0h')
  })
  it('dimanche 16 h : fermé, rouvre mardi', () => {
    expect(openState(at(18, 16)).label).toBe('Fermé · rouvre mardi, 10\u00A0h')
  })
  it('ligne du jour dans le tableau', () => {
    expect(ligneDuJour(at(13, 12))).toBe(0)
    expect(ligneDuJour(at(17, 12))).toBe(1)
    expect(ligneDuJour(at(18, 12))).toBe(2)
    expect(ligneDuJour(at(12, 12))).toBe(3)
  })
  it('heure au format français', () => {
    expect(heure(at(13, 9, 5))).toBe('9\u00A0h\u00A005')
  })
  it('état de l’exposition', () => {
    expect(etatExposition(at(8, 12), '2026-10-12', '2026-11-30')).toBe('à venir')
    expect(etatExposition(at(12, 12), '2026-10-12', '2026-11-30')).toBe('en cours')
    expect(etatExposition(Date.UTC(2026, 11, 1, 17), '2026-10-12', '2026-11-30')).toBe('terminée')
  })
})
