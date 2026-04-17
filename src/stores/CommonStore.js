import { defineStore } from 'pinia'
import { useLoaderStore } from './LoaderStore'

function apiAddress() {
  return import.meta.env.VITE_APP_API_ADDRESS ?? import.meta.env.VITE_API_ADDRESS ?? ''
}

export const useCommonStore = defineStore('common', {
  state: () => ({
    loaderStore: useLoaderStore(),
    apiUrl: apiAddress(),
    data: null,
    error: null,
  }),
})
