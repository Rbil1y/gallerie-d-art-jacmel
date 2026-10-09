// Position du soleil au-dessus de Jacmel (algorithme NOAA simplifié, ±0,01°).
// Toutes les heures sont des timestamps UTC en millisecondes.

export const JACMEL = { lat: 18.2342, lon: -72.5347 }

const RAD = Math.PI / 180
const DEG = 180 / Math.PI
const DAY = 86_400_000

export type SunPosition = {
  /** hauteur au-dessus de l’horizon, en degrés */
  elevation: number
  /** azimut depuis le nord, sens horaire, en degrés */
  azimuth: number
}

export type SunTimes = { sunrise: number; noon: number; sunset: number }

function julianCentury(ms: number) {
  return (ms / DAY + 2440587.5 - 2451545) / 36525
}

function solar(T: number) {
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)
  const C =
    Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * RAD) * 0.000289
  const omega = 125.04 - 1934.136 * T
  const appLong = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * RAD)
  const obliq0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60
  const obliq = obliq0 + 0.00256 * Math.cos(omega * RAD)
  const decl = Math.asin(Math.sin(obliq * RAD) * Math.sin(appLong * RAD)) * DEG
  const y = Math.tan((obliq / 2) * RAD) ** 2
  const eqTime =
    4 * DEG *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD))
  return { decl, eqTime }
}

export function sunPosition(ms: number, lat = JACMEL.lat, lon = JACMEL.lon): SunPosition {
  const { decl, eqTime } = solar(julianCentury(ms))
  const minutes = (((ms % DAY) + DAY) % DAY) / 60_000
  const tst = (((minutes + eqTime + 4 * lon) % 1440) + 1440) % 1440
  const ha = tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180
  const cosZ =
    Math.sin(lat * RAD) * Math.sin(decl * RAD) +
    Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(ha * RAD)
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZ))) * DEG
  const sinZ = Math.max(1e-9, Math.sin(zenith * RAD))
  const cosAz = (Math.sin(lat * RAD) * Math.cos(zenith * RAD) - Math.sin(decl * RAD)) / (Math.cos(lat * RAD) * sinZ)
  const az0 = Math.acos(Math.min(1, Math.max(-1, cosAz))) * DEG
  const azimuth = ha > 0 ? (az0 + 180) % 360 : (540 - az0) % 360
  return { elevation: 90 - zenith, azimuth }
}

/**
 * Lever, midi solaire et coucher pour le jour civil (UTC) qui contient `dayUtc`.
 * Passer minuit UTC du jour local voulu : Date.UTC(a, m, j).
 */
export function sunTimes(dayUtc: number, lat = JACMEL.lat, lon = JACMEL.lon): SunTimes {
  const base = Math.floor(dayUtc / DAY) * DAY
  let noonMin = 720 - 4 * lon
  let decl = 0
  for (let i = 0; i < 2; i++) {
    const s = solar(julianCentury(base + noonMin * 60_000))
    noonMin = 720 - 4 * lon - s.eqTime
    decl = s.decl
  }
  const cosH =
    Math.cos(90.833 * RAD) / (Math.cos(lat * RAD) * Math.cos(decl * RAD)) -
    Math.tan(lat * RAD) * Math.tan(decl * RAD)
  const H = Math.acos(Math.min(1, Math.max(-1, cosH))) * DEG
  return {
    sunrise: base + (noonMin - 4 * H) * 60_000,
    noon: base + noonMin * 60_000,
    sunset: base + (noonMin + 4 * H) * 60_000,
  }
}

/** Phase de la lune : 0 = nouvelle, 0,5 = pleine. */
export function moonPhase(ms: number) {
  const days = ms / DAY + 2440587.5 - 2451550.1
  return (((days / 29.530588853) % 1) + 1) % 1
}
