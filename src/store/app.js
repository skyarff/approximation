import { defineStore } from 'pinia';
import { reactive } from 'vue'

export const useAppStore = defineStore('app', () => {
    const notify = reactive({
        notify: {
            text: '',
            color: '',
            snackbar: false
        },
    });

    function showEvent(payload) {
        console.log('showEventS')

        notify.text = (typeof payload == 'object') ? payload.text : payload;
        notify.color = (typeof payload == 'object') ? payload.color : 'error';
        notify.snackbar = true;   
    };

    function setSnackbar(value) {
        notify.snackbar = value;
    };

    return { notify, setSnackbar, showEvent };
});