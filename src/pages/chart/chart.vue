<template>
    <div class="chart-wrapper">
        <div v-if="chartDivOn" class="trends" ref="chartDiv"></div>
    </div>
</template>


<script setup>
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

import { useChartStore } from '@/store/chart';
import { ref, computed, nextTick, defineExpose } from 'vue'
import { onActivated, onBeforeUnmount } from 'vue'


const chartStore = useChartStore();
const chartDiv = ref(null);


const seriesVisibility = ref({});
let root = null;
const self = {
    seriesVisibility,
    root
}

const chartKeys = computed(() => {
    return {
        xKey: chartStore.xKey,
        yKeys: chartStore.yKeys,
    }
});


function createChart(context, ref, data, chartKeys, pointChart = false, min, max) {

    const root = am5.Root.new(ref.value);
    root._logo.dispose();
    root.setThemes([am5themes_Dark.new(root)]);

    const chart = root.container.children.push(
        am5xy.XYChart.new(root, {
            panX: true,
            panY: false,
            wheelX: "panX",
            wheelY: "zoomX",
            paddingLeft: 30,
            paddingRight: 30,
            paddingTop: 15,
            paddingBottom: 20,
            layout: root.verticalLayout,
            background: am5.Rectangle.new(root, {
                fill: am5.color("#262525"),
                fillOpacity: 1
            }),
        })
    );

    const xRenderer = am5xy.AxisRendererX.new(root, {
        minGridDistance: 40,
        cellStartLocation: 0,
        cellEndLocation: 1,
    });

    xRenderer.labels.template.setAll({
        rotation: 0,
        centerY: am5.p50,
        centerX: am5.p50,
        paddingTop: 10,
    });

    let tooltip = am5.Tooltip.new(root, {
        pointerOrientation: 'horizontal',
        getFillFromSprite: false,
        getStrokeFromSprite: true,
        autoTextColor: false,
        getLabelFillFromSprite: true,
        position: 'auto',
    });

    tooltip.get('background').setAll({
        fill: am5.color('#262525'),
        fillOpacity: 1,
    });

    tooltip.label.setAll({
        fill: am5.color("#fff")
    });

    const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: xRenderer,
            paddingTop: 18,
            tooltip: tooltip,
            strictMinMax: true,
        })
    );

    xAxis.data.setAll(data);

    const legend = chart.children.push(
        am5.Legend.new(root, {
            centerX: am5.p50,
            x: am5.p50,
            marginTop: 15,
            useDefaultMarker: true
        })
    );
    legend.markers.template.setAll({
        width: 9,
        height: 9,

    });

    legend.markerRectangles.template.setAll({

        cornerRadiusTL: 10,
        cornerRadiusTR: 10,
        cornerRadiusBL: 10,
        cornerRadiusBR: 10,
    });

    legend.labels.template.setAll({
        marginLeft: 8,
    });

    legend.itemContainers.template.events.on("click", function (e) {
        let itemContainer = e.target;
        let dataItem = itemContainer.dataItem;

        const seriesName = dataItem.get('name');
        if (seriesName) {
            const clickedSeries = chart.series.values.find(s => s.get("name") === seriesName);
            context.seriesVisibility.value[seriesName] = clickedSeries.isHidden();
        }
    });


    const { xKey, yKeys } = chartKeys.value;

    console.log('xKey', xKey)


    if (min == 0) min = '';
    if (max == 0) max = '';



    const options = {
        context,
        root,
        chart,
        xAxis,
        data,
        legend,
        min,
        max,
        pointChart
    }



    yKeys.forEach((yKey, index) => {
        createAxisAndSeries({ ...options, yKey, xKey, index })
    })

    chart.set("cursor", am5xy.XYCursor.new(root, {
        behavior: "zoomX",
        xAxis: xAxis
    }));

    chart.appear(1000, 100);

    context.root = root;
};

