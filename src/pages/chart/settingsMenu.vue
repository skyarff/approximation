<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" location="end" :activator="'parent'">
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
                            <v-autocomplete v-model="settingsClone.xVal" item-title="val" item-value="id" :items="xKeys"
                                title="Переменная абсцисс" :hide-details="true" chips variant="outlined">
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
                            <div @click="chartStore.switchPoint()"
                                style="cursor: pointer; display: flex; justify-content: start; align-items: center;">
                                <span style="margin-right: 16px; font-size: 11px;">
                                    Точечный график
                                </span>
                                <v-switch class="ma-0 pa-0" :color="'black'" v-model="chartStore.pointChart"
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


<script setup>
import { ref } from 'vue';
import { computed } from 'vue';

import { useChartStore } from '@/store/chart';
const chartStore = useChartStore();

const emit = defineEmits(['applySettings']);


const props = defineProps({
    settings: {
        type: Object
    }
});


let menu = ref(false);
function switchMenu() {
    menu.value = !menu.value;
    if (menu.value) {
        settingsClone.value = structuredClone(props.settings);
    }
};



let settingsClone = ref({});

const xKeys = computed(() => {
    return Object.keys(chartStore.chartData[0])
        .filter(key => !chartStore.yKeys.includes(key))
        .map((key, index) => {
            return {
                id: index,
                val: key
            }
        })
});

function apply() {

    for (let key of Object.keys(settingsClone.value))
        props.settings[key] = settingsClone.value[key];


    chartStore.xKey = xKeys.value[props.settings.xVal].val;
    chartStore.sortChartData();

    emit('applySettings');
};


function resetRange() {
    props.settings.min = '';
    props.settings.max = '';
    settingsClone.value.min = '';
    settingsClone.value.max = '';
    emit('applySettings');
};


defineExpose({
    switchMenu
})


</script>



<style scoped></style>