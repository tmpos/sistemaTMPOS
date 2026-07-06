import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Swal from 'vue-sweetalert2'
import Aura from '@primevue/themes/aura'
import Lara from '@primevue/themes/lara'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import { LoadingPlugin } from 'vue-loading-overlay'
import 'vue-loading-overlay/dist/css/index.css'

/*******************************************************/

/*******************************************************/
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
/*******************************************************/
import YoutubeIframe from '@techassi/vue-youtube-iframe'
/*******************************************************/
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
/*******************************************************/
import Multiselect from '@suadelabs/vue3-multiselect'
import '@suadelabs/vue3-multiselect/dist/vue3-multiselect.css'
/*******************************************************/
import print from 'vue3-print-nb'
/*******************************************************/

import { createI18n } from 'vue-i18n'
import idiomas from './i18n/index.js'

const i18n = createI18n({
  locale: 'es', // Idioma por defecto (español)
  fallbackLocale: 'en-US',
  legacy: false,
  globalInjection: true,
  messages: idiomas
})

import { createPinia } from 'pinia'
// Import all of Bootstrap's CSS
//import 'bootstrap/dist/css/bootstrap.css';
//import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//import '@/assets/css/estilosBootstrapToTailwin.css';
import 'bootswatch/dist/united/bootstrap.css'
import '@/assets/styles.scss'
/*import '@/assets/tailwind.css';*/
import './assets/css/fontello.css'
import 'awesomplete/awesomplete.css'

import 'primeicons/primeicons.css'
import '@/assets/tailwind.css'

/*import i18n from '@/i18n';
app.use(i18n);*/

import AutoComplete from 'primevue/autocomplete'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Avatar from 'primevue/avatar'
import AvatarGroup from 'primevue/avatargroup'
import Badge from 'primevue/badge'
import BadgeDirective from 'primevue/badgedirective'
import BlockUI from 'primevue/blockui'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Breadcrumb from 'primevue/breadcrumb'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Chart from 'primevue/chart'
import CascadeSelect from 'primevue/cascadeselect'
import Carousel from 'primevue/carousel'
import Checkbox from 'primevue/checkbox'
import Chip from 'primevue/chip'
import Chips from 'primevue/chips'
import ColorPicker from 'primevue/colorpicker'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import ConfirmDialog from 'primevue/confirmdialog'
import ConfirmPopup from 'primevue/confirmpopup'
import ContextMenu from 'primevue/contextmenu'
import DataTable from 'primevue/datatable'
import DataView from 'primevue/dataview'
import DeferredContent from 'primevue/deferredcontent'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Dock from 'primevue/dock'
import Dropdown from 'primevue/dropdown'
import DynamicDialog from 'primevue/dynamicdialog'
import Fieldset from 'primevue/fieldset'
import FileUpload from 'primevue/fileupload'
import FloatLabel from 'primevue/floatlabel'
import FocusTrap from 'primevue/focustrap'
import Galleria from 'primevue/galleria'
import IconField from 'primevue/iconfield'
import Image from 'primevue/image'
import InlineMessage from 'primevue/inlinemessage'
import Inplace from 'primevue/inplace'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import InputIcon from 'primevue/inputicon'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import InputMask from 'primevue/inputmask'
import InputNumber from 'primevue/inputnumber'
import Knob from 'primevue/knob'
import Listbox from 'primevue/listbox'
import MegaMenu from 'primevue/megamenu'
import Menu from 'primevue/menu'
import Menubar from 'primevue/menubar'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import OrderList from 'primevue/orderlist'
import OrganizationChart from 'primevue/organizationchart'
import OverlayPanel from 'primevue/overlaypanel'
import Paginator from 'primevue/paginator'
import Panel from 'primevue/panel'
import PanelMenu from 'primevue/panelmenu'
import Password from 'primevue/password'
import PickList from 'primevue/picklist'
import ProgressBar from 'primevue/progressbar'
import ProgressSpinner from 'primevue/progressspinner'
import Rating from 'primevue/rating'
import RadioButton from 'primevue/radiobutton'
import Ripple from 'primevue/ripple'
import Row from 'primevue/row'
import SelectButton from 'primevue/selectbutton'
import ScrollPanel from 'primevue/scrollpanel'
import ScrollTop from 'primevue/scrolltop'
import Skeleton from 'primevue/skeleton'
import Slider from 'primevue/slider'
import Sidebar from 'primevue/sidebar'
import SpeedDial from 'primevue/speeddial'
import SplitButton from 'primevue/splitbutton'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import Steps from 'primevue/steps'
import StyleClass from 'primevue/styleclass'
import TabMenu from 'primevue/tabmenu'
import TieredMenu from 'primevue/tieredmenu'
import Textarea from 'primevue/textarea'
import Toast from 'primevue/toast'
import Toolbar from 'primevue/toolbar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Terminal from 'primevue/terminal'
import Timeline from 'primevue/timeline'
import ToggleButton from 'primevue/togglebutton'
import Tooltip from 'primevue/tooltip'
import Tree from 'primevue/tree'
import TreeSelect from 'primevue/treeselect'
import TreeTable from 'primevue/treetable'
import VirtualScroller from 'primevue/virtualscroller'

