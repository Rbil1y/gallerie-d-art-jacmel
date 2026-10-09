import { describe, expect, it } from 'vitest'
import { fr, prix, dimensions, numero, pluriel } from '../fr'

describe('typographie française', () => {
  it('espaces fines et apostrophes', () => {
    expect(fr("C'est « Terre / Mer » : vraiment ?")).toBe('C’est «\u202FTerre / Mer\u202F»\u00A0: vraiment\u202F?')
  })
  it('prix', () => {
    expect(prix(4200)).toBe('4\u202F200\u00A0$')
    expect(prix(850)).toBe('850\u00A0$')
  })
  it('dimensions, numéro, pluriel', () => {
    expect(dimensions(120, 140)).toBe('120\u00A0×\u00A0140\u00A0cm')
    expect(numero('004')).toBe('n°\u00A0004')
    expect(pluriel(1, 'œuvre')).toBe('1\u00A0œuvre')
    expect(pluriel(3, 'œuvre')).toBe('3\u00A0œuvres')
  })
})
