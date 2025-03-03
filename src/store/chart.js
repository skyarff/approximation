import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useChartStore = defineStore('chart', () => {

    const chartData = ref(
        [
            { x: 1.5, y1: 100, y2: 200 },
            { x: 1.7, y1: 120, y2: 240 },
            { x: 3, y1: 140, y2: 280 },
            { x: 4, y1: 80, y2: 160 },
            { x: 5, y1: 180, y2: 360 },
            { x: 6, y1: 150, y2: 300 },
            { x: 7, y1: 165, y2: 330 },
            { x: 8, y1: 145, y2: 290 },
            { x: 9, y1: 130, y2: 260 },
            { x: 10, y1: 170, y2: 340 },
            { x: 11, y1: 90, y2: 180 },
            { x: 12, y1: 110, y2: 220 },
            { x: 13, y1: 160, y2: 320 },
            { x: 14, y1: 135, y2: 270 },
            { x: 15, y1: 175, y2: 350 },
            { x: 16, y1: 125, y2: 250 },
            { x: 17, y1: 155, y2: 310 },
            { x: 18, y1: 95, y2: 190 },
            { x: 19, y1: 185, y2: 370 },
            { x: 20, y1: 115, y2: 230 }
        ]
    );

    const xKey = ref('x');
    const yKeys = ref(['y1', 'y2']);
    const pointChart = ref(false);
    const newData = ref(true);

    function switchPoint() {
        pointChart.value = !pointChart.value;
    }


    function setChartData(payload) {
        chartData.value = payload.chartData;
        xKey.value = payload.xKey;
        yKeys.value = payload.yKeys
        newData.value = true;
    }

    function sortChartData() {
        chartData.value = [...chartData.value].sort((a, b) => a[xKey.value] - b[xKey.value]);

        
    }

    return { chartData, xKey, yKeys, pointChart, newData, switchPoint, sortChartData, setChartData };
});