import 'datatables.net-buttons-dt'
import 'datatables.net-bs5'
//import 'bootstrap';
import 'datatables.net-bs5/css/dataTables.bootstrap5.css'
import 'datatables.net-buttons-dt/css/buttons.dataTables.css'

//import './assets/css/fontello.css';
//import './assets/css/datepicker.css';
//import './assets/css/datepickerComplemento.css';
import './assets/js/jquery.js'
//import './assets/js/datepicker.js';
//import './assets/js/datepickerEspa.js';
import 'primeicons/primeicons.css'

const pinia = createPinia()

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: Lara,
    options: {
      darkModeSelector: '.app-dark'
    }
  },
  locale: {
    firstDayOfWeek: 1,
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
    monthNames: [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre'
    ],
    monthNamesShort: [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ],
    today: 'Hoy',
    clear: 'Limpiar',
    dateFormat: 'dd/mm/yy', // Formato de fecha
    weekHeader: 'Sm'
  }
})
app.use(Swal)
app.use(ToastService)
app.use(ConfirmationService)
app.use(pinia)
app.use(LoadingPlugin)
app.use(YoutubeIframe)
app.use(print)

app.directive('tooltip', Tooltip)
app.directive('badge', BadgeDirective)
app.directive('ripple', Ripple)
app.directive('styleclass', StyleClass)
app.directive('focustrap', FocusTrap)

