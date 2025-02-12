<template>
    <div class="chart_wrapper">
        <div v-if="chartDivOn" class="trends" ref="chartDiv"></div>
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
            chartDivOn: true,
            usedColors: [],
            self: null,
            seriesVisibility: {},
        }
    },
    mounted() {
        this.self = { component: this };
        console.log('chartData перед createChart:', this.chartData);
        this.createChart(this.self, 'chartDiv', this.chartData, this.chartKeys, this.pointChart);
    },
    computed: {
        chartData() {
            return this.$store.state.chart.chartData;
        },
        chartKeys() {
            return {
                xKey: this.$store.state.chart.xKey,
                yKeys: this.$store.state.chart.yKeys,
            }
        },
        chartKeys() {
            return {
                xKey: this.$store.state.chart.xKey,
                yKeys: this.$store.state.chart.yKeys,
            }
        },
        pointChart() {
            return this.$store.state.settings.pointChart
        },
    },
    watch: {
        chartData() {
            this.callChart();
        },
    },
    methods: {
        createChart(context, ref, data, chartKeys, pointChart = false, min, max) {

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
                    }),
                })
            );

            const xRenderer = am5xy.AxisRendererX.new(root, {
                minGridDistance: 40,
                cellStartLocation: 0,
                cellEndLocation: 1,
                // grid: {
                //     location: 0.5
                // }
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

            // console.log('data???', data, chartKeys.xKey)

            // data.forEach((item, idx) => {
            //     if (item[chartKeys.xKey] !== undefined) {
            //         item[chartKeys.xKey] = parseFloat(item[chartKeys.xKey]);
            //         console.log(idx, item[chartKeys.xKey])
            //     }
            // });


            xAxis.data.setAll(data);

            const legend = chart.children.push(
                am5.Legend.new(root, {
                    centerX: am5.p50,
                    x: am5.p50,
                    marginTop: 15
                })
            );

            legend.itemContainers.template.events.on("click", function (e) {
                let itemContainer = e.target;
                let dataItem = itemContainer.dataItem;

                const seriesName = dataItem.get('name');
                if (seriesName) {
                    const clickedSeries = chart.series.values.find(s => s.get("name") === seriesName);
                    context.component.seriesVisibility[seriesName] = clickedSeries.isHidden();
                }
            });


            const { xKey, yKeys } = chartKeys;

            // if (min === undefined && max === undefined) {
            //     const values = data.flatMap(row =>
            //         Object.entries(row)
            //             .filter(([yKey]) => yKey !== xKey)
            //             .map(([, val]) => val)
            //     );

            //     min = Math.min(...values);
            //     max = Math.max(...values);
            // }


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
                this.createAxisAndSeries({ ...options, yKey, xKey, index })
            })

            chart.set("cursor", am5xy.XYCursor.new(root, {
                behavior: "zoomX",
                xAxis: xAxis
            }));

            chart.appear(1000, 100);

            context.component.root = root;
        },
        createAxisAndSeries({ context, root, chart, xAxis, data, legend, pointChart, min, max, yKey, xKey, index } = {}) {
            const color = this.getRandomColor();

            const yRenderer = am5xy.AxisRendererY.new(root, {
                minGridDistance: 25,
                cellStartLocation: 0,
                cellEndLocation: 1,
                // grid: {
                //     location: 0
                // }
            });


            const yAxis = chart.yAxes.push(
                am5xy.ValueAxis.new(root, {
                    min: parseFloat(min),
                    max: parseFloat(max),
                    strictMinMax: true,
                    paddingRight: 18,
                    renderer: yRenderer,
                    extraMax: 0,
                    extraMin: 0,
                    maxDeviation: 0,
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

            yRenderer.labels.template.set('fill', series.get('fill'));
            yRenderer.setAll({
                stroke: series.get('fill'),
                strokeOpacity: 1,
                opacity: 1,
            });


            if (context.component.seriesVisibility[yKey] === undefined)
                context.component.seriesVisibility[yKey] = true;

            if (!context.component.seriesVisibility[yKey]) {
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
                            radius: 2,
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
        },
        disposeAndCall(func, ...args) {
            this.chartDivOn = false;
            this.$nextTick(() => {
                this.chartDivOn = true;
                this.$nextTick(() => {
                    func(...args);
                })
            })
        },
        callChart(min, max) {
            this.disposeAndCall(
                this.createChart,
                this.self,
                'chartDiv',
                this.chartData,
                this.chartKeys,
                this.pointChart,
                min, max
            )
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