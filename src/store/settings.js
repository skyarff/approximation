import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSettingsStore = defineStore('settings', () => {

    const defNumParams = {
        constant: true,
        normSmallValues: true,
        multiplicationFactor: 1,
        L1: 1,
        L2: 1,
        stepPower: 1,
    };

    const numParams = ref({
        constant: true,
        normSmallValues: true,
        multiplicationFactor: 1,
        L1: 1,
        L2: 1,
        stepPower: 1,
    });

    function clearNumParams() {
        localStorage.removeItem('numParams');
        numParams.value = structuredClone(defNumParams);
    }


    const numParamsFromLS = JSON.parse(localStorage.getItem('numParams'));

    if (numParamsFromLS && Object.keys(numParamsFromLS)) 
        numParams.value = numParamsFromLS;

    watch(numParams, () => {
        localStorage.setItem('numParams', JSON.stringify(numParams.value));
    }, { deep: true });


    return { numParams, clearNumParams };
});

