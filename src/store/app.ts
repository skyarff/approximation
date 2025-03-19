import { defineStore } from 'pinia';
import { reactive } from 'vue'

interface INotify {
    text: string;
    color?: string;
    snackbar?: boolean;
    [key: string]: string | boolean;
}


export const useAppStore = defineStore('app', () => {
    const notify = reactive<INotify>({
        text: '',
        color: '',
        snackbar: false
    });

    function showEvent(payload: INotify): void {
        notify.text = payload.text;
        notify.color = payload.color ? payload.color : 'error';
        notify.snackbar = true;
    };

    function setSnackbar(value): void {
        notify.snackbar = value;
    };

    return { notify, setSnackbar, showEvent };
});