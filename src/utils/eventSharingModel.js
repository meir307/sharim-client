import { DEFAULT_BROADCAST_MODE } from '@/components/AppStructure/Tabs/Events/eventBroadcastModes.js'

/** @typedef {'landing'|'voting'|'lyrics'|'feedback'} BroadcastMode */

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
 * @param {string} [eventName]
 */
export function withEventNameInSharingParams(params, eventName) {
  const name = String(eventName ?? '').trim()
  if (!name) return { ...params }
  return { ...params, eventName: name }
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
 * @param {{ title?: string, body?: string, eventName?: string }} [overrides] — guest copy for this activation only (not saved to settings)
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
  return withEventNameInSharingParams(
    {
      broadcastMode: 'landing',
      landingPageName,
      title,
      body: String(overrides.body ?? overrides.Body ?? page.body ?? page.Body ?? '').trim(),
      icon: String(page.icon ?? page.Icon ?? 'mdi-clock-outline').trim() || 'mdi-clock-outline',
      showSpinner: Boolean(page.showSpinner ?? page.ShowSpinner ?? false),
    },
    overrides.eventName ?? overrides.EventName,
  )
}

/**
 * @param {unknown} raw
 * @returns {Array<{ id?: string|number, songName: string, artist: string }>}
 */
export function normalizeVotingPlaylistSongs(raw) {
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
 *   eventName?: string,
 * }} input
 */
export function buildVotingSharingParams(input) {
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
  return withEventNameInSharingParams(
    {
      broadcastMode: 'voting',
      playlistName,
      maxSelections,
      title,
      body,
      playlist,
    },
    input?.eventName ?? input?.EventName,
  )
}

/**
 * @param {string} playlistName
 * @param {string} [eventName]
 */
export function buildLyricsSharingParams(playlistName, eventName) {
  const name = String(playlistName ?? '').trim()
  if (!name) {
    throw new Error('יש לבחור פלייליסט')
  }
  return withEventNameInSharingParams(
    {
      broadcastMode: 'lyrics',
      playlistName: name,
    },
    eventName,
  )
}

/**
 * @param {{ title: string, body?: string, questions: Array<Record<string, unknown>>, eventName?: string }} input
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
  return withEventNameInSharingParams(
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
    input?.eventName ?? input?.EventName,
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

/**
 * @param {Array<Record<string, unknown>>} playlists
 * @param {string} name
 * @returns {Record<string, unknown> | null}
 */
export function findPlaylistByName(playlists, name) {
  const target = String(name ?? '').trim()
  if (!target || !Array.isArray(playlists)) return null
  return (
    playlists.find((p) => playlistDisplayName(p) === target) ??
    playlists.find((p) => playlistDisplayName(p).toLowerCase() === target.toLowerCase()) ??
    null
  )
}
