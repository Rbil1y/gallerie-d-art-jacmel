// localStorage / sessionStorage peuvent être absents ou refusés (navigation privée) : on ne casse jamais.

export function lire<T>(cle: string, defaut: T, store: 'local' | 'session' = 'local'): T {
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage
    const v = s.getItem(cle)
    return v === null ? defaut : (JSON.parse(v) as T)
  } catch {
    return defaut
  }
}

export function ecrire(cle: string, valeur: unknown, store: 'local' | 'session' = 'local') {
  try {
    const s = store === 'local' ? window.localStorage : window.sessionStorage
    s.setItem(cle, JSON.stringify(valeur))
  } catch {
    /* stockage indisponible : la valeur vit seulement en mémoire */
  }
}
