import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// import store from './store';

import { createPinia } from 'pinia';

import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';

loadFonts();

const pinia = createPinia();
// .use(store)

createApp(App)
  .use(router)
  .use(pinia)
  .use(vuetify)
  .mount('#app');










