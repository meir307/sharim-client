import axios from 'axios'
import router from '@/router'
import { useUserStore } from '@/stores/UserStore'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.message || error.message || ''

    if (
      errorMessage.includes('Session not found') ||
      errorMessage.includes('Session not found or expired') ||
      errorMessage.includes('expired')
    ) {
      const userStore = useUserStore()
      userStore.logout()
      router.push({ name: 'home' }).then(() => {
        alert('התנתקת מהמערכת. אנא התחבר מחדש.')
      })
    }

    return Promise.reject(error)
  },
)

export default axios
