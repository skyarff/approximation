<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" location="start" :activator="'parent'"
            transition="slide-y-transition" :offset="10" min-width="420" max-width="480">
            <v-card class="predict-card elevation-5">
                <div class="panel-header">
                    <div class="header-content">
                        <div class="icon-container">
                            <v-icon size="small" color="#1e3a5f">mdi-chart-sankey</v-icon>
                        </div>
                        <span class="text-subtitle-2 font-weight-medium">Прогнозирование значений</span>
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-close" density="compact" variant="text" color="grey-darken-1" @click="menu = false"
                        size="x-small"></v-btn>
                </div>

                <v-divider></v-divider>

                <div class="panel-content">
                    <div class="info-banner">
                        <v-icon size="small" color="primary" class="mr-2">mdi-information-outline</v-icon>
                        <span class="info-text">Введите параметры для прогнозирования целевого значения</span>
                    </div>

                    <div class="variables-container">
                        <div class="variables-scroll-container">
                            <v-form ref="form1">
                                <div class="variables-list">
                                    <div v-for="(variable, index) in dataInfo.fields.slice(1)" :key="index"
                                        class="variable-input-field">
                                        <div class="variable-label">
                                            <v-icon size="x-small" color="#1e3a5f" class="mr-1">mdi-label</v-icon>
                                            {{ variable }}
                                        </div>
                                        <v-text-field density="compact" hide-details="auto" variant="outlined"
                                            class="rounded-lg input-field" bg-color="white"
                                            :rules="[v => (v === 0 || !!v) || 'Поле обязательно']"
                                            v-model="predictInfo.predictData[0][variable]" type="number"
                                            placeholder="Введите значение">
                                            <template v-slot:append>
                                                <v-icon v-if="predictInfo.predictData[0][variable]" size="x-small"
                                                    color="success">mdi-check-circle</v-icon>
                                            </template>
                                        </v-text-field>
                                    </div>
                                </div>
                            </v-form>
                        </div>
                    </div>

                    <v-divider class="my-4"></v-divider>

                    <div class="prediction-result">
                        <div class="section-title">
                            <v-icon size="small" color="#1e3a5f">mdi-calculator-variant-outline</v-icon>
                            <span>Результат прогноза</span>
                        </div>

                        <div v-if="predictInfo.predictAns !== ''" class="result-container">
                            <div class="result-value"
                                :class="{ 'error-result': isNaN(parseFloat(predictInfo.predictAns)) }">
                                {{ formatResult(predictInfo.predictAns) }}
                            </div>
                            <div class="result-label">
                                {{ isNaN(parseFloat(predictInfo.predictAns)) ? 'невозможно рассчитать' : 'прогнозируемое значение' }}
                            </div>
                        </div>
                        <div v-else class="empty-result">
                            <v-icon color="grey-lighten-1" size="large">mdi-chart-bell-curve</v-icon>
                            <span>Заполните параметры и нажмите "Рассчитать"</span>
                        </div>
                    </div>
                </div>

                <v-divider></v-divider>

                <div class="panel-footer">
                    <v-btn variant="text" size="small" color="grey" @click="resetForm">
                        <v-icon size="small" class="mr-1">mdi-refresh</v-icon>
                        Сбросить
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" variant="flat" size="small" class="predict-btn" @click="predict">
                        <v-icon size="small" class="mr-1">mdi-lightning-bolt</v-icon>
                        <v-progress-circular v-if="isCalculating" indeterminate color="white" :size="16" :width="2"
                            class="ml-2"></v-progress-circular>
                        Рассчитать
                    </v-btn>
                </div>
            </v-card>
        </v-menu>
    </div>
</template>

<script setup lang="ts">
import { calculatePredicted } from '@/app_lib/metrics';
import { ref, reactive } from 'vue';
import { IBasis } from './index.vue'
import { TypeData } from '@/store/chart';


type TypeDataInfo = {
    data: TypeData;
    fields: string[];
}


const props = defineProps<{
    dataInfo: TypeDataInfo;
    allBases: Record<string, IBasis>;
}>();


let menu = ref(false);
let isCalculating = ref(false);

function switchMenu() {
    menu.value = !menu.value;
};

