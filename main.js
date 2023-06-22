import Vue, { createApp } from '@vue/compat';
import BootstrapVue, {BIcon, BootstrapVueIcons} from 'bootstrap-vue';
import App from './components/App.vue';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';


Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons)
Vue.component('b-icon', BIcon)

export const app = createApp(App);
app.config.globalProperties.$pdf = pdfjsLib;
app.config.globalProperties.$pdf.GlobalWorkerOptions.workerSrc = pdfjsWorker; 

app.mount('#app');