function createAxisAndSeries({ context, root, chart, xAxis, data, legend, pointChart, min, max, yKey, xKey, index } = {}) {
    const color = getRandomColor();

    const yRenderer = am5xy.AxisRendererY.new(root, {
        minGridDistance: 25,
        cellStartLocation: 0,
        cellEndLocation: 1,
    });


    let oneAxis = false;
    if (min || max) {
        oneAxis = true;
        min = min ? parseFloat(min) : 0;
        max = max ? parseFloat(max) : 0;
    }

    const yAxis = chart.yAxes.push(
        am5xy.ValueAxis.new(root, {
            min: min,
            max: max,
            strictMinMax: true,
            paddingRight: 18,
            renderer: yRenderer,
            extraMax: 0,
            extraMin: 0,
            maxDeviation: 0,
            visible: !oneAxis || index == 0
        })
    );

    // if (chart.yAxes.indexOf(yAxis) > 0) {
    //   yAxis.set('syncWithAxis', chart.yAxes.getIndex(0));
    // }

    let tooltip = am5.Tooltip.new(root, {
        pointerOrientation: 'horizontal',
        getFillFromSprite: false,
        getStrokeFromSprite: true,
        autoTextColor: false,
        getLabelFillFromSprite: true,
        labelText: '{valueY}',
        position: 'auto',
    });

    tooltip.get('background').setAll({
        fill: am5.color('#262525'),
        fillOpacity: 1,
    });


    const series = chart.series.push(
        am5xy.LineSeries.new(root, {
            name: yKey,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: yKey,
            valueXField: xKey,
            stroke: am5.color(color),
            fill: am5.color(color),
            tooltip,
        })
    );


    if (index != 1)
        yRenderer.grid.template.set('visible', false);


    yRenderer.labels.template.set('fill', oneAxis ? '#fff' : series.get('fill'));
    yRenderer.setAll({ stroke: oneAxis ? '#fff' : series.get('fill'), strokeOpacity: 1, opacity: 1, marginLeft: 2 });


    if (context.seriesVisibility.value[yKey] == undefined)
        context.seriesVisibility.value[yKey] = true;

    if (!context.seriesVisibility.value[yKey]) {
        setTimeout(() => {
            series.hide();
        }, 0)
    }


    if (pointChart) {
        series.setAll({
            stroke: undefined,
        });

        series.bullets.push(function () {
            return am5.Bullet.new(root, {
                sprite: am5.Circle.new(root, {
                    radius: 2.5,
                    fill: series.get("fill"),
                    stroke: root.interfaceColors.get("background"),
                    strokeWidth: 0.5
                })
            });
        });
    }



    series.data.setAll(data);

    legend.data.setAll(chart.series.values);



    series.appear(1000);
};


const chartDivOn = ref(true);
async function disposeAndCall(func, ...args) {
    chartDivOn.value = false;

    await nextTick();
    chartDivOn.value = true;
    await nextTick();

    func(...args);
};

function callChart(min, max) {
    disposeAndCall(
        createChart,
        self,
        chartDiv,
        chartStore.chartData,
        chartKeys,
        chartStore.pointChart,
        min, max
    )
};


let usedColors = [];
function getRandomColor() {
    let newColor;
    let attempts = 0;
    const maxAttempts = 50;

    do {
        let r = Math.floor(Math.random() * (255 - 150) + 150).toString(16);
        let g = Math.floor(Math.random() * (255 - 150) + 150).toString(16);
        let b = Math.floor(Math.random() * (255 - 100) + 100).toString(16);


        const boost = Math.floor(Math.random() * 3);
        if (boost === 0) {
            r = Math.min(255, parseInt(r, 16) + 50).toString(16);
        } else if (boost === 1) {
            g = Math.min(255, parseInt(g, 16) + 50).toString(16);
        } else {
            b = Math.min(255, parseInt(b, 16) + 50).toString(16);
        }

        newColor = '#' +
            (r.length === 1 ? '0' + r : r) +
            (g.length === 1 ? '0' + g : g) +
            (b.length === 1 ? '0' + b : b);

        const isSimilar = usedColors.some(usedColor =>
            isColorSimilar(newColor, usedColor)
        );

        if (!isSimilar || attempts >= maxAttempts) {
            usedColors.push(newColor);
            return newColor;
        }

        attempts++;
    } while (true);
};

function isColorSimilar(color1, color2) {
    // Конвертируем HEX в RGB
    const hex2Rgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    };

    const [r1, g1, b1] = hex2Rgb(color1);
    const [r2, g2, b2] = hex2Rgb(color2);

    // Вычисляем разницу между цветами
    const threshold = 50; // порог различия
    return Math.abs(r1 - r2) < threshold &&
        Math.abs(g1 - g2) < threshold &&
        Math.abs(b1 - b2) < threshold;
};



onActivated(() => {
    if (chartStore.newData) {

        callChart();
        chartStore.newData = false;
    }
});

onBeforeUnmount(() => {
    if (root) {
        root.dispose();
    }
});


defineExpose({
    callChart
})

</script>


<style scoped>
.trends {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

.chart-wrapper {
    position: relative;
    height: 100%;
    width: 100%;
}
</style>