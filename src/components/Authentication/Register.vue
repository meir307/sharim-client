<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card>
          <v-card-title class="popup-title d-flex align-center justify-space-between">
            הרשמה
            <v-btn icon="mdi-close" variant="text" @click="$emit('btnClose')"></v-btn>
          </v-card-title>
          <v-card-text>
            <v-text-field
              v-model="user.fullName"
              :rules="validationRules.fullNameRules"
              label="שם מלא"
              type="text"
            ></v-text-field>
            <v-text-field
              v-model="user.email"
              :rules="validationRules.emailRules"
              label="אימייל"
              type="email"
              ></v-text-field>
            <v-text-field
              v-model="user.phone"
              :rules="validationRules.phoneRules"
              label="טלפון"
              type="text"
              class="phone-input"
              @update:model-value="handlePhoneInput"
            >
            </v-text-field>

            <v-text-field
              v-model="user.password"
              :rules="validationRules.passwordRules"
              label="סיסמה"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
            >
            </v-text-field>

            <v-text-field
              v-model="confirmPassword"
              :rules="passwordConfirmRules"
              label="אימות סיסמה"
              :type="showConfirmPassword ? 'text' : 'password'"
              :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showConfirmPassword = !showConfirmPassword"
            >
            </v-text-field>

            <div class="license-agreement-section mb-2">
              <div class="d-flex align-center justify-start">
                <v-checkbox
                  v-model="agreedToLicense"
                  :rules="[(v) => !!v || 'יש לאשר את תנאי השימוש']"
                  hide-details="auto"
                  class="license-checkbox"
                ></v-checkbox>
                <span class="license-text mr-2">
                  קראתי והסכמתי ל
                  <a href="#" class="license-link" @click.prevent="openLicenseAgreement"> תנאי השימוש </a>
                </span>
              </div>
            </div>

            <div class="text-right mb-2">
              <a href="#" class="text-body-2" @click.prevent="$emit('open-login')">יש לך כבר חשבון? התחברות</a>
            </div>

            <div class="popup-btn-row">
              <v-btn color="primary" @click="regUser">הרשם</v-btn>
              <v-btn @click="$emit('btnClose')">סגור</v-btn>
              <v-spacer></v-spacer>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <LicenseAgreement :show-dialog="showLicenseDialog" @btn-close="closeLicenseAgreement" />
</template>

<script>
import * as validationRules from '@/utils/ValidationRules'
import { useUserStore } from '@/stores/UserStore'
import { restrictPhoneToDigits } from '@/utils/PhoneInput'
import LicenseAgreement from './LicenseAgreement.vue'

export default {
  name: 'RegisterComponent',
  components: {
    LicenseAgreement,
  },
  emits: ['btnClose', 'open-login'],
  data() {
    return {
      user: {
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role: 1,
      },
      validationRules,
      userStore: useUserStore(),
      showPassword: false,
      showConfirmPassword: false,
      confirmPassword: '',
      agreedToLicense: false,
      showLicenseDialog: false,
    }
  },
  computed: {
    passwordConfirmRules() {
      return [this.validationRules.required, (v) => v === this.user.password || 'הסיסמאות אינן תואמות']
    },
  },
  methods: {
    handlePhoneInput(value) {
      this.user.phone = restrictPhoneToDigits(value)
    },
    openLicenseAgreement() {
      this.showLicenseDialog = true
    },
    closeLicenseAgreement() {
      this.showLicenseDialog = false
    },
    async regUser() {
      const emailValid = this.validationRules.emailRules.every((rule) => rule(this.user.email) === true)
      const passwordValid = this.validationRules.passwordRules.every(
        (rule) => rule(this.user.password) === true,
      )
      const fullNameValid = this.validationRules.fullNameRules.every(
        (rule) => rule(this.user.fullName) === true,
      )
      const phoneValid = this.validationRules.phoneRules.every((rule) => rule(this.user.phone) === true)
      const passwordConfirmValid = this.passwordConfirmRules.every((rule) => rule(this.confirmPassword) === true)

      if (!this.agreedToLicense) {
        alert('יש לאשר את תנאי השימוש כדי להמשיך')
        return
      }

      if (emailValid && passwordValid && fullNameValid && phoneValid && passwordConfirmValid) {
        try {
          await this.userStore.register(this.user)
          this.$emit('btnClose')
        } catch (error) {}
      } else {
        alert('not valid')
      }
    },
  },
}
</script>

<style scoped>
.license-agreement-section {
  margin-top: 16px;
  margin-bottom: 16px;
  text-align: right;
  direction: rtl;
}

.license-agreement-section > div {
  justify-content: flex-start !important;
  margin-right: auto;
  margin-left: 0;
}

.license-checkbox {
  margin-top: -30px;
}

.license-text {
  margin-top: -30px;
  font-size: 14px;
  color: #333;
}

.license-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
}

.license-link:hover {
  text-decoration: underline;
}
</style>
