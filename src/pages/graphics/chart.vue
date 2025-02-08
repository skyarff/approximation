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
            usedColors: [],
            data: [
                { id: 1.5, value: 100, val: 200 },
                { id: 1.7, value: 120, val: 240 },
                { id: 3, value: 140, val: 280 },
                { id: 4, value: 80, val: 160 },
                { id: 5, value: 180, val: 360 },
                { id: 6, value: 150, val: 300 },
                { id: 7, value: 165, val: 330 },
                { id: 8, value: 145, val: 290 },
                { id: 9, value: 130, val: 260 },
                { id: 10, value: 170, val: 340 },
                { id: 11, value: 90, val: 180 },
                { id: 12, value: 110, val: 220 },
                { id: 13, value: 160, val: 320 },
                { id: 14, value: 135, val: 270 },
                { id: 15, value: 175, val: 350 },
                { id: 16, value: 125, val: 250 },
                { id: 17, value: 155, val: 310 },
                { id: 18, value: 95, val: 190 },
                { id: 19, value: 185, val: 370 },
                { id: 20, value: 115, val: 230 }
            ]
        }
    },
    mounted() {
        this.createChart(this.root, 'chartDiv', this.data, 'id');
    },
    methods: {
        createChart(targetRoot, ref, data, xKey) {
            const root = am5.Root.new(this.$refs[ref]);
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
                    paddingTop: 40,
                    paddingBottom: 20,
                    layout: root.verticalLayout,
                    background: am5.Rectangle.new(root, {
                        fill: am5.color("#262525"),
                        fillOpacity: 1
                    })
                })
            );

            const xRenderer = am5xy.AxisRendererX.new(root, {
                minGridDistance: 20,
                cellStartLocation: 0.1,
                cellEndLocation: 0.9,
                grid: {
                    location: 0.5
                }
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
                    tooltip: tooltip,
                    strictMinMax: true
                })
            );



            xAxis.data.setAll(data);

            const legend = chart.children.push(
                am5.Legend.new(root, {
                    centerX: am5.p50,
                    x: am5.p50,
                    marginTop: 15
                })
            );

            const keys = Object.keys(data[0]).filter((key,) => key != xKey);

            const options = {
                root,
                chart,
                xAxis,
                data,
                legend
            }

            keys.forEach((key, index) => {
                this.createAxisAndSeries({ ...options, key, xKey, index })
            })

            chart.set("cursor", am5xy.XYCursor.new(root, {
                behavior: "zoomX",
                xAxis: xAxis
            }));

            chart.appear(1000, 100);

            targetRoot = root;
        },
        createAxisAndSeries({ root, chart, xAxis, legend, data, key, xKey, index } = {}) {
            const values = data.flatMap(row =>
                Object.entries(row)
                    .filter(([key]) => key !== xKey)
                    .map(([, val]) => val)
            );

            const min = Math.min(...values);
            const max = Math.max(...values);
            const color = this.getRandomColor();

            const yRenderer = am5xy.AxisRendererY.new(root, {
                minGridDistance: 30,
                cellStartLocation: 0,
                cellEndLocation: 1,
                grid: {
                    location: 0
                }
            });

            const yAxis = chart.yAxes.push(
                am5xy.ValueAxis.new(root, {
                    min: min - 20,
                    max: max + 20,
                    strictMinMax: true,
                    visible: index != 0,
                    renderer: yRenderer
                })
            );

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
                    name: key,
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: key,
                    valueXField: xKey,
                    stroke: am5.color(color),
                    fill: am5.color(color),
                    tooltip
                })
            );

            series.bullets.push(function () {
                return am5.Bullet.new(root, {
                    sprite: am5.Circle.new(root, {
                        radius: 3,
                        fill: series.get("fill"),
                        stroke: root.interfaceColors.get("background"),
                        strokeWidth: 2
                    })
                });
            });

            series.data.setAll(data);

            legend.data.setAll(chart.series.values);

            series.appear(1000);
        },
        isColorSimilar(color1, color2) {
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
        },
        getRandomColor() {
            let newColor;
            let attempts = 0;
            const maxAttempts = 50;

            do {
                const r = Math.floor(Math.random() * (230 - 128) + 128).toString(16);
                const g = Math.floor(Math.random() * (230 - 128) + 128).toString(16);
                const b = Math.floor(Math.random() * (230 - 128) + 128).toString(16);
                newColor = '#' +
                    (r.length === 1 ? '0' + r : r) +
                    (g.length === 1 ? '0' + g : g) +
                    (b.length === 1 ? '0' + b : b);

                // Проверяем, не похож ли цвет на уже использованные
                const isSimilar = this.usedColors.some(usedColor =>
                    this.isColorSimilar(newColor, usedColor)
                );

                if (!isSimilar || attempts >= maxAttempts) {
                    this.usedColors.push(newColor);
                    return newColor;
                }

                attempts++;
            } while (true);
        }
    },
    beforeDestroy() {
        if (this.root) {
            this.root.dispose();
        }
    },
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