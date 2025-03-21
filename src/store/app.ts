import { defineStore } from 'pinia';
import { reactive } from 'vue'

interface INotify {
    text: string;
    color?: string;
    snackbar?: boolean;
    [key: string]: string | boolean;
}


export const useAppStore = defineStore('app', () => {
    const notify: INotify = reactive({
        text: '',
        color: '',
        snackbar: false
    });

    function showEvent(payload: INotify) {
        notify.text = payload.text;
        notify.color = payload.color ? payload.color : 'error';
        notify.snackbar = true;
    };

    function setSnackbar(value) {
        notify.snackbar = value;
    };

    return { notify, setSnackbar, showEvent };
});