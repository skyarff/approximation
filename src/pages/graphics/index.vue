<template>
    <div class="h-100 w-100">

        <v-row class="mx-2">
            <v-col cols="2">
                <v-autocomplete title="Переменная абсцисс" label="Переменная абсцисс"></v-autocomplete>
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
                <v-btn @click="$refs.chart.setRange(min, max)">Применить</v-btn>
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
            max: 400
        }
    },
    methods: {
      
    }

}

</script>

<style scoped>
.chart_div {
    height: 80vh;
    width: 100%;
}
</style>