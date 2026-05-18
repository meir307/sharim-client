const VOTING_PLAYLIST_KEY = 'sharim.eventVotingPlaylistByEventId'
const LANDING_PAGE_KEY = 'sharim.eventLandingPageNameByEventId'

function readMap(storageKey) {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeMap(storageKey, map) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(map))
  } catch {
    // quota / private mode
  }
}

function loadLabel(storageKey, eventId) {
  const id = eventId != null ? String(eventId).trim() : ''
  if (!id) return ''
  const name = readMap(storageKey)[id]
  return name != null ? String(name).trim() : ''
}

function saveLabel(storageKey, eventId, label) {
  const id = eventId != null ? String(eventId).trim() : ''
  const name = String(label ?? '').trim()
  if (!id || !name) return
  const map = readMap(storageKey)
  map[id] = name
  writeMap(storageKey, map)
}

/**
 * @param {string|number | null | undefined} eventId
 * @returns {string}
 */
export function loadVotingPlaylistName(eventId) {
  return loadLabel(VOTING_PLAYLIST_KEY, eventId)
}

/**
 * @param {string|number | null | undefined} eventId
 * @param {string} playlistName
 */
export function saveVotingPlaylistName(eventId, playlistName) {
  saveLabel(VOTING_PLAYLIST_KEY, eventId, playlistName)
}

/**
 * @param {string|number | null | undefined} eventId
 * @returns {string}
 */
export function loadLandingPageName(eventId) {
  return loadLabel(LANDING_PAGE_KEY, eventId)
}

/**
 * @param {string|number | null | undefined} eventId
 * @param {string} landingPageName
 */
export function saveLandingPageName(eventId, landingPageName) {
  saveLabel(LANDING_PAGE_KEY, eventId, landingPageName)
}
