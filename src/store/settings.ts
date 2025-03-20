import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

type TypeNumParams = {
    constant: boolean,
    normSmallValues: boolean,
    multiplicationFactor: number,
    L1: number,
    L2: number,
    stepPower: number
}


export const useSettingsStore: any = defineStore('settings', () => {

    const defNumParams: TypeNumParams = {
        constant: true,
        normSmallValues: true,
        multiplicationFactor: 1,
        L1: 1,
        L2: 1,
        stepPower: 1,
    };

    const numParams = ref<TypeNumParams>({
        constant: true,
        normSmallValues: true,
        multiplicationFactor: 1,
        L1: 1,
        L2: 1,
        stepPower: 1,
    });

    function clearNumParams(): void {
        localStorage.removeItem('numParams');
        numParams.value = structuredClone(defNumParams);
    }

    let numParamsFromLS: TypeNumParams;
    try {
        numParamsFromLS = JSON.parse(localStorage.getItem('numParams'));
    } catch (error) {
        console.error(error)
    }

    if (numParamsFromLS && Object.keys(numParamsFromLS)) 
        numParams.value = numParamsFromLS;

    watch(numParams, (): void => {
        localStorage.setItem('numParams', JSON.stringify(numParams.value));
    }, { deep: true });


    return { numParams, clearNumParams };
});

