<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" :nudge-top="50" location="end" :activator="'parent'">
            <v-card min-width="350" class="px-4 py-2">
                <v-card-title class="px-2">

                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 12px; font-weight: 600;">
                            Настройки
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
                    <v-row>
                        <v-col class="px-0">
                            <v-autocomplete class="custom-dropdown" v-model="settingsClone.xVal" item-title="val"
                                item-value="id" :items="xKeys" title="Переменная абсцисс" :hide-details="true" chips
                                variant="outlined">
                                <template #label>
                                    <div style="font-size: 11px;">
                                        Переменная абсцисс
                                    </div>
                                </template>
                                <template #item="{ item, props }">
                                    <v-list-item density="compact" class="pl-8 py-0 my-0" v-bind="props">
                                        <template #title>
                                            <div style="font-size: 12.5px;">
                                                {{ item.title }}
                                            </div>
                                        </template>
                                    </v-list-item>
                                </template>
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row class="pt-0">
                        <v-col class="px-0 mr-5">
                            <v-text-field v-model="settingsClone.min" :hide-details="true" variant="outlined">
                                <template #label>
                                    <div style="font-size: 11px;">
                                        Мин.
                                    </div>
                                </template>
                            </v-text-field>
                        </v-col>

                        <v-col class="px-0">
                            <v-text-field label="max" v-model="settingsClone.max" :hide-details="true"
                                variant="outlined">
                                <template #label>
                                    <div style="font-size: 11px;">
                                        Макс.
                                    </div>
                                </template>
                            </v-text-field>
                        </v-col>

                        <v-col class="d-flex align-center pr-0">
                            <v-btn @click="resetRange" elevation="0">
                                <span style="font-size: 11px;">
                                    Сбросить
                                </span>
                            </v-btn>
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col class="px-0 py-0">
                            <div @click="$store.commit('settings/pointChart')"
                                style="cursor: pointer; display: flex; justify-content: start; align-items: center;">
                                <span style="margin-right: 16px; font-size: 11px;">
                                    Точечный график
                                </span>
                                <v-switch class="ma-0 pa-0" :color="'black'" v-model="pointChart"
                                    :hide-details="true" />
                            </div>
                        </v-col>
                    </v-row>
                </v-card-text>



                <v-card-actions>
                    <v-spacer></v-spacer>


                    <v-btn @click="apply()" :hide-details="true">
                        <span style="font-size: 11px;">
                            Применить
                        </span>
                    </v-btn>

                </v-card-actions>
            </v-card>
        </v-menu>
    </div>
</template>

<script>

export default {
    data() {
        return {
            menu: false,
            settingsClone: {}
        }
    },
    props: {
        settings: {
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
        apply() {
            for (let key of Object.keys(this.settingsClone))
                this.settings[key] = this.settingsClone[key];

            const xKey = this.xKeys[this.settings.xVal].val;
            this.$store.state.chart.xKey = xKey;
            this.chartData.sort((a, b) => a[xKey] - b[xKey]);

            this.$emit('applySettings');
        },
        resetRange() {
            this.settings.min = '';
            this.settings.max = '';
            this.settingsClone.min = '';
            this.settingsClone.max = '';
            this.$emit('applySettings');
        }
    }
}
</script>

<style scoped>
.custom-dropdown :deep(.v-list-item-title) {
    font-size: 11px !important;
}

/* Для элементов списка */
.custom-dropdown :deep(.v-list-item) {
    min-height: 30px !important;
    /* уменьшаем высоту строки */
}

/* Для текста в самом поле ввода */
.custom-dropdown :deep(.v-field__input) {
    font-size: 11px !important;
}
</style>