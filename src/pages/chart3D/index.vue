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
import { ref, reactive } from 'vue';
import chart from './chart.vue';
import settingsMenu from './settingsMenu.vue';

const chartRef = ref(null);
const settingsRef = ref(null);

const settings = reactive({
    min: '',
    max: '',
    xVal: 0
});

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