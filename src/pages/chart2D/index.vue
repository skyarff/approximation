<template>
    <div style="overflow: hidden; background: #f0f0f0;">



        <div class="h-100 w-100 mt-3 d-flex justify-end align-center">

            <div>
                <v-btn @click="settingsRef.switchMenu()" class="mr-5" :color="'transparent'" elevation="0" icon
                    size="x-small">
                    <component :is="icons.FilterIcon" :color="'#000'" :size="17" />
                </v-btn>
                <settingsMenu @applySettings="apply()" :settings="settings" ref="settingsRef" />
            </div>

        </div>


        <div class="chart-div" style="height: calc(100vh - 92px);">
            <chart ref="chartRef" />
        </div>
    </div>



</template>


<script setup lang="ts">

import icons from '@/assets/icons'
import { ref, reactive, onActivated } from 'vue'
import settingsMenu from './settingsMenu.vue';
import chart from './chart.vue';

import { useChartStore, TypeKey } from '@/store/chart';
const chartStore: any = useChartStore();


export type TypeSettings = {
    min: number,
    max: number,
    xVal: TypeKey,
    [key: string]: string | number
}

const settings: TypeSettings = reactive({
    min: null,
    max: null,
    xVal: null
});

onActivated(() => {
    if (chartStore.newData) {
        settings.xVal = chartStore.xKey;
        settings.min = null;
        settings.max = null;
    }
});


const chartRef = ref(null);
const settingsRef = ref(null);

function apply(): void {
    chartRef.value.callChart(settings.min, settings.max);
}

</script>



<style scoped>
.chart-div {
    height: 88.8vh;
    width: 100%;
}
</style>