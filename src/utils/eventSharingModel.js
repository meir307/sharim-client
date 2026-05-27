import { DEFAULT_BROADCAST_MODE } from '@/components/AppStructure/Tabs/Events/eventBroadcastModes.js'
import { songListUrl } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'

/** @typedef {'landing'|'voting'|'lyrics'|'feedback'} BroadcastMode */

/**
 * Guest-facing `sharingParams` (from `FetchGuestEvent` / poll):
 * - `broadcastMode`, `eventName` (set by server on activate), `secondsToSleep` (poll interval)
 * - `activeLink` (lyrics mode) — current song doc URL for guests
 * - `eventId` (voting / feedback) — set by host on activate
 * - `playlistName` (voting) — guest label; display / server session name
 * - `guestVoteSessionId` (voting) — guest localStorage vote key; new id when host allows vote again
 * - `clearVotingResults` (voting, host-only) — stripped before guest poll; deletes/reseeds DB session on activate
 * - `title` (feedback) — session key + guest intro headline; one submit per event + title (localStorage)
 * - Voting guest copy (`welcomeTitle`, `title`, buttons, etc.) — set by host on activate via `buildVotingSharingParams`
 * - plus mode-specific fields from the activation builders below.
 */

/** Default guest voting copy (activation dialog seeds from this; live guests read `sharingParams`). */
export const DEFAULT_VOTING_COPY = Object.freeze({
  welcomeTitle: 'ברוכים הבאים ל "{eventName}"',
  welcomeBody:
  'בדף זה יוצגו המילים לשירים שיושמעו באירוע. ויהיו הפתעות נוספות...',
  title: 'בואו נבחר יחד את השירים',
  body: 'כדי להפוך את הערב למיוחד, אנחנו מזמינים אתכם להשתתף בבחירת הרפרטואר. ההצבעה קצרה ופשוטה — ביחד ניצור מוזיקה שמתאימה בדיוק לכם.',
  introQuestion: 'האם תרצו להשפיע בחירת על השירים באירוע?',
  ballotHint: 'סמנו עד {max} שירים',
  thankYouTitle: 'תודה על ההשתתפות בהצבעה!',
  thankYouBody: 'ההצבעה שלך נשמרה ותשפיע על בחירת השירים באירוע. בדף זה יופיעו מילות השירים כשהאירוע יתחיל. נתראה באירוע!',
  declinedTitle: 'תודה',
  declinedBody: 'בדף זה יופיעו מילות השירים כשהאירוע יתחיל. נתראה באירוע!.',
  welcomeContinueButton: 'המשך',
  introContinueButton: 'המשך להצבעה',
  introDeclineButton: 'לא מעוניין/ים',
  submitVoteButton: 'שלח הצבעה ({count} שירים)',
  declinedBackButton: 'רוצים להצביע? חזרה',
  emptyPlaylistMessage: 'אין שירים להצבעה.',
  submitVoteFailedMessage: 'שליחת ההצבעה נכשלה',
  songFallbackName: 'שיר {index}',
})

/** Keys persisted in `sharingParams` for guest voting UI copy. */
export const VOTING_GUEST_COPY_KEYS = Object.freeze([
  'welcomeTitle',
  'welcomeBody',
  'title',
  'body',
  'introQuestion',
  'ballotHint',
  'thankYouTitle',
  'thankYouBody',
  'declinedTitle',
  'declinedBody',
  'welcomeContinueButton',
  'introContinueButton',
  'introDeclineButton',
  'submitVoteButton',
  'declinedBackButton',
  'emptyPlaylistMessage',
  'submitVoteFailedMessage',
  'songFallbackName',
])

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @param {string} key
 * @returns {string}
 */
