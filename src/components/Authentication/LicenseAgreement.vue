<template>
  <v-dialog v-model="dialog" max-width="900px" persistent>
    <v-card>
      <v-card-title class="popup-title d-flex align-center justify-space-between">
        תנאי שימוש
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>
      <v-card-text>
        <div class="license-content" dir="rtl">
          <div v-html="displayText" class="text-body-1"></div>
        </div>

        <div class="popup-btn-row mt-4">
          <v-btn color="primary" @click="closeDialog">סגור</v-btn>
          <v-spacer></v-spacer>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'LicenseAgreement',
  props: {
    showDialog: {
      type: Boolean,
      default: false,
    },
    agreementText: {
      type: String,
      default: '',
    },
  },
  emits: ['btnClose'],
  data() {
    return {
      dialog: false,
      defaultAgreementText: `
        <h3 class="mb-4">תנאי שימוש במערכת Sharim</h3>

        <p class="mb-3">
          <strong>1. הגדרות</strong><br>
          המערכת "Sharim" מסופקת לשימוש לפי התנאים המפורטים להלן.
        </p>

        <p class="mb-3">
          <strong>2. זכויות יוצרים</strong><br>
          כל הזכויות במערכת, כולל קוד המקור, עיצוב, ממשק משתמש ותכנים, שמורות לבעלי המערכת, אלא אם הוסכם אחרת בכתב.
        </p>

        <p class="mb-3">
          <strong>3. שימוש מותר</strong><br>
          המשתמש רשאי להשתמש במערכת בהתאם למטרותיה המוצהרות ובהתאם לדין החל.
        </p>

        <p class="mb-3">
          <strong>4. אחריות</strong><br>
          המערכת מסופקת "כפי שהיא". אין אחריות למקרים שבהם השירות אינו זמין או מתנהל בצורה שאינה לשביעות רצונך המלאה.
        </p>

        <p class="mb-3">
          <strong>5. שמירת סודיות</strong><br>
          המשתמש מתחייב לשמור על סודיות פרטי הגישה למערכת ולא לחשוף אותם לצדדים שלישיים.
        </p>

        <p class="mb-3">
          <strong>6. שינויים בהסכם</strong><br>
          בעלי המערכת רשאים לעדכן את תנאי השימוש מעת לעת. המשך שימוש מהווה הסכמה לתנאים המעודכנים.
        </p>

        <p class="mb-3">
          <strong>7. חוק שולט</strong><br>
          הסכם זה כפוף לדיני מדינת ישראל.
        </p>
      `,
    }
  },
  watch: {
    showDialog(newVal) {
      this.dialog = newVal
    },
    dialog(newVal) {
      if (!newVal) {
        this.$emit('btnClose')
      }
    },
  },
  computed: {
    displayText() {
      return this.agreementText || this.defaultAgreementText
    },
  },
  methods: {
    closeDialog() {
      this.dialog = false
    },
  },
}
</script>

<style scoped>
.license-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
  line-height: 1.8;
}

.license-content h3 {
  color: #1976d2;
  font-weight: bold;
}

.license-content p {
  margin-bottom: 16px;
  text-align: right;
}

.license-content strong {
  color: #333;
  font-weight: bold;
}

.license-content::-webkit-scrollbar {
  width: 8px;
}

.license-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.license-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.license-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
