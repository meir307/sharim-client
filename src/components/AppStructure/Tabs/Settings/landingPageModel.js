export const LANDING_PAGE_ICON_OPTIONS = [
  { title: 'שעון (המתנה)', value: 'mdi-clock-outline' },
  { title: 'הפסקה', value: 'mdi-coffee-outline' },
  { title: 'לב (תודה)', value: 'mdi-heart-outline' },
  { title: 'הודעה', value: 'mdi-bullhorn-outline' },
  { title: 'QR / קישור', value: 'mdi-qrcode' },
  { title: 'מוזיקה', value: 'mdi-music-note' },
  { title: 'וי ג\'י', value: 'mdi-gesture-peace' },
]

export function nextLandingPageId(pages) {
  const ids = (pages || [])
    .map((p) => Number(p?.id))
    .filter((id) => Number.isFinite(id))
  return ids.length ? Math.max(...ids) + 1 : 1
}

export function createEmptyLandingPage(id = null) {
  return {
    id,
    name: '',
    title: '',
    body: '',
    icon: 'mdi-clock-outline',
    showSpinner: false,
  }
}

export function landingPageDisplayName(page) {
  const name = String(page?.name ?? '').trim()
  return name || '(ללא שם)'
}
