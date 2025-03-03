import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
    const numParams = reactive({
        constant: true,
        normSmallValues: true,
        multiplicationFactor: 1,
        L1: 1,
        L2: 1,
        stepPower: 1,
    });


    return { numParams };
});

