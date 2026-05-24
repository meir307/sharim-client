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
 * Guest event link: `https://[domain]/guest?ev=[sharingCode]`
 * @param {string | number | null | undefined} sharingCode
 */
export function buildGuestEventQueryUrl(sharingCode) {
  const code = String(sharingCode ?? '').trim()
  if (!code) return ''
  return absoluteGuestPath(`/guest?ev=${encodeURIComponent(code)}`)
}

const GUEST_SHARE_MESSAGE_TEMPLATE = `שלום!

ברוכים הבאים ל {eventName}
הקישור המצורף מאפשר שיתוף ומעורבות של הקהל בהכנות ובמהלך האירוע עצמו.

שמרו את הקישור — וכנסו אליו במהלך האירוע:
{link}

לפרטים נוספים - כנסו עכשיו
נשמח לראותכם!`

/**
 * Share text for guests: welcome + explanation + link.
 * @param {string} guestUrl
 * @param {string} [eventName]
 */
export function buildGuestShareMessage(guestUrl, eventName = '') {
  const link = String(guestUrl ?? '').trim()
  if (!link) return ''
  const name = String(eventName ?? '').trim() || 'אירוע'
  return GUEST_SHARE_MESSAGE_TEMPLATE.replaceAll('{eventName}', name).replace('{link}', link)
}
