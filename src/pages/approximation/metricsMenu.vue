<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" location="top" :activator="'parent'"
            transition="scale-transition" :offset="8">
            <v-card min-width="380" class="metrics-card elevation-4">
                <div class="panel-header">
                    <div class="d-flex align-center">
                        <v-icon class="mr-2" size="small" color="#1e3a5f">mdi-chart-box-outline</v-icon>
                        <span class="text-subtitle-2 font-weight-medium">Аналитические метрики</span>
                        <v-chip size="x-small" color="primary" variant="flat" class="ml-2 px-2">
                            {{ Object.keys(metrics).length }}
                        </v-chip>
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-close" density="compact" variant="text" color="grey-darken-1" @click="menu = false"
                        size="small"></v-btn>
                </div>

                <div class="panel-content">
                    <div v-if="Object.keys(metrics).length" class="metrics-container">
                        <div v-for="(value, key) in metrics" :key="key" class="metric-item">
                            <div class="metric-info">
                                <div class="metric-name">{{ metricNames[key] }}</div>
                                <div class="metric-description">{{ metricDescriptions[key] }}</div>
                            </div>
                            <div class="metric-value-container">
                                <div class="metric-value">{{ value.toFixed(4) }}</div>
                                <v-icon :color="getMetricColor(key, value)" size="small" class="ml-1">
                                    {{ getMetricIcon(key, value) }}
                                </v-icon>
                            </div>
                        </div>
                    </div>
                    <div v-else class="no-data-message">
                        <v-icon color="grey-lighten-1" size="x-large" class="mb-3">mdi-chart-line-variant-off</v-icon>
                        <div class="text-body-1 mb-1">Нет доступных метрик</div>
                        <div class="text-caption text-grey">Выполните аппроксимацию для получения метрик</div>
                    </div>
                </div>

                <v-divider></v-divider>

                <div class="panel-footer">
                    <v-btn color="primary" variant="text" size="small" class="text-caption"
                        @click="copyMetricsToClipboard" prepend-icon="mdi-content-copy">
                        Копировать метрики
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" size="small" class="text-caption" @click="menu = false">
                        Закрыть
                    </v-btn>
                </div>
            </v-card>
        </v-menu>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PropType } from 'vue';

import { useAppStore } from '@/store/app';
const appStore: any = useAppStore();


type ObjectStrings = Record<string, string>;
type ObjectNumbers = Record<string, number>;


const props = defineProps({
  metrics: {
    type: Object as PropType<ObjectNumbers>,
    default: () => ({})
  }
});


let menu = ref<boolean>(false);

function switchMenu(): void {
    menu.value = !menu.value;
}

const metricNames: ObjectStrings = {
    'R2': 'R² (коэффициент детерминации)',
    'AIC': 'AIC (информационный критерий Акаике)',
    'MSE': 'MSE (среднеквадратичная ошибка)'
};


const metricDescriptions: ObjectStrings = {
    'R2': 'Оценивает качество подгонки модели к данным',
    'AIC': 'Оценивает качество модели с учетом сложности',
    'MSE': 'Измеряет среднюю квадратичную ошибку модели'
};




function getMetricIcon(key: string, value: number): string {
    if (key === 'R2' && value > 0.8) return 'mdi-check-circle';
    if (key === 'R2' && value > 0.5) return 'mdi-check';
    if (key === 'R2') return 'mdi-alert-circle';

    if (key === 'MSE' && value < 0.1) return 'mdi-check-circle';
    if (key === 'MSE' && value < 0.5) return 'mdi-check';
    if (key === 'MSE') return 'mdi-alert-circle';

    return 'mdi-information';
}

function getMetricColor(key: string, value: number): string {
    if (key === 'R2' && value > 0.8) return 'success';
    if (key === 'R2' && value > 0.5) return 'info';
    if (key === 'R2') return 'warning';

    if (key === 'MSE' && value < 0.1) return 'success';
    if (key === 'MSE' && value < 0.5) return 'info';
    if (key === 'MSE') return 'warning';

    return 'grey';
}

function copyMetricsToClipboard(): void {
    const text: string = Object.entries(props.metrics)
        .map(([key, value]) => `${metricNames[key]}: ${value}`)
        .join('\n');

    navigator.clipboard.writeText(text).then(() => {
        appStore.showEvent({
            text: 'Метрики успешно скопированы',
            color: 'succses'
        });
    });
}

defineExpose({
    switchMenu
});
</script>

<style scoped>
.metrics-card {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid #e0e6ed;
}

.panel-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(to right, #e6f0fa, #d0e6fa);
    border-bottom: 1px solid #c4d8e9;
    color: #1e3a5f;
}

.panel-content {
    padding: 16px;
    overflow-y: auto;
    max-height: 400px;
}

.metrics-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #f8fafc;
    border-left: 4px solid #c4d8e9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
}

.metric-item:hover {
    background-color: #f0f7ff;
    border-left-color: #7aa2d9;
    transform: translateX(2px);
}

.metric-info {
    flex: 1;
}

.metric-name {
    font-weight: 500;
    color: #1e3a5f;
    font-size: 14px;
    margin-bottom: 4px;
}

.metric-description {
    font-size: 12px;
    color: #64748b;
}

.metric-value-container {
    display: flex;
    align-items: center;
    background-color: rgba(30, 58, 95, 0.06);
    padding: 4px 12px;
    border-radius: 16px;
}

.metric-value {
    font-family: 'Roboto Mono', monospace;
    font-weight: 500;
    color: #2c3e50;
    font-size: 14px;
}

.no-data-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
    padding: 32px 16px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px dashed #d0d7de;
}

.panel-footer {
    display: flex;
    padding: 8px 16px;
    background-color: #f8fafc;
}
</style>