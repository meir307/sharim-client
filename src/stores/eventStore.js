import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './UserStore'
import { useLoaderStore } from './LoaderStore'
import {
  broadcastModeFromSharingParams,
  parseSharingParams,
} from '@/utils/eventSharingModel'
import { toDateInputValue } from '@/utils/dateInputValue.js'

/**
 * @param {Record<string, unknown> | null | undefined} event
 * @returns {string}
 */
export function extractEventSharingCode(event) {
  const e = event && typeof event === 'object' && 'value' in event ? event.value : event
  if (!e || typeof e !== 'object') return ''
  return String(
    e.shareCode ??
      e.ShareCode ??
      e.sharingCode ??
      e.SharingCode ??
      e.code ??
      e.Code ??
      e.eventCode ??
      e.EventCode ??
      '',
  ).trim()
}

/**
 * @param {Record<string, unknown> | null | undefined} raw
 * @returns {Record<string, unknown> | null}
 */
export function normalizeEventFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = raw.id ?? raw.Id
  if (id == null || String(id).trim() === '') return null
  const sharingParams = parseSharingParams(raw.sharingParams ?? raw.SharingParams)
  return {
    id,
    name: String(raw.name ?? raw.Name ?? '').trim(),
    date: toDateInputValue(raw.date ?? raw.Date),
    description: String(raw.description ?? raw.Description ?? '').trim(),
    phase: raw.phase ?? raw.Phase ?? 'draft',
    shareCode: extractEventSharingCode(raw),
    sharingParams,
    totalVotes: Number(raw.totalVotes ?? raw.TotalVotes ?? 0) || 0,
    totalFeedback: Number(raw.totalFeedback ?? raw.TotalFeedback ?? 0) || 0,
    crowdSize:
      raw.crowdSize != null || raw.CrowdSize != null
        ? Number(raw.crowdSize ?? raw.CrowdSize) || 0
        : null,
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} payload
 */
function buildEventRequestBody(payload) {
  const body = {
    name: String(payload?.name ?? '').trim(),
    date: payload?.date ?? '',
    description: String(payload?.description ?? '').trim(),
  }
  if (payload?.crowdSize != null && payload.crowdSize !== '') {
    body.crowdSize = Number(payload.crowdSize)
  } else if (Object.prototype.hasOwnProperty.call(payload ?? {}, 'crowdSize')) {
    body.crowdSize = null
  }
  const id = payload?.id ?? payload?.Id
  if (id != null && String(id).trim() !== '') {
    body.id = id
  }
  return body
}

/**
 * @param {unknown} data
 * @param {string} [defaultMessage]
 */
function assertApiSuccess(data, defaultMessage = 'הפעולה נכשלה') {
  if (!data || typeof data !== 'object') return
  if (data.success === false || data.Success === false) {
    const message =
      data.errorMessage ?? data.ErrorMessage ?? data.message ?? data.Message ?? defaultMessage
    throw new Error(String(message))
  }
}

/**
 * @param {unknown} data
 * @returns {Record<string, unknown> | null}
 */
function eventFromResponseData(data) {
  if (!data || typeof data !== 'object') return null
  const failed = data.success === false || data.Success === false
  if (failed) {
    const message =
      data.errorMessage ?? data.ErrorMessage ?? data.message ?? data.Message ?? 'הפעולה נכשלה'
    throw new Error(String(message))
  }
  const raw = data.event ?? data.Event ?? data
  return normalizeEventFromApi(raw)
}

/**
 * @param {unknown} data
 * @returns {Array<Record<string, unknown>>}
 */
/**
 * @param {unknown} raw
 * @returns {{
 *   id: number,
 *   eventId: number,
 *   playlistName: string,
 *   playList: unknown[],
 *   activeDate: unknown,
 *   totalVotes: number,
 *   lines: Array<{ songId: number, songName: string, artist: string, votes: number }>,
 * } | null}
 */
function normalizeVotingSessionFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id ?? raw.Id)
  if (!Number.isFinite(id) || id <= 0) return null
  const playListRaw = raw.playList ?? raw.PlayList ?? raw.playlist ?? raw.Playlist
  let playList = []
  if (Array.isArray(playListRaw)) {
    playList = playListRaw
  } else if (typeof playListRaw === 'string' && playListRaw.trim()) {
    try {
      const parsed = JSON.parse(playListRaw)
      if (Array.isArray(parsed)) playList = parsed
    } catch {
      playList = []
    }
  }
  const linesRaw = raw.lines ?? raw.Lines ?? []
  const lines = Array.isArray(linesRaw)
    ? linesRaw
        .map((line) => {
          if (!line || typeof line !== 'object') return null
          const songId = Number(line.songId ?? line.SongId)
          const songName = String(line.songName ?? line.SongName ?? '').trim()
          if (!Number.isFinite(songId) || songId <= 0 || !songName) return null
          return {
            songId,
            songName,
            artist: String(line.artist ?? line.Artist ?? '').trim(),
            votes: Number(line.votes ?? line.Votes) || 0,
          }
        })
        .filter(Boolean)
    : []
  return {
    id,
    eventId: Number(raw.eventId ?? raw.EventId) || 0,
    playlistName: String(raw.playlistName ?? raw.PlaylistName ?? '').trim(),
    playList,
    activeDate: raw.activeDate ?? raw.ActiveDate ?? null,
    totalVotes: Number(raw.totalVotes ?? raw.TotalVotes) || 0,
    lines,
  }
}

/**
 * @param {unknown} data
 * @returns {Array<ReturnType<typeof normalizeVotingSessionFromApi>>}
 */
function votingSessionsFromResponseData(data) {
  if (!data || typeof data !== 'object') return []
  const failed = data.success === false || data.Success === false
  if (failed) {
    const message =
      data.errorMessage ??
      data.ErrorMessage ??
      data.message ??
      data.Message ??
      'טעינת תוצאות ההצבעה נכשלה'
    throw new Error(String(message))
  }
  const raw = data.sessions ?? data.Sessions ?? []
  if (!Array.isArray(raw)) return []
  return raw.map((item) => normalizeVotingSessionFromApi(item)).filter(Boolean)
}

/**
 * @param {unknown} raw
 * @returns {{
 *   id: number,
 *   question: string,
 *   type: 'stars' | 'text',
 *   totalResponses: number,
 *   avgRating: number,
 *   distribution: number[],
 *   responses: string[],
 * } | null}
 */
function normalizeFeedbackQuestionFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id ?? raw.Id)
  if (!Number.isFinite(id) || id <= 0) return null
  const type = raw.type === 'text' || raw.Type === 'text' ? 'text' : 'stars'
  const distRaw = raw.distribution ?? raw.Distribution ?? []
  const distribution = [0, 0, 0, 0, 0]
  if (Array.isArray(distRaw)) {
    for (let i = 0; i < 5; i++) {
      distribution[i] = Number(distRaw[i]) || 0
    }
  }
  const responsesRaw = raw.responses ?? raw.Responses ?? []
  const responses = Array.isArray(responsesRaw)
    ? responsesRaw.map((r) => String(r ?? '').trim()).filter(Boolean)
    : []
  return {
    id,
    question: String(raw.question ?? raw.Question ?? raw.text ?? raw.Text ?? '').trim(),
    type,
    totalResponses: Number(raw.totalResponses ?? raw.TotalResponses) || 0,
    avgRating: Number(raw.avgRating ?? raw.AvgRating) || 0,
    distribution,
    responses,
  }
}

/**
 * @param {unknown} raw
 * @returns {{
 *   id: number,
 *   eventId: number,
 *   title: string,
 *   activeDate: unknown,
 *   totalParticipate: number,
 *   questions: Array<ReturnType<typeof normalizeFeedbackQuestionFromApi>>,
 * } | null}
 */
function normalizeFeedbackSessionFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null
  const id = Number(raw.id ?? raw.Id)
  if (!Number.isFinite(id) || id <= 0) return null
  const questionsRaw = raw.questions ?? raw.Questions ?? []
  const questions = Array.isArray(questionsRaw)
    ? questionsRaw.map((q) => normalizeFeedbackQuestionFromApi(q)).filter(Boolean)
    : []
  return {
    id,
    eventId: Number(raw.eventId ?? raw.EventId) || 0,
    title: String(raw.title ?? raw.Title ?? '').trim(),
    activeDate: raw.activeDate ?? raw.ActiveDate ?? null,
    totalParticipate: Number(raw.totalParticipate ?? raw.TotalParticipate) || 0,
    questions,
  }
}

/**
 * @param {unknown} data
 * @returns {Array<ReturnType<typeof normalizeFeedbackSessionFromApi>>}
 */
