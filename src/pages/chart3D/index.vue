<template>
    <div style="position: relative;">

        <div style="position: absolute; top: 20px; right: 20px;">
            <v-btn>
                <span>
                    settings
                </span>
            </v-btn>
        </div>

        <chart ref="chartRef" />

        
    </div>
</template>

<script setup>
import { ref } from 'vue';
import chart from './chart.vue';

const chartRef = ref(null);



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