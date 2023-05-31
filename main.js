import Vue, { createApp } from '@vue/compat';
import BootstrapVue from 'bootstrap-vue';
import App from './components/App.vue';
import PDF from './components/utils';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

Vue.use(BootstrapVue);
export const app = createApp(App);
PDF.install(app);
app.mount('#app');