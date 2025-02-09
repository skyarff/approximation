import { createStore } from 'vuex'
import { graphics } from './modules/graphics';

export default createStore({
  state: {
    notify: {
      text: '',
      color: '',
      snackbar: false
    },
  },
  getters: {

  },
  mutations: {
    notify(state, payload) {
      state.notify = {
        text: (typeof payload == 'object') ? payload.text : payload,
        color: (typeof payload == 'object') ? payload.color : 'error',
        snackbar: true
      };
    },
    setSnackbar(state, value) {
      state.notify.snackbar = value;
    }
  },
  actions: {
    notify({ commit }, payload) {
      commit('notify', payload)
    }
  },
  modules: {
    graphics
  }
})
