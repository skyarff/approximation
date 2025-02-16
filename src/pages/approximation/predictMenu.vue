<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" location="start" :activator="'parent'">
            <v-card min-width="350" class="px-4 py-2">
                <v-card-title class="px-2">

                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 12px; font-weight: 600;">
                            Предсказать значение
                        </span>
                        <v-spacer></v-spacer>

                        <v-btn elevation="0" @click="menu = false">
                            <span style="font-size: 11px;">
                                Закрыть
                            </span>
                        </v-btn>
                    </div>


                </v-card-title>

                <v-card-text class="pb-0">
                    <v-row class="">
                        <v-col cols="12">
                            <v-list density="compact" style="height: 160px; ">
                                <v-form ref="form1">
                                    <v-list-item class="px-0" v-for="(variable, index) in dataInfo.fields.slice(1)" :key="index">
                                        <v-text-field class="pt-2" :hide-details="true" variant="outlined"
                                            :rules="[v => (v === 0 || !!v) || 'Поле обязательно']"
                                            v-model="predictInfo.predictData[0][variable]" :label="variable">
                                            <template #label>
                                                <div style="font-size: 11px;">
                                                    {{ variable }}
                                                </div>
                                            </template>
                                        </v-text-field>

                                    </v-list-item>
                                </v-form>
                            </v-list>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12">
                            <v-text-field :hide-details="true" variant="outlined" v-model="predictInfo.predictAns"
                                readonly>
                                <template #label>
                                    <div style="font-size: 11px;">
                                        Предсказание
                                    </div>
                                </template>
                            </v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>



                <v-card-actions>
                    <v-spacer></v-spacer>


                    <v-btn @click="predict" :hide-details="true">
                        <span style="font-size: 11px;">
                            Предсказать
                        </span>
                    </v-btn>

                </v-card-actions>
            </v-card>
        </v-menu>
    </div>
</template>

<script>
import { calculatePredicted } from '@/app_lib/metrics';

export default {
    data() {
        return {
            menu: false,
            predictInfo: {
                predictData: [{}],
                predictAns: ''
            },
        }
    },
    props: {
        dataInfo: {
            type: Object
        },
        allBases: {
            type: Object
        }
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
        xKeys() {
            return Object.keys(this.chartData[0])
                .filter(key => !this.chartKeys.yKeys.includes(key))
                .map((key, index) => {
                    return {
                        id: index,
                        val: key
                    }
                })
        },
        pointChart() {
            return this.$store.state.settings.pointChart;
        },
    },
    methods: {
        switchMenu() {
            this.menu = !this.menu;
            if (this.menu) {
                this.settingsClone = structuredClone(this.settings);
            }
        },
        async predict() {
            const isValid = await this.$refs.form1.validate();
            if (isValid) {
                this.predictInfo.predictAns =
                    calculatePredicted([this.predictInfo.predictData[0]], this.allBases)
                        .map(ans => ans.toFixed(4))
                        .join(', ');
            } else
                alert('Вы не заполнили форму?');
        },
    }
}
</script>

<style scoped></style>