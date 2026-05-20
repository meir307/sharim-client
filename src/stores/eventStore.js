import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './UserStore'
import { useLoaderStore } from './LoaderStore'
import { parseSharingParams } from '@/utils/eventSharingModel'

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
    date: raw.date ?? raw.Date ?? '',
    description: String(raw.description ?? raw.Description ?? '').trim(),
    phase: raw.phase ?? raw.Phase ?? 'draft',
    shareCode: extractEventSharingCode(raw),
    sharingParams,
    totalVotes: Number(raw.totalVotes ?? raw.TotalVotes ?? 0) || 0,
    totalFeedback: Number(raw.totalFeedback ?? raw.TotalFeedback ?? 0) || 0,
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
     */
    async updateBrodcast(sharingParams) {
      const userStore = useUserStore()
      const loaderStore = useLoaderStore()

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
      loaderStore.show()
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

        const parsed = parseSharingParams(sharingParams)
        if (this.selectedEvent && String(this.selectedEvent.id) === String(id)) {
          this.selectedEvent = { ...this.selectedEvent, sharingParams: parsed }
        }
        return parsed
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        loaderStore.hide()
      }
    },
  },
})