/*****************************************************************************/
app.directive('codigo-automatico', {
  mounted(el, binding) {
    const generarCodigo = () => {
      const timestamp = Date.now().toString().slice(-10) // Últimos 10 números del tiempo
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let aleatorio = ''
      for (let i = 0; i < 4; i++) {
        aleatorio += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
      }
      return `${timestamp}${aleatorio}`
    }

    const tiempoEspera = binding?.value || 1000 // ⏳ Espera en milisegundos (por defecto 2 segundos)

    setTimeout(() => {
      const codigoGenerado = generarCodigo()
      el.value = codigoGenerado // ✅ Asignamos el valor después del tiempo
      el.dispatchEvent(new Event('input', { bubbles: true })) // 🔥 Actualizamos v-model
    }, tiempoEspera)
  }
})
/*****************************************************************************/
app.directive('tecladovirtual', {
  mounted(el, binding) {
    el.addEventListener('focus', (event) => {
      if (binding.value && typeof binding.value === 'function') {
        binding.value(event) // Pasar el evento focus a la función
      }
    })
  },
  beforeUnmount(el) {
    el.removeEventListener('focus', () => {})
  }
})
/*****************************************************************************/
//app.directive('tecladovirtual', tecladoVirtualDirective);
/*****************************************************************************/
app.directive('mayuscula', {
  beforeMount(el) {
    let timeout = null

    el.addEventListener('input', () => {
      clearTimeout(timeout) // Resetea el temporizador en cada tecla
      timeout = setTimeout(() => {
        el.value = el.value.toUpperCase() // Convierte a mayúsculas
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})

/*****************************************************************************/
app.directive('primeramayusc', {
  beforeMount(el) {
    let timeout = null

    el.addEventListener('input', () => {
      clearTimeout(timeout) // Reinicia el temporizador en cada tecla
      timeout = setTimeout(() => {
        el.value = el.value
          .toLowerCase() // Convierte todo a minúsculas primero
          .replace(/\b\w/g, (letra) => letra.toUpperCase()) // Capitaliza la primera letra de cada palabra
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})

/*****************************************************************************/
app.directive('minuscula', {
  beforeMount(el) {
    let timeout = null

    el.addEventListener('input', () => {
      clearTimeout(timeout) // Resetea el temporizador en cada input
      timeout = setTimeout(() => {
        el.value = el.value.toLowerCase().replace(/\s+/g, '') // Convierte a minúsculas y elimina espacios
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})

/*****************************************************************************/
app.directive('sin-espacios', {
  beforeMount(el) {
    let timeout = null

    el.addEventListener('input', () => {
      clearTimeout(timeout) // Reinicia el temporizador en cada tecla
      timeout = setTimeout(() => {
        el.value = el.value.replace(/\s+/g, '_') // Reemplaza espacios por _
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})
/*****************************************************************************/
app.directive('no-espacios', {
  beforeMount(el) {
    let timeout = null

    el.addEventListener('input', () => {
      clearTimeout(timeout) // Reinicia el temporizador en cada tecla
      timeout = setTimeout(() => {
        el.value = el.value.replace(/\s+/g, '') // Elimina los espacios
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})
/*****************************************************************************/
app.directive('mayusculablur', {
  beforeMount(el) {
    el.addEventListener('blur', () => {
      el.value = el.value.toUpperCase()
      el.dispatchEvent(new Event('input')) // Sincroniza el v-model
    })
  }
})
/*****************************************************************************/
app.directive('solonumeros', {
  beforeMount(el) {
    el.oninput = function (e) {
      let value = e.target.value.replace(/[^\d.-]/g, '')
      if (e.target.value !== value) {
        e.target.value = value
        el.dispatchEvent(new Event('input'))
      }
    }
  }
})
/*****************************************************************************/
app.directive('solonumeros-demorado', {
  beforeMount(el) {
    let timeout = null
    el.addEventListener('input', () => {
      clearTimeout(timeout) // Reinicia el temporizador en cada tecla
      timeout = setTimeout(() => {
        el.value = el.value.replace(/\D/g, '') // Elimina cualquier cosa que no sea un número
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})

/*****************************************************************************/
app.directive('sololetras', {
  beforeMount(el) {
    let timeout = null
    el.addEventListener('input', () => {
      clearTimeout(timeout) // Reinicia el temporizador en cada tecla
      timeout = setTimeout(() => {
        el.value = el.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') // Permite solo letras y espacios
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})

/*****************************************************************************/
app.directive('decimales', {
  beforeMount(el) {
    el.onblur = function () {
      let valor = Number(el.value)
      let decimal = valor.toFixed(2)
      el.value = decimal
    }
  }
})
/*****************************************************************************/

app.directive('numero-decimal-demorado', {
  beforeMount(el) {
    let timeout = null

    el.addEventListener('input', () => {
      clearTimeout(timeout) // Reinicia el temporizador en cada tecla
      timeout = setTimeout(() => {
        let num = parseFloat(el.value.replace(/[^0-9.]/g, '')) // Convierte a número y elimina caracteres inválidos
        if (!isNaN(num)) {
          el.value = num.toFixed(2) // Formatea a dos decimales
        } else {
          el.value = '' // Si no es un número válido, deja el campo vacío
        }
        el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
      }, 500) // 500ms de espera antes de aplicar el cambio
    })
  }
})

/*****************************************************************************/
app.directive('focus-in-focus-out', {
  beforeMount(el) {
    // Evento cuando el input recibe el foco
    el.addEventListener('focus', () => {
      setTimeout(() => {
        el.select() // Selecciona todo el contenido del input
      }, 0)
    })

    // Evento cuando el input pierde el foco
    el.addEventListener('blur', () => {
      let num = parseFloat(el.value.replace(/[^0-9.]/g, '')) // Convierte a número
      if (isNaN(num)) {
        num = 0.0 // Si el campo está vacío o tiene caracteres inválidos, asigna 0.00
      }
      el.value = num.toFixed(2) // Formatea a dos decimales
      el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
    })
  }
})

/*****************************************************************************/
app.directive('numeroFocusinOut', {
  beforeMount(el) {
    // Evento cuando el input recibe el foco
    el.addEventListener('focus', () => {
      setTimeout(() => {
        el.select() // Selecciona todo el contenido del input
      }, 0)
    })

    // Evento cuando el input pierde el foco
    el.addEventListener('blur', () => {
      let num = parseFloat(el.value.replace(/[^0-9.]/g, '')) // Convierte a número
      if (isNaN(num)) {
        num = 0.0 // Si el campo está vacío o tiene caracteres inválidos, asigna 0.00
      }
      el.value = num.toFixed(2) // Formatea a dos decimales
      el.dispatchEvent(new Event('input', { bubbles: true })) // Para actualizar v-model
    })
  }
})
/*****************************************************************************/
app.directive('only-alphanumeric', {
  beforeMount(el) {
    el.addEventListener('input', () => {
      el.value = el.value.replace(/[^a-zA-Z0-9]/g, '')
      el.dispatchEvent(new Event('input'))
    })
  }
})

/*****************************************************************************/
app.directive('max-length', {
  beforeMount(el, binding) {
    el.addEventListener('input', () => {
      if (el.value.length > binding.value) {
        el.value = el.value.slice(0, binding.value)
        el.dispatchEvent(new Event('input')) // Para actualizar v-model
      }
    })
  }
})

/*****************************************************************************/
app.directive('prevent-paste', {
  beforeMount(el) {
    el.addEventListener('paste', (event) => {
      event.preventDefault()
    })
  }
})

/*****************************************************************************/
app.directive('debounce', {
  beforeMount(el, binding) {
    let timeout = null
    el.addEventListener('input', () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (binding.value) binding.value(el.value) // Ejecuta la función enlazada con el valor actual
      }, binding.arg || 500) // Usa el valor del argumento como tiempo de espera
    })
  }
})

/*****************************************************************************/
app.directive('copy-on-click', {
  beforeMount(el) {
    el.addEventListener('click', () => {
      el.select()
      document.execCommand('copy')
    })
  }
})

/*****************************************************************************/
app.directive('enter-submit', {
  beforeMount(el, binding) {
    el.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault() // Evita salto de línea en inputs tipo textarea
        if (binding.value) binding.value() // Ejecuta la función enlazada
      }
    })
  }
})

/*****************************************************************************/
app.directive('auto-focus', {
  mounted(el) {
    el.focus()
  }
})

/*****************************************************************************/
app.directive('auto-uppercase', {
  beforeMount(el) {
    el.addEventListener('input', () => {
      el.value = el.value.toUpperCase()
      el.dispatchEvent(new Event('input'))
    })
  }
})

/*****************************************************************************/
app.directive('auto-lowercase', {
  beforeMount(el) {
    el.addEventListener('input', () => {
      el.value = el.value.toLowerCase()
      el.dispatchEvent(new Event('input'))
    })
  }
})

/*****************************************************************************/
app.directive('prevent-double-click', {
  beforeMount(el) {
    el.addEventListener('click', (event) => {
      el.disabled = true
      setTimeout(() => {
        el.disabled = false
      }, 2000) // Bloquea por 2 segundos
    })
  }
})

/*****************************************************************************/
app.directive('click-outside', {
  beforeMount(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value() // Llama a la función asociada
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  }
})

/*****************************************************************************/
app.directive('phone-format', {
  beforeMount(el) {
    el.addEventListener('input', () => {
      let numbers = el.value.replace(/\D/g, '') // Elimina todo excepto números
      let formatted = numbers.replace(/^(\d{3})(\d{3})?(\d{4})?/, (match, p1, p2, p3) => {
        return p3 ? `(${p1}) ${p2}-${p3}` : p2 ? `(${p1}) ${p2}` : `(${p1}`
      })
      el.value = formatted
      el.dispatchEvent(new Event('input'))
    })
  }
})

/*****************************************************************************/
app.directive('credit-card-mask', {
  beforeMount(el) {
    el.addEventListener('input', () => {
      let numbers = el.value.replace(/\D/g, '') // Solo deja números
      el.value = numbers.replace(/(\d{4})/g, '$1 ').trim() // Agrupa en bloques de 4
      el.dispatchEvent(new Event('input'))
    })
  }
})

/*****************************************************************************/

/*****************************************************************************/

app.component('Accordion', Accordion)
app.component('AccordionTab', AccordionTab)
app.component('AutoComplete', AutoComplete)
app.component('Avatar', Avatar)
app.component('AvatarGroup', AvatarGroup)
app.component('Badge', Badge)
app.component('BlockUI', BlockUI)
app.component('Breadcrumb', Breadcrumb)
app.component('Button', Button)
app.component('ButtonGroup', ButtonGroup)
app.component('Calendar', Calendar)
app.component('Card', Card)
app.component('Chart', Chart)
app.component('Carousel', Carousel)
app.component('CascadeSelect', CascadeSelect)
app.component('Checkbox', Checkbox)
app.component('Chip', Chip)
app.component('Chips', Chips)
app.component('ColorPicker', ColorPicker)
app.component('Column', Column)
app.component('ColumnGroup', ColumnGroup)
app.component('ConfirmDialog', ConfirmDialog)
app.component('ConfirmPopup', ConfirmPopup)
app.component('ContextMenu', ContextMenu)
app.component('DataTable', DataTable)
app.component('DataView', DataView)
app.component('DeferredContent', DeferredContent)
app.component('Dialog', Dialog)
app.component('Divider', Divider)
app.component('Dock', Dock)
app.component('Dropdown', Dropdown)
app.component('DynamicDialog', DynamicDialog)
app.component('Fieldset', Fieldset)
app.component('FileUpload', FileUpload)
app.component('FloatLabel', FloatLabel)
app.component('Galleria', Galleria)
app.component('IconField', IconField)
app.component('Image', Image)
app.component('InlineMessage', InlineMessage)
app.component('Inplace', Inplace)
app.component('InputGroup', InputGroup)
app.component('InputGroupAddon', InputGroupAddon)
app.component('InputIcon', InputIcon)
app.component('InputMask', InputMask)
app.component('InputNumber', InputNumber)
app.component('InputSwitch', InputSwitch)
app.component('InputText', InputText)
app.component('Knob', Knob)
app.component('Listbox', Listbox)
app.component('MegaMenu', MegaMenu)
app.component('Menu', Menu)
app.component('Menubar', Menubar)
app.component('Message', Message)
app.component('MultiSelect', MultiSelect)
app.component('OrderList', OrderList)
app.component('OrganizationChart', OrganizationChart)
app.component('OverlayPanel', OverlayPanel)
app.component('Paginator', Paginator)
app.component('Panel', Panel)
app.component('PanelMenu', PanelMenu)
app.component('Password', Password)
app.component('PickList', PickList)
app.component('ProgressBar', ProgressBar)
app.component('ProgressSpinner', ProgressSpinner)
app.component('RadioButton', RadioButton)
app.component('Rating', Rating)
app.component('Row', Row)
app.component('SelectButton', SelectButton)
app.component('ScrollPanel', ScrollPanel)
app.component('ScrollTop', ScrollTop)
app.component('Slider', Slider)
app.component('Sidebar', Sidebar)
app.component('Skeleton', Skeleton)
app.component('SpeedDial', SpeedDial)
app.component('SplitButton', SplitButton)
app.component('Splitter', Splitter)
app.component('SplitterPanel', SplitterPanel)
app.component('Steps', Steps)
app.component('TabMenu', TabMenu)
app.component('TabView', TabView)
app.component('TabPanel', TabPanel)
app.component('Tag', Tag)
app.component('Textarea', Textarea)
app.component('Terminal', Terminal)
app.component('TieredMenu', TieredMenu)
app.component('Timeline', Timeline)
app.component('Toast', Toast)
app.component('Toolbar', Toolbar)
app.component('ToggleButton', ToggleButton)
app.component('Tree', Tree)
app.component('TreeSelect', TreeSelect)
app.component('TreeTable', TreeTable)
app.component('VirtualScroller', VirtualScroller)
app.component('QuillEditor', QuillEditor)

app.component('FlatPickr', flatPickr)
app.component('MultiselectTM', Multiselect)

router.isReady().then(() => {
  app.mount('#app')
})
