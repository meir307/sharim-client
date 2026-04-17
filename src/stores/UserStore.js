import { defineStore } from 'pinia'
import axios from 'axios'
import { useLoaderStore } from './LoaderStore'

export const useUserStore = defineStore('UserStore', {
  state: () => ({
    apiUrl: import.meta.env.VITE_APP_API_ADDRESS ?? import.meta.env.VITE_API_ADDRESS ?? '',
    loaderStore: useLoaderStore(),
    user: (() => {
      const stored = localStorage.getItem('user')
      return stored && stored !== 'undefined' ? JSON.parse(stored) : {}
    })(),
    error: null,
  }),

  getters: {
    apiUrl1: (state) => state.apiUrl,
  },

  actions: {
    async login(credentials) {
      this.preAction()
      try {
        const response = await axios.post(this.apiUrl + 'user/login', credentials)
        this.user = response.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    async register(userData) {
      this.preAction()
      try {
        const response = await axios.post(this.apiUrl + 'user/register', userData)
        this.user = response.data.user
        localStorage.setItem('user', JSON.stringify(this.user))
        alert('הרשמה בוצעה בהצלחה.')
        console.log(response)
        return response
      } catch (error) {
        const message = error.response?.data?.message || 'Registration failed'
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    async upsertSong(songData) {
      this.preAction()
      try {
        const payload = {
          ...songData,
          cords: typeof songData.cords === 'string' ? JSON.parse(songData.cords) : songData.cords,
        }

        const response = await axios.post(this.apiUrl + 'song/upsert', payload, {
          headers: {
            sessionId: this.user.sessionId || '',
          },
        })

        return response
      } catch (error) {
        const message = error.response?.data?.message ?? error.message
        alert(message)
        this.error = message
        throw error
      } finally {
        this.postAction()
      }
    },

    logout() {
      this.user = {}
      localStorage.removeItem('user')
    },

    preAction() {
      this.loaderStore.show()
    },

    postAction() {
      this.loaderStore.hide()
    },
  },
})
