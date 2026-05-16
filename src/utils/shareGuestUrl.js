/**
 * Guest share URLs (must match `router` paths).
 */

function appBasePath() {
  const base = import.meta.env.BASE_URL || '/'
  if (base === '/') return ''
  return base.replace(/\/$/, '')
}

function shareOrigin() {
  const configured = (import.meta.env.VITE_SHARE_APP_ORIGIN || '').trim()
  return (
    configured ||
    (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '')
  )
}

function absoluteGuestPath(path) {
  const origin = shareOrigin()
  if (!origin) return ''
  const base = appBasePath()
  const originClean = origin.replace(/\/$/, '')
  if (!base) return `${originClean}${path}`
  return `${originClean}${base}${path}`
}

/**
 * Absolute URL to the guest lyrics page for the given emit code.
 * @param {string | number | null | undefined} emitCode
 */
export function buildGuestWordsShareUrl(emitCode) {
  const code = String(emitCode ?? '').trim()
  if (!code) return ''
  return absoluteGuestPath(`/guest/${encodeURIComponent(code)}`)
}

/**
 * Absolute URL to the unified guest event page.
 * @param {string | number | null | undefined} shareCode
 */
export function buildGuestEventShareUrl(shareCode) {
  const code = String(shareCode ?? '').trim()
  if (!code) return ''
  return absoluteGuestPath(`/guest/event/${encodeURIComponent(code)}`)
}