export function votingCopyFromSharingParams(sharingParams, key) {
  if (sharingParams && typeof sharingParams === 'object') {
    const v = sharingParams[key] ?? sharingParams[key.charAt(0).toUpperCase() + key.slice(1)]
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return String(DEFAULT_VOTING_COPY[key] ?? '').trim()
}

/**
 * @param {string} text
 * @param {Record<string, string | number>} replacements
 * @returns {string}
 */
export function applyVotingTextPlaceholders(text, replacements) {
  let out = String(text ?? '')
  for (const [key, value] of Object.entries(replacements)) {
    out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }
  return out
}

/**
 * Default copy for the activation dialog form (`{eventName}` resolved when provided).
 * @param {string} [eventName]
 * @returns {Record<string, string>}
 */
export function activateVotingFormDefaults(eventName = '') {
  const name = String(eventName ?? '').trim() || 'אירוע'
  const out = /** @type {Record<string, string>} */ ({})
  for (const key of VOTING_GUEST_COPY_KEYS) {
    let value = String(DEFAULT_VOTING_COPY[key] ?? '')
    if (key === 'welcomeTitle') {
      value = applyVotingTextPlaceholders(value, { eventName: name })
    }
    out[key] = value
  }
  return out
}

/**
 * @param {Record<string, unknown>} input
 * @returns {Record<string, string>}
 */
function votingGuestCopyFromInput(input) {
  const guestCopy = /** @type {Record<string, string>} */ ({})
  for (const key of VOTING_GUEST_COPY_KEYS) {
    const fromInput = String(input?.[key] ?? '').trim()
    const value = fromInput || String(DEFAULT_VOTING_COPY[key] ?? '').trim()
    if (value) guestCopy[key] = value
  }
  return guestCopy
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {string}
 */
export function eventIdFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  if (!sp) return ''
  const id = sp.eventId ?? sp.EventId
  if (id == null || String(id).trim() === '') return ''
  return String(id).trim()
}

/**
 * Guest vote localStorage session id (falls back to `playlistName` for legacy broadcasts).
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {string}
 */
export function guestVoteSessionIdFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  const playlistName = sp ? String(sp.playlistName ?? sp.PlaylistName ?? '').trim() : ''
  const explicit = sp
    ? String(sp.guestVoteSessionId ?? sp.GuestVoteSessionId ?? '').trim()
    : ''
  return explicit || playlistName
}

/**
 * Voting session identity for guest localStorage (one vote per event + session id).
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {{ eventId: string, playlistName: string, sessionId: string }}
 */
export function votingSessionFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  const playlistName = sp ? String(sp.playlistName ?? sp.PlaylistName ?? '').trim() : ''
  return {
    eventId: eventIdFromSharingParams(sp),
    playlistName,
    sessionId: guestVoteSessionIdFromSharingParams(sp),
  }
}

/**
 * Feedback session identity for guest localStorage (one submit per event + title).
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {{ eventId: string, title: string }}
 */
export function feedbackSessionFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  return {
    eventId: eventIdFromSharingParams(sp),
    title: sp ? String(sp.title ?? sp.Title ?? '').trim() : '',
  }
}

/** Default guest poll interval when `secondsToSleep` is missing (seconds). */
const DEFAULT_SECONDS_TO_SLEEP = 5

const MIN_SECONDS_TO_SLEEP = 2
const MAX_SECONDS_TO_SLEEP = 180

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizeSecondsToSleep(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return DEFAULT_SECONDS_TO_SLEEP
  return Math.min(MAX_SECONDS_TO_SLEEP, Math.max(MIN_SECONDS_TO_SLEEP, Math.floor(n)))
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {number}
 */
export function secondsToSleepFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  if (!sp) return DEFAULT_SECONDS_TO_SLEEP
  return normalizeSecondsToSleep(sp.secondsToSleep ?? sp.SecondsToSleep)
}

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown> | null}
 */
