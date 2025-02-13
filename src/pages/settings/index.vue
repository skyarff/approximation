<template>
    <div class="w-100 pa-2">
        <v-row>
            <v-col cols="1">
                <v-text-field title="L1 регуляризация" type="number" label="L1" v-model="storeNumParams.L1" />
            </v-col>
            <v-col cols="1">
                <v-text-field title="L2 регуляризация" type="number" label="L2" v-model="storeNumParams.L2" />
            </v-col>
            <v-col cols="1">
                <v-text-field title="Шаг построения степеней базисов" type="number" label="stepPower"
                    v-model="storeNumParams.stepPower" />
            </v-col>
            <v-col cols="1">
                <v-text-field title="Нормализация входных значений *multiplicationFactor" type="number"
                    label="multiplicationFactor" v-model="storeNumParams.multiplicationFactor" />
            </v-col>
            <v-col cols="1">
                <v-checkbox hint="Наличие константы" v-model="storeNumParams.constant" label="Constant" />
            </v-col>
            <v-col cols="1">
                <v-checkbox hint="Замена слишком малых входных значений приемлимыми"
                    v-model="storeNumParams.normSmallValues" label="normSmallValues" />
            </v-col>

        </v-row>
    </div>
</template>

<script>

export default {
    data() {
        return {

        }
    },
    methods: {

    },
    computed: {
        storeNumParams() {
            return this.$store.state.settings.storeNumParams;
        },
    }
}

</script>