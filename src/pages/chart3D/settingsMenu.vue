<template>
    <div>
        <v-menu v-model="menu" :close-on-content-click="false" location="end" :activator="'parent'"
            transition="slide-y-transition" :offset="10" min-width="480">
            <v-card class="settings-card elevation-4" width="480">
                <div class="panel-header">
                    <div class="header-content">
                        <div class="icon-container">
                            <v-icon size="small" color="#1e3a5f">mdi-tune-vertical</v-icon>
                        </div>
                        <span class="text-subtitle-2 font-weight-medium">Настройки отображения</span>
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn icon="mdi-close" density="compact" variant="text" color="grey-darken-1" 
                        @click="menu = false" size="x-small"></v-btn>
                </div>

                <div class="panel-content">
                    <div class="settings-section x-axis-section">
                        <div class="section-title">
                            <v-icon size="small" color="#1e3a5f">mdi-axis-x-arrow-lock</v-icon>
                            <span>Ось X (абсцисса)</span>
                        </div>
                        
                        <div class="setting-body">
                            <v-autocomplete 
                                v-model="settingsClone.xVal" 
                                item-title="val" 
                                item-value="id" 
                                :items="xKeys"
                                density="compact"
                                hide-details
                                variant="outlined"
                                bg-color="white"
                                class="rounded-lg mb-2">
                                <template #label>
                                    <div class="setting-label">Переменная по оси X</div>
                                </template>
                                <template #prepend-inner>
                                    <v-icon size="x-small" color="primary" class="mr-2">mdi-arrow-right-bold</v-icon>
                                </template>
                                <template #item="{ item, props }">
                                    <v-list-item density="compact" v-bind="props">
                                        <template #prepend>
                                            <v-icon size="x-small" color="primary">mdi-chart-timeline-variant</v-icon>
                                        </template>
                                        <template #title>
                                            <span class="text-body-2">{{ item.title }}</span>
                                        </template>
                                    </v-list-item>
                                </template>
                            </v-autocomplete>
                        </div>
                    </div>
                    
                    <div class="settings-section range-section">
                        <div class="section-title">
                            <v-icon size="small" color="#1e3a5f">mdi-chart-bell-curve-cumulative</v-icon>
                            <span>Диапазон данных</span>
                        </div>
                        
                        <div class="setting-body">
                            <div class="range-controls">
                                
                                
                                <div class="range-input">
                                    <v-text-field 
                                        v-model="settingsClone.posAxis" 
                                        hide-details
                                        density="compact"
                                        variant="outlined"
                                        bg-color="white"
                                        class="rounded-lg">
                                        <template #label>
                                            <div class="setting-label">Пол. ось</div>
                                        </template>
                                        <template #prepend-inner>
                                            <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-arrow-up-bold</v-icon>
                                        </template>
                                    </v-text-field>
                                </div>
                                <div class="range-separator">—</div>
                                <div class="range-input">
                                    <v-text-field 
                                        v-model="settingsClone.negAxis" 
                                        hide-details
                                        density="compact"
                                        variant="outlined"
                                        bg-color="white"
                                        class="rounded-lg">
                                        <template #label>
                                            <div class="setting-label">Нег. ось</div>
                                        </template>
                                        <template #prepend-inner>
                                            <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-arrow-down-bold</v-icon>
                                        </template>
                                    </v-text-field>
                                </div>
                                
                            </div>
                            
                            <v-btn 
                                @click="resetRange" 
                                size="small" 
                                variant="text" 
                                color="grey-darken-1"
                                class="reset-btn mt-1 px-2"
                                density="comfortable"
                                block>
                                <v-icon size="small" class="mr-1">mdi-refresh</v-icon>
                                Сбросить диапазон
                            </v-btn>
                        </div>
                    </div>

                    <div class="settings-section range-section">
                        <div class="section-title">
                            <v-icon size="small" color="#1e3a5f">mdi-chart-bell-curve-cumulative</v-icon>
                            <span>Шаг сетки</span>
                        </div>
                        
                        <div class="setting-body">
                            <div class="range-controls">
                                <div class="range-input">
                                    <v-text-field 
                                        v-model="settingsClone.gridStep" 
                                        hide-details
                                        density="compact"
                                        variant="outlined"
                                        bg-color="white"
                                        class="rounded-lg">
                                        <template #label>
                                            <div class="setting-label">Шаг сетки</div>
                                        </template>
                                        <template #prepend-inner>
                                            <v-icon size="x-small" color="grey-darken-1" class="mr-1">mdi-arrow-down-bold</v-icon>
                                        </template>
                                    </v-text-field>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                </div>

                <v-divider></v-divider>

                <div class="panel-footer">
                    <v-btn
                        color="grey"
                        variant="text"
                        size="small"
                        @click="menu = false"
                        class="cancel-btn">
                        Отмена
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn 
                        color="primary" 
                        variant="flat" 
                        size="small" 
                        @click="apply()" 
                        prepend-icon="mdi-check"
                        class="apply-btn">
                        Применить
                    </v-btn>
                </div>
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
    props.settings.negAxis = '';
    props.settings.posAxis = '';
    settingsClone.value.negAxis = '';
    settingsClone.value.posAxis = '';
    emit('applySettings');
};

defineExpose({
    switchMenu
})
</script>

<style scoped>
.settings-card {
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
    background-color: #fafbfc;
    overflow-y: auto;
}

.settings-section {
    margin-bottom: 16px;
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e6ed;
}

.section-title {
    display: flex;
    align-items: center;
    color: #1e3a5f;
    font-size: 13px;
    font-weight: 500;
    padding: 10px 12px;
    background-color: #f2f7fc;
    border-bottom: 1px solid #e2ecf7;
}

.section-title .v-icon {
    margin-right: 8px;
}

.setting-body {
    padding: 16px;
}

.setting-label {
    font-size: 12px;
    color: #64748b;
}

.range-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.range-input {
    flex: 1;
}

.range-separator {
    color: #64748b;
    font-weight: 500;
    padding-bottom: 8px;
}

.reset-btn {
    margin-top: 10px;
    text-transform: none;
    font-size: 12px;
    font-weight: normal;
    width: 100%;
}

.display-options {
    display: flex;
    gap: 12px;
}

.display-option {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 8px;
    border-radius: 6px;
    border: 1px solid #e2ecf7;
    background-color: #f8fafc;
    cursor: pointer;
    transition: all 0.2s ease;
}

.display-option:hover {
    background-color: #f0f7ff;
    transform: translateY(-2px);
}

.display-option.active {
    background-color: #e6f1fa;
    border-color: #7aa2d9;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.option-icon {
    margin-bottom: 8px;
    color: #1e3a5f;
}

.option-label {
    font-size: 12px;
    color: #1e3a5f;
    font-weight: 500;
}

.panel-footer {
    display: flex;
    padding: 12px 16px;
    background-color: white;
    border-top: 1px solid #f0f0f0;
}

.apply-btn, .cancel-btn {
    text-transform: none;
    font-size: 13px;
    font-weight: 500;
}

.apply-btn {
    min-width: 100px;
}

/* Additional styles for better visual cues */
.v-text-field:focus-within {
    box-shadow: 0 0 0 2px rgba(30, 58, 95, 0.1);
}
</style>