export function parseSharingParams(raw) {
  if (raw == null) return null
  let obj = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    try {
      obj = JSON.parse(trimmed)
    } catch {
      return null
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null
  return { ...obj }
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {BroadcastMode}
 */
export function broadcastModeFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  if (!sp) return DEFAULT_BROADCAST_MODE
  const mode = String(
    sp.broadcastMode ?? sp.BroadcastMode ?? sp.brodcastMode ?? sp.BrodcastMode ?? '',
  ).trim()
  if (mode === 'landing' || mode === 'voting' || mode === 'lyrics' || mode === 'feedback') {
    return mode
  }
  return DEFAULT_BROADCAST_MODE
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {string}
 */
export function eventNameFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  if (!sp) return ''
  return String(sp.eventName ?? sp.EventName ?? '').trim()
}

/**
 * @param {Record<string, unknown>} params
 * @param {{ secondsToSleep?: number }} [options]
 */
function withGuestPollDefaults(params, options = {}) {
  const secondsToSleep = normalizeSecondsToSleep(
    options.secondsToSleep ?? params.secondsToSleep,
  )
  return { ...params, secondsToSleep }
}

/**
 * @param {Record<string, unknown> | null | undefined} event
 * @returns {BroadcastMode}
 */
export function currentBroadcastFromEvent(event) {
  const sp = parseSharingParams(event?.sharingParams ?? event?.SharingParams)
  return broadcastModeFromSharingParams(sp)
}

/**
 * @param {Record<string, unknown> | null | undefined} page
 * @param {{ title?: string, body?: string, secondsToSleep?: number }} [overrides]
 */
export function buildLandingSharingParams(page, overrides = {}) {
  if (!page || typeof page !== 'object') {
    throw new Error('יש לבחור דף נחיתה')
  }
  const landingPageName = String(page.name ?? page.Name ?? '').trim()
  if (!landingPageName) {
    throw new Error('דף הנחיתה חסר שם')
  }
  const title = String(
    overrides.title ?? overrides.Title ?? page.title ?? page.Title ?? '',
  ).trim()
  if (!title) {
    throw new Error('יש להזין כותרת לאורח')
  }
  return withGuestPollDefaults({
    broadcastMode: 'landing',
    landingPageName,
    title,
    body: String(overrides.body ?? overrides.Body ?? page.body ?? page.Body ?? '').trim(),
    icon: String(page.icon ?? page.Icon ?? 'mdi-clock-outline').trim() || 'mdi-clock-outline',
    showSpinner: Boolean(page.showSpinner ?? page.ShowSpinner ?? false),
  }, overrides)
}

/**
 * @param {unknown} raw
 * @returns {Array<{ id?: string|number, songName: string, artist: string }>}
 */
function normalizeVotingPlaylistSongs(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const songName = String(
        entry.songName ?? entry.SongName ?? entry.name ?? entry.Name ?? entry.title ?? entry.Title ?? '',
      ).trim()
      if (!songName) return null
      const artist = String(
        entry.artist ??
          entry.Artist ??
          entry.artistName ??
          entry.ArtistName ??
          '',
      ).trim()
      const out = { songName, artist }
      const id = entry.id ?? entry.Id
      if (id != null && String(id).trim() !== '') {
        out.id = typeof id === 'number' && Number.isFinite(id) ? id : String(id).trim()
      }
      return out
    })
    .filter(Boolean)
}

/** Guest poll interval while voting broadcast is active (seconds). */
const VOTING_BROADCAST_SECONDS_TO_SLEEP = 180

/**
 * @param {Record<string, unknown>} input — `playlistName`, `maxSelections`, `playlist`, and all `VOTING_GUEST_COPY_KEYS`
 */
