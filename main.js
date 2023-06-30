import Vue, { createApp } from '@vue/compat'
import BootstrapVue, {BIcon, BootstrapVueIcons} from 'bootstrap-vue'
import App from './components/App.vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

//var pdfjsLib = window['pdfjs-dist/build/pdf']
//pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js'
/*
const PDFJS = {};
PDFJS.workerSrc = true;
import './components/support/xtra/pdf.combined.js'
*/

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons)
Vue.component('b-icon', BIcon)

export const app = createApp(App)
app.config.globalProperties.$pdf = PDFJS//pdfjsLib
//app.config.globalProperties.$pdf.GlobalWorkerOptions.workerSrc = PDFJSWorker 

//app.config.globalProperties.$pdf = PDFJS

app.mount('#app')