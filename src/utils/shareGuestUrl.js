/**
 * Public guest lyrics route (must match `router` path for `/guest/:emitCode`).
 */
export const GUEST_WORDS_ROUTE_PREFIX = '/home'

/**
 * @returns {string} App base path without trailing slash, e.g. `''` or `'/subdir'`.
 */
export function appBasePath() {
  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return ''
  return base.replace(/\/$/, '')
}

/**
 * Absolute URL to the guest lyrics page for the given emit code.
 * @param {string | number | null | undefined} emitCode
 * @returns {string} Empty string if `emitCode` is missing.
 */
export function buildGuestWordsShareUrl(emitCode) {
  const code = String(emitCode ?? '').trim()
  if (!code) return ''
  const configured = (import.meta.env.VITE_SHARE_APP_ORIGIN || '').trim()
  const origin =
    configured ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '')
  if (!origin) return ''
  const base = appBasePath()
  const path = `${GUEST_WORDS_ROUTE_PREFIX}?emitCode=${encodeURIComponent(code)}`
  const originClean = origin.replace(/\/$/, '')
  if (!base) return `${originClean}${path}`
  return `${originClean}${base}${path}`
}