export function buildVotingSharingParams(input) {
  const playlistName = String(input?.playlistName ?? '').trim()
  if (!playlistName) {
    throw new Error('יש לבחור פלייליסט')
  }
  const maxSelections = Math.max(1, Math.min(99, Number(input?.maxSelections) || 1))
  const guestCopy = votingGuestCopyFromInput(input)
  const title = guestCopy.title || String(input?.title ?? '').trim()
  if (!title) {
    throw new Error('יש להזין כותרת להצבעה')
  }
  guestCopy.title = title
  const body = guestCopy.body || String(input?.body ?? '').trim()
  if (body) guestCopy.body = body

  const playlist = normalizeVotingPlaylistSongs(input?.playlist ?? input?.songs)
  if (!playlist.length) {
    throw new Error('אין שירים בפלייליסט שנבחר')
  }

  const guestVoteSessionId = String(input?.guestVoteSessionId ?? '').trim() || playlistName

  const params = {
    broadcastMode: 'voting',
    playlistName,
    guestVoteSessionId,
    maxSelections,
    playlist,
    ...guestCopy,
  }

  if (input?.clearVotingResults === true) {
    params.clearVotingResults = true
  }

  return withGuestPollDefaults(
    { ...params, secondsToSleep: VOTING_BROADCAST_SECONDS_TO_SLEEP },
    input,
  )
}

/**
 * First song link in a host playlist (same resolution as DisplaySong).
 * @param {Record<string, unknown> | null | undefined} playlist
 * @param {Array<Record<string, unknown>>} [songs]
 * @returns {string}
 */
export function lyricsActiveLinkFromPlaylist(playlist, songs = []) {
  if (!playlist || typeof playlist !== 'object') return ''
  const raw = playlist.songs ?? playlist.Songs ?? playlist.songList ?? playlist.items ?? []
  if (!Array.isArray(raw) || !raw.length) return ''

  const songList = Array.isArray(songs) ? songs : []
  const entry = raw[0]
  if (entry == null) return ''

  let song = entry
  if (typeof entry === 'object' && entry !== null) {
    const id = entry.id ?? entry.Id
    if (id != null && String(id).trim() !== '') {
      const idStr = String(id).trim()
      const fromStore = songList.find((s) => String(s.id ?? s.Id ?? '').trim() === idStr)
      if (fromStore) song = fromStore
    }
  }

  return songListUrl(song)
}

/**
 * @param {string} playlistName
 * @param {{
 *   secondsToSleep?: number,
 *   activeLink?: string,
 *   playlist?: Record<string, unknown> | null,
 *   songs?: Array<Record<string, unknown>>,
 * }} [options]
 */
export function buildLyricsSharingParams(playlistName, options = {}) {
  const name = String(playlistName ?? '').trim()
  if (!name) {
    throw new Error('יש לבחור פלייליסט')
  }
  const activeLink =
    String(options.activeLink ?? options.ActiveLink ?? '').trim() ||
    lyricsActiveLinkFromPlaylist(options.playlist, options.songs)

  return withGuestPollDefaults(
    {
      broadcastMode: 'lyrics',
      playlistName: name,
      activeLink,
    },
    options,
  )
}

/**
 * @param {{
 *   title: string,
 *   body?: string,
 *   questions: Array<Record<string, unknown>>,
 *   secondsToSleep?: number,
 * }} input
 */
export function buildFeedbackSharingParams(input) {
  const title = String(input?.title ?? '').trim()
  if (!title) {
    throw new Error('יש להזין כותרת למשוב')
  }
  const body = String(input?.body ?? '').trim()
  const questions = Array.isArray(input?.questions) ? input.questions : []
  if (!questions.length) {
    throw new Error('אין שאלות משוב — הוסף שאלות בהגדרות')
  }
  return withGuestPollDefaults(
    {
      broadcastMode: 'feedback',
      title,
      body,
      questions: questions.map((q) => ({
        id: q.id ?? q.Id,
        text: String(q.text ?? q.Text ?? '').trim(),
        type: q.type === 'text' ? 'text' : 'stars',
      })),
    },
    input,
  )
}

/**
 * @param {Record<string, unknown> | null | undefined} playlist
 * @returns {string}
 */
export function playlistDisplayName(playlist) {
  if (!playlist || typeof playlist !== 'object') return ''
  for (const k of ['name', 'Name', 'playlistName', 'PlaylistName', 'title', 'Title']) {
    if (!(k in playlist)) continue
    const v = playlist[k]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}
