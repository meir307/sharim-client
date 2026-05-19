import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore } from './UserStore'
import { normalizeEventFromApi } from './eventStore'
import { broadcastModeFromSharingParams } from '@/utils/eventSharingModel.js'

function eventFromResponseData(data) {
  if (!data || typeof data !== 'object') return null
  if (data.success === false || data.Success === false) {
    const message =
      data.errorMessage ?? data.ErrorMessage ?? data.message ?? data.Message ?? 'הפעולה נכשלה'
    throw new Error(String(message))
  }
  const raw = data.event ?? data.Event ?? data
  return normalizeEventFromApi(raw)
}

export const useGuestStore = defineStore('GuestStore', {
  state: () => ({
    loading: false,
    error: '',
    sharingCode: '',
    eventName: '',
    sharingParams: null,
    broadcastMode: 'landing',
  }),

  actions: {
  /**
   * `POST event/FetchGuestEvent` by sharing code (`?ev=`).
   * @param {string} sharingCode
   */
    async loadBySharingCode(sharingCode) {
      const userStore = useUserStore()
      const code = String(sharingCode ?? '').trim()
      if (!code) {
        this.error = 'חסר קוד שיתוף בקישור'
        this.sharingParams = null
        return
      }

      this.loading = true
      this.error = ''
      this.sharingCode = code

      try {
        const response = await axios.post(userStore.apiUrl + 'event/FetchGuestEvent', {
          sharingCode: code,
        })
        const event = eventFromResponseData(response.data)
        if (!event) {
          throw new Error('אירוע לא נמצא')
        }
        this.eventName = String(event.name ?? '').trim() || 'אירוע'
        this.sharingParams = event.sharingParams ?? null
        this.broadcastMode = broadcastModeFromSharingParams(this.sharingParams)
      } catch (err) {
        const resData = err?.response?.data ?? {}
        this.error = String(
          resData.message ?? resData.errorMessage ?? err?.message ?? 'לא ניתן לטעון את האירוע',
        ).trim()
        this.eventName = ''
        this.sharingParams = null
        this.broadcastMode = 'landing'
      } finally {
        this.loading = false
      }
    },

    reset() {
      this.loading = false
      this.error = ''
      this.sharingCode = ''
      this.eventName = ''
      this.sharingParams = null
      this.broadcastMode = 'landing'
    },
  },
})
