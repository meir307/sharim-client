import { defineStore } from 'pinia'
import axios from 'axios'
import { useUserStore, normalizeUserPlaylistsAndEmitCode } from './UserStore'

/** Same-document concurrent dedupe (e.g. Vue dev Strict Mode double `onMounted`). */
let guestRequestSharingInflight = null

export const useSharingStore = defineStore('SharingStore', {
  state: () => ({
    /** Full or relative URL returned by `sharing/guestResolve` after a guest submits a sharing code. */
    guestLyricsLink: '',
    /** Last sharing code used successfully (for display). */
    guestEmitCode: '',
  }),

  actions: {
    clearGuestLyricsSession() {
      this.guestLyricsLink = ''
      this.guestEmitCode = ''
    },

    /**
     * `POST sharing/RequestSharing` with `{ emitCode }`.
     * On HTTP error (e.g. 400) the server sends `{ success: false, message, errorMessage }` — we throw that text for the UI.
     * On HTTP success, response body is used as-is: `guestLyricsLink` ← `data.link` (stringify / trim only).
     */
    async submitGuestSharingCode(code) {
      const userStore = useUserStore()
      const trimmed = String(code ?? '').trim()
      if (!trimmed) {
        throw new Error('יש להזין קוד שיתוף')
      }

      if (
        guestRequestSharingInflight &&
        guestRequestSharingInflight.code === trimmed
      ) {
        return guestRequestSharingInflight.promise
      }

      const run = async () => {
        try {
          const { data } = await axios.post(
            userStore.apiUrl + 'sharing/RequestSharing',
            { emitCode: trimmed },
          )
          this.guestLyricsLink = String(data?.link ?? '').trim()
          this.guestEmitCode = trimmed
          return { link: this.guestLyricsLink }
        } catch (error) {
          const resData = error?.response?.data ?? {}
          const message = String(resData.message ?? resData.errorMessage ?? '').trim()
          throw new Error(
            message || 'לא ניתן להתחבר לשיתוף. בדקו את הקוד ונסו שוב.',
          )
        }
      }

      const promise = run()
      guestRequestSharingInflight = { code: trimmed, promise }
      promise.finally(() => {
        if (guestRequestSharingInflight?.promise === promise) {
          guestRequestSharingInflight = null
        }
      })
      return promise
    },

    /**
     * `POST sharing/refreshLyrics` with `{ emitCode }`. On success sets `guestLyricsLink` from `data.link` only.
     * Errors are ignored (used for guest polling).
     */
    async refreshLyrics() {
      const userStore = useUserStore()
      
      try {
        const { data } = await axios.post(
          userStore.apiUrl + 'sharing/refreshLyrics',
          { emitCode: this.guestEmitCode },
        )
        if (this.guestLyricsLink != String(data?.link ?? '').trim())
        {
          this.guestLyricsLink = String(data?.link ?? '').trim()
        }
      } catch {
        /* poll: leave previous link */
      }
    },

    /**
     * `POST song/updateActiveLink` with `{ link }` — current lyrics URL shown in the player.
     * No global loader; failures are ignored (used when switching songs / opening the dialog).
     */
    async updateActiveLink(link) {
      console.log("updateActiveLink", link)
      const userStore = useUserStore()
      const trimmed = String(link ?? '').trim()
      if (!trimmed || !userStore.user?.isAuthenticated || !userStore.user?.sessionId) return
      try {
        await axios.post(
          userStore.apiUrl + 'sharing/updateActiveLink',
          { link: trimmed },
          {
            headers: {
              sessionId: userStore.user.sessionId || '',
            },
          },
        )
      } catch {
        /* non-blocking */
      }
    },

    /**
     * Turn guest lyrics sharing on or off via the server (`sharing/sharingAction`).
     * Body: `{ startSharing: true }` to start, `{ startSharing: false }` to stop.
     *
     * After a successful HTTP response (empty body is fine): set `user.sharingActive` to the
     * same value you sent (`active`), then normalize, patch the user store, and persist to localStorage.
     *
     * @param {boolean} active true = start sharing, false = stop
     * @returns {Promise<{ sharingActive: boolean } | null>} `null` if not logged in; otherwise the resolved guest-sharing flag after sync
     */
    async setGuestSharingActive(active) {
      const userStore = useUserStore()
      if (!userStore.user || typeof userStore.user !== 'object' || !userStore.user.isAuthenticated) {
        return null
      }
      userStore.preAction()
      try {
        await axios.post(
          userStore.apiUrl + 'sharing/sharingAction',
          { startSharing: Boolean(active) },
          {
            headers: {
              sessionId: userStore.user.sessionId || '',
            },
          },
        )
        const next = { ...userStore.user, sharingActive: Boolean(active) }
        normalizeUserPlaylistsAndEmitCode(next)
        userStore.$patch({ user: next })
        localStorage.setItem('user', JSON.stringify(userStore.user))
        return { sharingActive: userStore.sharingActive }
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        userStore.$patch({ error: message })
        throw error
      } finally {
        userStore.postAction()
      }
    },
  },
})
