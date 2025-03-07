<template>
    <div style="position: relative;">

        <div style="position: absolute; top: 10px; right: 0px;">
            <v-btn @click="settingsRef.switchMenu()" class="mr-5" :color="'transparent'" elevation="0" icon size="x-small">
                <component :is="icons.FilterIcon" :color="'#262525'" :size="17" />
            </v-btn>
            <settingsMenu @applySettings="apply(settings)" :settings="settings" ref="settingsRef" />
        </div>

        <chart ref="chartRef" />


    </div>
</template>

<script setup>
import icons from '@/assets/icons'
import { ref, reactive, onActivated } from 'vue';
import chart from './chart.vue';
import settingsMenu from './settingsMenu.vue';

import { useChartStore } from '@/store/chart';
const chartStore = useChartStore();

const chartRef = ref(null);
const settingsRef = ref(null);



const settings = reactive({
    posAxis: '',
    negAxis: '',
    gridStep: '',
    x1Val: chartStore.xKeys[1] ?? '-',
    x2Val: chartStore.xKeys[0] ?? '-',
});

onActivated(() => {
    settings.x1Val = chartStore.xKeys[1] ?? '-';
    settings.x2Val = chartStore.xKeys[0] ?? '-';
});


function apply() {
    chartRef.value.callChart(
        settings.posAxis, 
        settings.negAxis, 
        settings.gridStep,
        settings.x1Val,
        settings.x2Val,
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