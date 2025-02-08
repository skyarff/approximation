<template>
    <div class="chart_wrapper">
        <div class="trends" ref="chartDiv"></div>
    </div>
</template>

<script>
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

export default {
    name: 'chart',
    data() {
        return {
            root: null,
            data: [
                { date: "2024-01-01", value: 100 },
                { date: "2024-01-02", value: 120 },
                { date: "2024-01-03", value: 140 },
                { date: "2024-01-04", value: 80 },
                { date: "2024-01-05", value: 180 }
            ]
        }
    },
    mounted() {
        this.createChart(this.root, 'chartDiv', this.data);

    },
    methods: {
        createChart(targetRoot, ref, data) {
            const root = am5.Root.new(this.$refs[ref]);
            root._logo.dispose();
            root.setThemes([am5themes_Dark.new(root)]);


            const chart = root.container.children.push(
                am5xy.XYChart.new(root, {
                    panX: true,
                    panY: false,
                    wheelX: "panX",
                    wheelY: "zoomX",
                    layout: root.verticalLayout,
                    background: am5.Rectangle.new(root, {
                        fill: am5.color("#262525"),
                        fillOpacity: 1
                    })
                })
            );

            const xRenderer = am5xy.AxisRendererX.new(root, {
                minGridDistance: 50,
            });

            xRenderer.labels.template.setAll({
                rotation: 0,
                centerY: am5.p50,
                centerX: am5.p50,
                paddingTop: 10,
            });

            const xAxis = chart.xAxes.push(
                am5xy.CategoryAxis.new(root, {
                    categoryField: "date",
                    renderer: xRenderer,
                    tooltip: am5.Tooltip.new(root, {})
                })
            );
            xAxis.data.setAll(data);


            const options = {
                root,
                chart,
                xAxis,
                data,
            }


            this.createAxisAndSeries(options)   


            chart.set("cursor", am5xy.XYCursor.new(root, {
                behavior: "zoomX",
                xAxis: xAxis
            }));

            chart.appear(1000, 100);

            targetRoot = root;
        },
        createAxisAndSeries({root, chart, xAxis, data} = {}) {

            const yAxis = chart.yAxes.push(
                am5xy.ValueAxis.new(root, {
                    renderer: am5xy.AxisRendererY.new(root, {
                        minGridDistance: 30
                    })
                })
            );

            const series = chart.series.push(
                am5xy.LineSeries.new(root, {
                    name: "Значение",
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: "value",
                    categoryXField: "date",
                    stroke: am5.color("#BCED0A"),
                    fill: am5.color("#BCED0A"),
                    tooltip: am5.Tooltip.new(root, {
                        labelText: "{valueY}",
                        getFillFromSprite: false,
                        getStrokeFromSprite: true,
                        autoTextColor: false
                    })
                })
            );

            series.bullets.push(function () {
                return am5.Bullet.new(root, {
                    sprite: am5.Circle.new(root, {
                        radius: 4,
                        fill: series.get("fill"),
                        stroke: root.interfaceColors.get("background"),
                        strokeWidth: 2
                    })
                });
            });

            series.data.setAll(data);

            const legend = chart.children.push(
                am5.Legend.new(root, {
                    centerX: am5.p50,
                    x: am5.p50,
                    marginTop: 15
                })
            );
            legend.data.setAll(chart.series.values);

            series.appear(1000);
        }
    },
    beforeDestroy() {
        if (this.root) {
            this.root.dispose();
        }
    }
}
</script>

<style scoped>
.trends {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}

.chart_wrapper {
    position: relative;
    height: 100%;
    width: 100%;

}
</style>