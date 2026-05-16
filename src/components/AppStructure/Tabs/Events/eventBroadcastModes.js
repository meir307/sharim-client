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
