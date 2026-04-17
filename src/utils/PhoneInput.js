/**
 * Restricts phone input to digits only
 * Usage: @input="handlePhoneInput" with handlePhoneInput(value) { this.user.phone = restrictPhoneToDigits(value) }
 */
export function restrictPhoneToDigits(value) {
  if (typeof value === 'string') {
    return value.replace(/\D/g, '')
  }

  if (value && value.target) {
    const input = value.target
    const originalValue = input.value
    const digitsOnly = originalValue.replace(/\D/g, '')

    if (originalValue !== digitsOnly) {
      input.value = digitsOnly
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      ).set
      nativeInputValueSetter.call(input, digitsOnly)
      const inputEvent = new Event('input', { bubbles: true })
      input.dispatchEvent(inputEvent)
    }
    return digitsOnly
  }

  return value
}
