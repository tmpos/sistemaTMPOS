// src/composables/useVirtualKeyboard.js
import { ref } from 'vue'

export function useVirtualKeyboard() {
  const visible = ref(false)
  const currentInput = ref(null)
  const type = ref('text')

  const textKeys = [
    'Q',
    'W',
    'E',
    'R',
    'T',
    'Y',
    'U',
    'I',
    'O',
    'P',
    'A',
    'S',
    'D',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'Z',
    'X',
    'C',
    'V',
    'B',
    'N',
    'M',
    ' ',
    '.',
    ','
  ]

  const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  const keys = ref(textKeys)

  const pressKey = (key) => {
    if (currentInput.value) {
      if (key === 'BACKSPACE') {
        currentInput.value.value = currentInput.value.value.slice(0, -1)
      } else if (key === 'ENTER') {
        currentInput.value.blur()
        visible.value = false
      } else {
        currentInput.value.value += key
      }
    }
  }

  const showKeyboard = (input, inputType) => {
    currentInput.value = input
    type.value = inputType
    keys.value = inputType === 'number' ? numberKeys : textKeys
    visible.value = true
  }

  const hideKeyboard = () => {
    visible.value = false
  }

  return {
    visible,
    keys,
    pressKey,
    showKeyboard,
    hideKeyboard
  }
}
