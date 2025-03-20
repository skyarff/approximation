<template>
    <div style="position: relative;">

        <div style="position: absolute; top: 12px; right: 0px;">
            <v-btn @click="settingsRef.switchMenu()" class="mr-5" :color="'transparent'" elevation="0" icon size="x-small">
                <component :is="icons.FilterIcon" :color="'#262525'" :size="17" />
            </v-btn>
            <settingsMenu @applySettings="apply()" :settings="settings" ref="settingsRef" />
        </div>

        <chart ref="chartRef" />


    </div>
</template>

<script setup lang="ts">
import icons from '@/assets/icons'
import { ref, reactive, onActivated } from 'vue';
import chart from './chart.vue';
import settingsMenu from './settingsMenu.vue';

import { useChartStore, TypeKey } from '@/store/chart';
const chartStore: any = useChartStore();

const chartRef = ref(null);
const settingsRef = ref(null);

export type TypeSettings = {
    posAxis: number;
    negAxis: number;
    gridStep: number;
    sortVal: TypeKey;
    x1Val: TypeKey;
    x2Val: TypeKey;
    [key: string]: string | number,
}


const settings: TypeSettings = reactive({
    posAxis: null,
    negAxis: null,
    gridStep: null,
    sortVal: '-',
    x1Val: chartStore.xKeys[1] ?? '-',
    x2Val: chartStore.xKeys[0] ?? '-',
});

onActivated(() => {
    if (chartStore.newData3D) {
        settings.x1Val = chartStore.xKeys[1] ?? '-';
        settings.x2Val = chartStore.xKeys[0] ?? '-';

        settings.sortVal = '-';
        settings.posAxis = null;
        settings.negAxis = null;
        settings.negAxis = null;
    }
});


function apply(): void {

    chartRef.value.callChart(
        settings.posAxis, 
        settings.negAxis, 
        settings.gridStep,
        settings.x1Val,
        settings.x2Val,
        settings.sortVal,
    );
}


</script>

<style scoped>
.controls {
    max-width: 800px;
    margin: 0 auto;
}

h1 {
    margin-bottom: 20px;
}

.gap-2 {
    gap: 8px;
}
</style>