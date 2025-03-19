<template>
    <div class="chart-wrapper">
        <div v-if="chartDivOn" class="trends" ref="chartDiv"></div>
    </div>
</template>


<script setup>
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

import { useChartStore } from '@/store/chart';
import { ref, computed, nextTick } from 'vue'
import { onActivated, onBeforeUnmount } from 'vue'


const chartStore = useChartStore();
const chartDiv = ref(null);
let chartData = [];


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


function createChart(context, ref, data, chartKeys, pointChart2D = false, min, max) {

    const root = am5.Root.new(ref.value);
    root._logo.dispose();
    
    root.setThemes([am5themes_Animated.new(root)]);

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
                fill: am5.color("#f0f0f0"),
                fillOpacity: 1
            }),
        })
    );

    const xRenderer = am5xy.AxisRendererX.new(root, {
        minGridDistance: 40,
        cellStartLocation: 0,
        cellEndLocation: 1,
        stroke: am5.color("#c4d8e9"),
        strokeOpacity: 1
    });

    xRenderer.labels.template.setAll({
        rotation: 0,
        centerY: am5.p50,
        centerX: am5.p50,
        paddingTop: 10,
        fill: am5.color("#1e3a5f")
    });

    xRenderer.grid.template.setAll({
        stroke: am5.color("#e0e6ed"),
        strokeOpacity: 1
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
        fill: am5.color('#ffffff'),
        fillOpacity: 0.9,
        stroke: am5.color("#c4d8e9"),
        strokeWidth: 1
    });

    tooltip.label.setAll({
        fill: am5.color("#1e3a5f")
    });

    const xAxis = chart.xAxes.push(
        am5xy.ValueAxis.new(root, {
            renderer: xRenderer,
            paddingTop: 18,
            tooltip: tooltip,
            strictMinMax: true,
        })
    );

    const { xKey, yKeys } = chartKeys.value;
    data.sort((a, b) => a[xKey] - b[xKey]);

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
        fill: am5.color("#1e3a5f")
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
        pointChart2D
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

function createAxisAndSeries({ context, root, chart, xAxis, data, legend, pointChart2D, min, max, yKey, xKey, index } = {}) {
    const colorPalette = [
        "#1e3a5f",
        "#3498db",
        "#2ecc71",
        "#e67e22",
        "#9b59b6",
        "#1abc9c",
        "#f1c40f",
        "#e74c3c",
        "#34495e",
        "#16a085",
    ];
    
    const color = colorPalette[index];
    const yRenderer = am5xy.AxisRendererY.new(root, {
        minGridDistance: 25,
        cellStartLocation: 0,
        cellEndLocation: 1,
        stroke: am5.color("#c4d8e9"),
        strokeOpacity: 1
    });

    yRenderer.grid.template.setAll({
        stroke: am5.color("#e0e6ed"),
        strokeOpacity: 0.8, 
        strokeDasharray: [2, 2]
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
        fill: am5.color('#ffffff'),
        fillOpacity: 0.9,
        stroke: am5.color("#c4d8e9"),
        strokeWidth: 1
    });

    tooltip.label.setAll({
        fill: am5.color("#1e3a5f")
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
            strokeWidth: 2
        })
    );


    if (index != 1)
        yRenderer.grid.template.set('visible', false);


    yRenderer.labels.template.set('fill', oneAxis ? am5.color("#1e3a5f") : series.get('fill'));
    yRenderer.setAll({ 
        stroke: oneAxis ? am5.color("#c4d8e9") : series.get('stroke'), 
        strokeOpacity: 1, 
        opacity: 1, 
        marginLeft: 2 
    });


    if (context.seriesVisibility.value[yKey] == undefined)
        context.seriesVisibility.value[yKey] = true;

    if (!context.seriesVisibility.value[yKey]) {
        setTimeout(() => {
            series.hide();
        }, 0)
    }


    if (pointChart2D) {
        series.setAll({
            stroke: undefined,
        });

        series.bullets.push(function () {
            return am5.Bullet.new(root, {
                sprite: am5.Circle.new(root, {
                    radius: 3.5,
                    fill: series.get("fill"),
                    stroke: am5.color("#FFFFFF"),
                    strokeWidth: 1
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
        chartData,
        chartKeys,
        chartStore.pointChart2D,
        min, max
    )
};





onActivated(() => {
    if (chartStore.newData) {
        chartData = [...chartStore.chartData];
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