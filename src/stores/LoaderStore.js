import { defineStore } from 'pinia'

export const useLoaderStore = defineStore('loader', {
  state: () => ({
    loader: false,
  }),
  actions: {
    show() {
      this.loader = true
    },
    hide() {
      this.loader = false
    },
  },
})
