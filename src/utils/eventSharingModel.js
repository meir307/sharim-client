import { DEFAULT_BROADCAST_MODE } from '@/components/AppStructure/Tabs/Events/eventBroadcastModes.js'
import { songListUrl } from '@/components/AppStructure/Tabs/Songs/songsMainTable.js'

/** @typedef {'landing'|'voting'|'lyrics'|'feedback'} BroadcastMode */

/**
 * Guest-facing `sharingParams` (from `FetchGuestEvent` / poll):
 * - `broadcastMode`, `eventName` (set by server on activate), `secondsToSleep` (poll interval)
 * - `activeLink` (lyrics mode) — current song doc URL for guests
 * - `voteSessionId` (voting mode) — broadcast round marker for guest poll/UI sync
 * - `playlistId` (voting mode) — one guest vote per playlist per event link
 * - `votingSessions` — history of voting rounds (playlist snapshots) for host results (later)
 * - plus mode-specific fields from the activation builders below.
 */

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {string}
 */
export function votingPlaylistKeyFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  if (!sp) return ''
  const id = String(sp.playlistId ?? sp.PlaylistId ?? '').trim()
  if (id) return id
  return String(sp.playlistName ?? sp.PlaylistName ?? '').trim()
}

/**
 * @param {unknown} raw
 * @returns {Array<{ playlistId: string, playlistName: string, voteSessionId?: string, activatedAt?: string, songs?: unknown[] }>}
 */
function normalizeVotingSessions(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null
      const playlistId = String(entry.playlistId ?? entry.PlaylistId ?? '').trim()
      if (!playlistId) return null
      const playlistName = String(entry.playlistName ?? entry.PlaylistName ?? '').trim()
      const out = { playlistId, playlistName: playlistName || playlistId }
      const voteSessionId = String(entry.voteSessionId ?? entry.VoteSessionId ?? '').trim()
      if (voteSessionId) out.voteSessionId = voteSessionId
      const activatedAt = String(entry.activatedAt ?? entry.ActivatedAt ?? '').trim()
      if (activatedAt) out.activatedAt = activatedAt
      const songs = entry.songs ?? entry.Songs
      if (Array.isArray(songs)) out.songs = songs
      return out
    })
    .filter(Boolean)
}

/**
 * Playlist ids that already had a voting round on this event.
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {string[]}
 */
export function usedVotingPlaylistIdsFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  if (!sp) return []
  const fromSessions = normalizeVotingSessions(sp.votingSessions ?? sp.VotingSessions).map(
    (s) => s.playlistId,
  )
  const legacy = Array.isArray(sp.usedVotingPlaylistIds ?? sp.UsedVotingPlaylistIds)
    ? sp.usedVotingPlaylistIds ?? sp.UsedVotingPlaylistIds
    : []
  const fromLegacy = legacy.map((id) => String(id ?? '').trim()).filter(Boolean)
  return [...new Set([...fromSessions, ...fromLegacy])]
}

/**
 * @param {Record<string, unknown> | null | undefined} previousSharingParams
 * @param {string} playlistId
 * @returns {boolean}
 */
export function isPlaylistAlreadyUsedForVoting(previousSharingParams, playlistId) {
  const key = String(playlistId ?? '').trim()
  if (!key) return false
  return usedVotingPlaylistIdsFromSharingParams(previousSharingParams).includes(key)
}

/**
 * Append current voting activation to `votingSessions` (history for results; same playlist allowed).
 * @param {Record<string, unknown> | null | undefined} previousSharingParams
 * @param {Record<string, unknown>} votingParams — output of `buildVotingSharingParams`
 * @returns {Record<string, unknown>}
 */
export function attachVotingSessionRegistry(previousSharingParams, votingParams) {
  const playlistId = votingPlaylistKeyFromSharingParams(votingParams)
  if (!playlistId) {
    throw new Error('חסר מזהה פלייליסט להצבעה')
  }

  const prev = previousSharingParams && typeof previousSharingParams === 'object' ? previousSharingParams : null
  const sessions = normalizeVotingSessions(prev?.votingSessions ?? prev?.VotingSessions)

  sessions.push({
    playlistId,
    playlistName: String(votingParams.playlistName ?? votingParams.PlaylistName ?? '').trim() || playlistId,
    voteSessionId: String(votingParams.voteSessionId ?? votingParams.VoteSessionId ?? '').trim() || undefined,
    activatedAt: new Date().toISOString(),
    songs: Array.isArray(votingParams.playlist) ? votingParams.playlist : [],
  })

  return { ...votingParams, votingSessions: sessions }
}

/**
 * New voting round id (generated on each host activation).
 * @returns {string}
 */
function createVoteSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `vs-${Date.now()}`
}

/**
 * @param {Record<string, unknown> | null | undefined} sharingParams
 * @returns {string}
 */
export function voteSessionIdFromSharingParams(sharingParams) {
  const sp = sharingParams && typeof sharingParams === 'object' ? sharingParams : null
  if (!sp) return ''
  return String(sp.voteSessionId ?? sp.VoteSessionId ?? '').trim()
}

/** Default guest poll interval when `secondsToSleep` is missing (seconds). */
const DEFAULT_SECONDS_TO_SLEEP = 5

const MIN_SECONDS_TO_SLEEP = 2
const MAX_SECONDS_TO_SLEEP = 120

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

/**
 * @param {{
 *   playlistName: string,
 *   maxSelections: number,
 *   title: string,
 *   body?: string,
 *   playlist?: unknown[],
 *   songs?: unknown[],
 *   secondsToSleep?: number,
 *   playlistId?: string,
 *   voteSessionId?: string,
 * }} input
 */
export function buildVotingSharingParams(input) {
  const playlistId = String(input?.playlistId ?? input?.PlaylistId ?? '').trim()
  if (!playlistId) {
    throw new Error('יש לבחור פלייליסט')
  }
  const playlistName = String(input?.playlistName ?? '').trim()
  if (!playlistName) {
    throw new Error('יש לבחור פלייליסט')
  }
  const maxSelections = Math.max(1, Math.min(99, Number(input?.maxSelections) || 1))
  const title = String(input?.title ?? '').trim()
  if (!title) {
    throw new Error('יש להזין כותרת להצבעה')
  }
  const playlist = normalizeVotingPlaylistSongs(input?.playlist ?? input?.songs)
  if (!playlist.length) {
    throw new Error('אין שירים בפלייליסט שנבחר')
  }
  const body = String(input?.body ?? '').trim()
  const voteSessionId =
    String(input?.voteSessionId ?? input?.VoteSessionId ?? '').trim() || createVoteSessionId()

  return withGuestPollDefaults(
    {
      broadcastMode: 'voting',
      voteSessionId,
      playlistId,
      playlistName,
      maxSelections,
      title,
      body,
      playlist,
    },
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
