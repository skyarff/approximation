<template>
    <div class="w-100 px-4 pt-8">

        <v-card elevation="1" rounded="0">
            <v-card-title class="pb-4">
                <span style="font-size: 16px;">
                    Регуляризация
                </span>
            </v-card-title>
            <v-card-text>
                <v-row class="pa-0 ma-0 mb-3">
                    <v-col class="pa-0 ma-0" cols="1">
                        <v-text-field :hide-details="true" variant="outlined" title="L1 регуляризация" type="number"
                            v-model="settingsStore.numParams.L1">
                            <template #label>
                                <div style="font-size: 11px;">
                                    L1
                                </div>
                            </template>
                        </v-text-field>
                    </v-col>

                    <v-col class="pa-0 ma-0 pl-4" cols="11">
                        <p class="paragraph-text">
                            Штраф функции потерь вида + L1 * (a + b + c ...), где [a, b, c ...] веса базисов.
                        </p>
                    </v-col>
                </v-row>
                <v-row class="pa-0 ma-0">
                    <v-col class="pa-0 ma-0" cols="1">
                        <v-text-field :hide-details="true" variant="outlined" title="L2 регуляризация" type="number"
                            v-model="settingsStore.numParams.L2">
                            <template #label>
                                <div style="font-size: 11px;">
                                    L2
                                </div>
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-col class="pa-0 ma-0 pl-4" cols="11">
                        <p class="paragraph-text">
                            Штраф функции потерь вида + L2 * (a² + b² + c² ...), где [a, b, c ...] веса базисов.
                        </p>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>


        <v-card class="mt-2" elevation="1" rounded="0">
            <v-card-title class="pb-4">
                <span style="font-size: 16px;">
                    Предобработка аппроксимируемых данных
                </span>
            </v-card-title>
            <v-card-text>
                <v-row class="pa-0 ma-0">
                    <v-col class="pa-0 ma-0" cols="1">
                        <v-text-field :hide-details="true" variant="outlined"
                            title="Нормализация входных значений *multiplicationFactor" type="number"
                            v-model="settingsStore.numParams.multiplicationFactor">
                            <template #label>
                                <div style="font-size: 11px;">
                                    Коэф. умножения
                                </div>
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-col class="pa-0 ma-0 pl-4" cols="11">
                        <p class="paragraph-text">
                            В процессе вычисления входные данные сначала будут умножены на данное значение.
                        </p>
                    </v-col>
                </v-row>
                <v-row class="pa-0 ma-0">
                    <v-col class="pa-0 ma-0" cols="1">
                        <v-checkbox :hide-details="true" variant="outlined" v-model="settingsStore.numParams.normSmallValues">
                            <template #label>
                                <div style="font-size: 11px;">
                                    Нормализация малых значений
                                </div>
                            </template>
                        </v-checkbox>
                    </v-col>
                    <v-col class="pa-0 ma-0 pl-4" cols="11">
                        <p class="paragraph-text">
                            Слишком малые по модулю значения (в том числе 0), будует заменены на приемлемо малое
                            значение.
                        </p>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>



        <v-card class="mt-2" elevation="1" rounded="0">
            <v-card-title class="pb-4">
                <span style="font-size: 16px;">
                    Построение базисов
                </span>
            </v-card-title>
            <v-card-text>
                <v-row class="pa-0 ma-0">
                    <v-col class="pa-0 ma-0" cols="1">
                        <v-text-field :hide-details="true" variant="outlined" title="Шаг построения степеней базисов"
                            type="number" v-model="settingsStore.numParams.stepPower">
                            <template #label>
                                <div style="font-size: 11px;">
                                    Степенной шаг
                                </div>
                            </template>
                        </v-text-field>
                    </v-col>
                    <v-col class="pa-0 ma-0 pl-4" cols="11">
                        <p class="paragraph-text">
                            Шаг для реализации расширенный базисов.
                        </p>
                    </v-col>
                </v-row>
                <v-row class="pa-0 ma-0">
                    <v-col class="pa-0 ma-0" cols="1">
                        <v-checkbox :hide-details="true" variant="outlined" hint="Наличие константы"
                            v-model="settingsStore.numParams.constant">
                            <template #label>
                                <div style="font-size: 11px;">
                                    Наличие константы
                                </div>
                            </template>
                        </v-checkbox>
                    </v-col>
                    <v-col class="pa-0 ma-0 pl-4" cols="11">
                        <p class="paragraph-text">
                            Наличие или отсутствие константы.
                        </p>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
    </div>
</template>


<script setup>
import { useSettingsStore } from '@/store_pinia/settings'

const settingsStore = useSettingsStore();

</script>



<style scoped>
.paragraph-text {
    text-indent: 1.5rem;
    margin: 0;
    line-height: 1.5;
    text-align: justify;
}
</style>