type TypePredictInfo = {
    predictData: TypeData;
    predictAns: string
}

const predictInfo = reactive<TypePredictInfo>({
    predictData: [{}],
    predictAns: ''
});

const form1 = ref<HTMLFormElement>(null);

function formatResult(result: string) {
    const numValue = parseFloat(result);
    if (!isNaN(numValue)) {
        return new Intl.NumberFormat('ru-RU', {
            maximumFractionDigits: 4,
            minimumFractionDigits: 2
        }).format(numValue);
    }
    return 'Ошибка расчета';
}

function resetForm() {
    predictInfo.predictData = [{}];
    predictInfo.predictAns = '';
    if (form1.value) form1.value.reset();
}

async function predict() {
    const isValid: boolean = await form1.value.validate();
    if (isValid) {
        isCalculating.value = true;
        try {
            const result: number[] = (await calculatePredicted([predictInfo.predictData[0]], props.allBases, false));
            if (result && result.length > 0) {
                const value = result[0];
                if (isNaN(value) || !isFinite(value)) {
                    predictInfo.predictAns = 'NaN';
                } else {
                    predictInfo.predictAns = value.toFixed(4);
                }
            } else {
                predictInfo.predictAns = 'NaN';
            }
        } catch (error) {
            console.error('Ошибка расчета:', error);
            predictInfo.predictAns = 'NaN';
        } finally {
            isCalculating.value = false;
        }
    } else {
        alert('Пожалуйста, заполните все необходимые поля');
    }
};

defineExpose({
    switchMenu,
    predict,
});
</script>

<style scoped>
.predict-card {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid #e0e6ed;
}

.panel-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(to right, #e6f0fa, #d0e6fa);
    color: #1e3a5f;
}

.header-content {
    display: flex;
    align-items: center;
}

.icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background-color: rgba(30, 58, 95, 0.1);
    border-radius: 6px;
    margin-right: 10px;
}

.panel-content {
    padding: 16px;
    max-height: 500px;
    overflow-y: auto;
    background-color: #fafbfc;
}

.info-banner {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background-color: #edf2fa;
    border-radius: 8px;
    margin-bottom: 16px;
}

.info-text {
    font-size: 12px;
    color: #1e3a5f;
}

.variables-container {
    margin-bottom: 20px;
}

.variables-scroll-container {
    max-height: 240px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid #e0e6ed;
    border-radius: 8px;
    background-color: white;
    padding: 12px;
}

.variables-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.variable-input-field {
    margin-bottom: 4px;
}

.variable-label {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #1e3a5f;
    margin-bottom: 4px;
    font-weight: 500;
}

.input-field {
    transition: all 0.2s ease;
}

.input-field:focus-within {
    box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.1);
}

.section-title {
    display: flex;
    align-items: center;
    color: #1e3a5f;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
}

.section-title .v-icon {
    margin-right: 8px;
}

.result-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 10px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e6ed;
    transition: all 0.3s ease;
    min-height: 100px;
}

.result-value {
    font-family: 'Roboto Mono', monospace;
    font-size: 24px;
    font-weight: 600;
    color: #1e3a5f;
    word-break: break-word;
    text-align: center;
    max-width: 100%;
}

.error-result {
    color: #d32f2f;
}

.result-label {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
    text-align: center;
}

.empty-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border-radius: 10px;
    padding: 24px 16px;
    border: 1px dashed #d0d7de;
    color: #64748b;
    text-align: center;
    font-size: 13px;
    min-height: 100px;
}

.empty-result .v-icon {
    margin-bottom: 12px;
}

.panel-footer {
    display: flex;
    padding: 12px 16px;
    background-color: white;
    border-top: 1px solid #f0f0f0;
}

.predict-btn {
    text-transform: none;
    letter-spacing: 0.5px;
    font-weight: 500;
    padding: 0 16px;
}

.variables-scroll-container::-webkit-scrollbar {
    width: 6px;
}

.variables-scroll-container::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.variables-scroll-container::-webkit-scrollbar-thumb {
    background: #c4d8e9;
    border-radius: 10px;
}

.variables-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #7aa2d9;
}
</style>