/**
 * Guest-facing broadcast modes. One link; the host picks what guests see.
 * Static scenarios (pre-show, break, thanks, ended, QR hint, custom MC line) all use `landing`
 * with different copy from event / landing-page settings — no extra modes needed.
 */
export const EVENT_BROADCAST_MODES = [
  {
    value: 'landing',
    label: 'דף נחיתה',
    icon: 'mdi-web',
    color: 'primary',
    description: 'טקסט סטטי — התחלה, הפסקה, סיום, תודה, הודעה, QR וכו\'',
  },
  {
    value: 'voting',
    label: 'הצבעה על שירים',
    icon: 'mdi-vote-outline',
    color: 'info',
    description: 'הקהל בוחר שירים מהפלייליסט',
  },
  {
    value: 'lyrics',
    label: 'מילות שיר',
    icon: 'mdi-text-box-outline',
    color: 'success',
    description: 'שיר נוכחי + מילים (שידור חי)',
  },
  {
    value: 'feedback',
    label: 'שאלות משוב',
    icon: 'mdi-comment-question-outline',
    color: 'warning',
    description: 'טופס משוב לפי שאלות שהוגדרו בהגדרות',
  },
]

export const DEFAULT_BROADCAST_MODE = 'landing'

const modeMeta = (value) => EVENT_BROADCAST_MODES.find((m) => m.value === value)

/**
 * @param {string} [landingPageName] — template name from settings
 */
export function formatLandingBroadcastDescription(landingPageName) {
  const base =
    modeMeta('landing')?.description ??
    'טקסט סטטי — התחלה, הפסקה, סיום, תודה, הודעה, QR וכו\''
  const name = String(landingPageName ?? '').trim()
  if (!name) return base
  return `הקהל רואים דף נחיתה «${name}»`
}

/**
 * @param {string} [playlistName]
 */
export function formatVotingBroadcastDescription(playlistName) {
  const base = modeMeta('voting')?.description ?? 'הקהל בוחר שירים מהפלייליסט'
  const name = String(playlistName ?? '').trim()
  if (!name) return base
  return `הקהל בוחר שירים מהפלייליסט «${name}»`
}

/**
 * @param {string} modeValue
 * @param {{ playlistName?: string, landingPageName?: string }} [options]
 */
export function broadcastModeDescription(modeValue, options = {}) {
  if (modeValue === 'landing') {
    return formatLandingBroadcastDescription(options.landingPageName)
  }
  if (modeValue === 'voting') {
    return formatVotingBroadcastDescription(options.playlistName)
  }
  const meta = modeMeta(modeValue)
  return meta?.description ?? ''
}
