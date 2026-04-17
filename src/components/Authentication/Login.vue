<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="popup-title d-flex align-center justify-space-between">
            כניסה
            <v-btn icon="mdi-close" variant="text" @click="$emit('btnClose')"></v-btn>
          </v-card-title>
          <v-card-text>
            <v-text-field
              ref="emailField"
              v-model="email"
              label="אימייל"
              type="email"
              required
              @keyup.enter="focusPassword"
            ></v-text-field>
            <v-text-field
              ref="passwordField"
              v-model="password"
              label="סיסמה"
              :type="showPassword ? 'text' : 'password'"
              required
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              @keyup.enter="login"
            ></v-text-field>

            <div class="text-right mt-2 mb-4">
              <a href="#" class="forgot-password-link" @click.prevent="openForgotPassword"> שכחתי סיסמה </a>
            </div>

            <div class="text-right mb-4">
              <a href="#" class="forgot-password-link" @click.prevent="openRegister"> אין לך חשבון? הרשמה </a>
            </div>

            <div class="popup-btn-row">
              <v-btn color="primary" @click="login">התחבר</v-btn>
              <v-btn @click="$emit('btnClose')">סגור</v-btn>
              <v-spacer></v-spacer>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useUserStore } from '@/stores/UserStore'

export default {
  name: 'LoginComponent',
  emits: ['btnClose', 'forgot-password', 'open-register'],
  data: () => ({
    email: '',
    password: '',
    showPassword: false,
  }),
  methods: {
    openForgotPassword() {
      this.$emit('forgot-password')
    },
    openRegister() {
      this.$emit('open-register')
    },
    focusPassword() {
      this.$nextTick(() => {
        this.$refs.passwordField.focus()
      })
    },

    getClientType() {
      const userAgent = navigator.userAgent.toLowerCase()

      if (/android|iphone|ipad|ipod|blackberry|windows phone/.test(userAgent)) {
        return 3
      }
      if (/tablet|ipad/.test(userAgent)) {
        return 2
      }
      return 1
    },

    async login() {
      try {
        const userStore = useUserStore()
        await userStore.login({
          email: this.email,
          password: this.password,
          clientType: this.getClientType(),
        })

        if (userStore.user.isAuthenticated) {
          this.$emit('btnClose')
          this.$router.push({ name: 'songs' })
        }
      } catch (error) {
        console.error('Login error:', error)
      }
    },
  },
}
</script>

<style scoped>
.forgot-password-link {
  color: #1976d2;
  text-decoration: none;
  font-size: 0.875rem;
  cursor: pointer;
}

.forgot-password-link:hover {
  text-decoration: underline;
}
</style>