function feedbackSessionsFromResponseData(data) {
  if (!data || typeof data !== 'object') return []
  const failed = data.success === false || data.Success === false
  if (failed) {
    const message =
      data.errorMessage ??
      data.ErrorMessage ??
      data.message ??
      data.Message ??
      'טעינת תוצאות המשוב נכשלה'
    throw new Error(String(message))
  }
  const raw = data.sessions ?? data.Sessions ?? []
  if (!Array.isArray(raw)) return []
  return raw.map((item) => normalizeFeedbackSessionFromApi(item)).filter(Boolean)
}

function eventsListFromResponseData(data) {
  if (!data || typeof data !== 'object') return []
  const failed = data.success === false || data.Success === false
  if (failed) {
    const message =
      data.errorMessage ?? data.ErrorMessage ?? data.message ?? data.Message ?? 'טעינת האירועים נכשלה'
    throw new Error(String(message))
  }
  const raw = data.events ?? data.Events ?? data.data ?? data
  if (!Array.isArray(raw)) return []
  return raw.map((item) => normalizeEventFromApi(item)).filter(Boolean)
}

export const useEventStore = defineStore('EventStore', {
  state: () => ({
    events: [],
    selectedEventId: null,
    /** Snapshot of the event opened from the list (incl. sharingParams after broadcast). */
    selectedEvent: null,
    error: null,
  }),

  actions: {
    /**
     * @param {Record<string, unknown> | null | undefined} event
     */
    selectEvent(event) {
      if (!event || typeof event !== 'object') {
        this.selectedEventId = null
        this.selectedEvent = null
        return
      }
      const id = event.id ?? event.Id
      if (id == null || String(id).trim() === '') {
        this.selectedEventId = null
        this.selectedEvent = null
        return
      }
      this.selectedEventId = id
      this.selectedEvent = { ...event, id }
    },

    clearSelectedEvent() {
      this.selectedEventId = null
      this.selectedEvent = null
    },

    /**
     * `POST event/FetchEvents` — load all events for the logged-in user.
     * @returns {Promise<Array<Record<string, unknown>>>}
     */
    async fetchEvents() {
      const userStore = useUserStore()
      const loaderStore = useLoaderStore()

      this.error = null
      loaderStore.show()
      try {
        const response = await axios.post(
          userStore.apiUrl + 'event/FetchEvents',
          {},
          {
            headers: {
              sessionId: userStore.user?.sessionId || '',
            },
          },
        )
        const list = eventsListFromResponseData(response.data)
        this.events = list
        return list
      } catch (error) {
        this.events = []
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        loaderStore.hide()
      }
    },

    /**
     * `POST event/CreateEvent` — create a new event for the logged-in user.
     * @param {{ name: string, date?: string, description?: string }} payload
     */
    async createEvent(payload) {
      const userStore = useUserStore()
      const loaderStore = useLoaderStore()
      const name = String(payload?.name ?? '').trim()
      if (!name) {
        throw new Error('יש להזין שם אירוע')
      }

      this.error = null
      loaderStore.show()
      try {
        const response = await axios.post(
          userStore.apiUrl + 'event/CreateEvent',
          buildEventRequestBody(payload),
          {
            headers: {
              sessionId: userStore.user?.sessionId || '',
            },
          },
        )
        const event = eventFromResponseData(response.data)
        if (!event) {
          throw new Error('יצירת האירוע נכשלה')
        }
        this.events = [...this.events, event]
        return event
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        loaderStore.hide()
      }
    },

    /**
     * `POST event/UpdateEvent` — update an existing event.
     * @param {{ id: number|string, name: string, date?: string, description?: string }} payload
     */
    async updateEvent(payload) {
      const userStore = useUserStore()
      const loaderStore = useLoaderStore()
      const id = payload?.id ?? payload?.Id
      if (id == null || String(id).trim() === '') {
        throw new Error('חסר מזהה אירוע לעדכון')
      }
      const name = String(payload?.name ?? '').trim()
      if (!name) {
        throw new Error('יש להזין שם אירוע')
      }

      this.error = null
      loaderStore.show()
      try {
        const response = await axios.post(
          userStore.apiUrl + 'event/UpdateEvent',
          buildEventRequestBody(payload),
          {
            headers: {
              sessionId: userStore.user?.sessionId || '',
            },
          },
        )
        const event = eventFromResponseData(response.data)
        if (!event) {
          throw new Error('עדכון האירוע נכשל')
        }
        const idx = this.events.findIndex((e) => String(e.id) === String(event.id))
        if (idx >= 0) {
          const next = [...this.events]
          next[idx] = event
          this.events = next
        } else {
          this.events = [...this.events, event]
        }
        return event
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        loaderStore.hide()
      }
    },

    /**
     * `POST event/UpdateBrodcast` — uses `selectedEventId`; `sharingParams` includes `broadcastMode`.
     * @param {Record<string, unknown>} sharingParams
     * @param {{ silent?: boolean }} [options]
     */
    async updateBrodcast(sharingParams, options = {}) {
      const userStore = useUserStore()
      const loaderStore = useLoaderStore()
      const silent = Boolean(options.silent)

      const id = this.selectedEventId
      if (id == null || String(id).trim() === '') {
        throw new Error('חסר מזהה אירוע')
      }
      if (!sharingParams || typeof sharingParams !== 'object') {
        throw new Error('חסרים פרמטרי שיתוף')
      }
      if (!String(sharingParams.broadcastMode ?? sharingParams.brodcastMode ?? '').trim()) {
        throw new Error('חסר מצב שידור בפרמטרי השיתוף')
      }

      this.error = null
      if (!silent) loaderStore.show()
      try {
        const response = await axios.post(
          userStore.apiUrl + 'event/UpdateBrodcast',
          { eventId: id, sharingParams },
          {
            headers: {
              sessionId: userStore.user?.sessionId || '',
            },
          },
        )
        assertApiSuccess(response.data, 'עדכון השידור נכשל')

        const resEvent = response.data?.event ?? response.data?.Event
        const fromServer = parseSharingParams(resEvent?.sharingParams ?? resEvent?.SharingParams)
        const parsed = fromServer ?? parseSharingParams(sharingParams)
        const sentSessionId = String(
          sharingParams.guestVoteSessionId ?? sharingParams.GuestVoteSessionId ?? '',
        ).trim()
        if (parsed && sentSessionId && !String(parsed.guestVoteSessionId ?? '').trim()) {
          parsed.guestVoteSessionId = sentSessionId
        }
        if (this.selectedEvent && String(this.selectedEvent.id) === String(id)) {
          this.selectedEvent = { ...this.selectedEvent, sharingParams: parsed }
        }
        return parsed
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        if (!silent) alert(message)
        this.error = message
        throw error
      } finally {
        if (!silent) loaderStore.hide()
      }
    },

    /**
     * Lyrics broadcast: sync `activeLink` in `sharingParams` (DB + guest poll table).
     * @param {string} link
     */
    /**
     * `POST event/FetchVotingResults` — all voting headers + lines for an event.
     * @param {number|string} eventId
     * @returns {Promise<Array<{
     *   id: number,
     *   eventId: number,
     *   playlistName: string,
     *   playList: unknown[],
     *   activeDate: unknown,
     *   totalVotes: number,
     *   lines: Array<{ songId: number, songName: string, artist: string, votes: number }>,
     * }>>}
     */
    async fetchVotingResults(eventId) {
      const userStore = useUserStore()
      const id = Number(eventId)
      if (!Number.isFinite(id) || id <= 0) {
        throw new Error('מזהה אירוע לא תקין')
      }

      this.error = null
      try {
        const response = await axios.post(
          userStore.apiUrl + 'event/FetchVotingResults',
          { eventId: id },
          {
            headers: {
              sessionId: userStore.user?.sessionId || '',
            },
          },
        )
        return votingSessionsFromResponseData(response.data)
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        this.error = message
        throw error
      }
    },

    /**
     * `POST event/FetchFeedbackResults` — all feedback headers + aggregated answers for an event.
     * @param {number|string} eventId
     */
    async fetchFeedbackResults(eventId) {
      const userStore = useUserStore()
      const id = Number(eventId)
      if (!Number.isFinite(id) || id <= 0) {
        throw new Error('מזהה אירוע לא תקין')
      }

      this.error = null
      try {
        const response = await axios.post(
          userStore.apiUrl + 'event/FetchFeedbackResults',
          { eventId: id },
          {
            headers: {
              sessionId: userStore.user?.sessionId || '',
            },
          },
        )
        return feedbackSessionsFromResponseData(response.data)
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        this.error = message
        throw error
      }
    },

    async updateLyricsActiveLink(link) {
      const sp = parseSharingParams(this.selectedEvent?.sharingParams)
      if (broadcastModeFromSharingParams(sp) !== 'lyrics') return null

      const activeLink = String(link ?? '').trim()
      if (!activeLink) return null

      return this.updateBrodcast({ ...sp, activeLink }, { silent: true })
    },
  },
})
