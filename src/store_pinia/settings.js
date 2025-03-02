import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
    const numParams = reactive({
        constant: true,
        normSmallValues: true,
        multiplicationFactor: 1,
        L1: 10,
        L2: 10,
        stepPower: 1,
    });


    return { numParams };
});

