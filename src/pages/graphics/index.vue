<template>
    <div class="h-100 w-100">

        <v-row class="mx-2">
            <v-col cols="2">
                <v-autocomplete v-model="xVal" item-title="val" item-value="id" :items="xKeys"
                    title="Переменная абсцисс" label="Переменная абсцисс"></v-autocomplete>
            </v-col>
            <v-col cols="1">
                <v-switch />
            </v-col>
            <v-col cols="1">
                <v-text-field label="min" v-model="min" />
            </v-col>
            <v-col cols="1">
                <v-text-field label="max" v-model="max" />
            </v-col>
            <v-col cols="1">
                <v-btn @click="apply()">Применить</v-btn>
            </v-col>
        </v-row>

    </div>



    <div class="chart_div">
        <chart ref="chart" />
    </div>


</template>


<script>

import chart from './chart.vue';

export default {

    components: {
        chart
    },
    data() {
        return {
            min: 0,
            max: 400,
            xVal: 0,
        }
    },
    mounted() {
        console.log('xKeys', this.xKeys)
    },
    methods: {
        apply() {

            const xKey = this.xKeys[this.xVal].val;
            this.$store.state.graphics.xKey = xKey;
            this.chartData.sort((a, b) => a[xKey] - b[xKey]);
            this.$refs.chart.setRange(this.min, this.max);
        }
    },
    computed: {
        chartData() {
            return this.$store.state.graphics.chartData;
        },
        chartKeys() {
            return {
                xKey: this.$store.state.graphics.xKey,
                yKeys: this.$store.state.graphics.yKeys,
            }
        },
        xKeys() {
            return Object.keys(this.chartData[0])
                .filter(key => !this.chartKeys.yKeys.includes(key))
                .map((key, index) => {
                    return {
                        id: index,
                        val: key
                    }
                })
        }
    },

}

</script>

<style scoped>
.chart_div {
    height: 80vh;
    width: 100%;
}
</style>