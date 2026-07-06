// src/directives/tecladovirtual.js
import { createApp } from 'vue'
import VirtualKeyboard from '../components/TecladoVirtual.vue'
import { useVirtualKeyboard } from '../composables/useVirtualKeyboard'

let virtualKeyboardInstance = null
const { showKeyboard, hideKeyboard } = useVirtualKeyboard()

const tecladoVirtualDirective = {
  beforeMount(el, binding) {
    el.addEventListener('focus', () => {
      if (!virtualKeyboardInstance) {
        const app = createApp(VirtualKeyboard)
        virtualKeyboardInstance = app.mount(document.createElement('div'))
        document.body.appendChild(virtualKeyboardInstance.$el)
      }
      showKeyboard(el, binding.value)
    })

    el.addEventListener('blur', () => {
      hideKeyboard()
    })
  }
}

export default tecladoVirtualDirective
