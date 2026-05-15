import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { he } from 'vuetify/locale'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  locale: {
    locale: 'he',
    fallback: 'en',
    messages: { he },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#0f1117',
          surface: '#1a1d27',
          'surface-bright': '#242836',
          'surface-light': '#1f2330',
          'surface-variant': '#2a2f3d',
          'on-surface-variant': '#b8bcc8',
          primary: '#5c6bc8',
          'primary-darken-1': '#4a5280',
          secondary: '#7e57a8',
          error: '#f44336',
          info: '#5eb8ff',
          success: '#66bb6a',
          warning: '#ffb74d',
        },
        variables: {
          'border-color': '#ffffff',
          'border-opacity': 0.12,
          'high-emphasis-opacity': 0.92,
          'medium-emphasis-opacity': 0.7,
          'disabled-opacity': 0.38,
          'idle-opacity': 0.1,
          'hover-opacity': 0.08,
          'focus-opacity': 0.12,
          'selected-opacity': 0.16,
          'activated-opacity': 0.24,
          'pressed-opacity': 0.16,
          'dragged-opacity': 0.08,
          'theme-overlay-multiplier': 1,
        },
      },
    },
  },
})
