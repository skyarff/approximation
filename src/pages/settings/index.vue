<template>
    <div class="settings-container">
        <!-- Блок регуляризации -->
        <v-card elevation="0" rounded="xl" class="settings-card mb-6">
            <div class="card-header-wrapper">
                <v-card-title class="settings-card-title">
                    <div class="icon-wrapper">
                        <v-icon icon="mdi-function-variant" />
                    </div>
                    <span>Регуляризация</span>
                </v-card-title>
            </div>
            <v-card-text class="card-content">
                <!-- L1 регуляризация -->
                <div class="setting-row">
                    <div class="input-container">
                        <v-text-field 
                            :hide-details="true" 
                            variant="outlined" 
                            title="L1 регуляризация" 
                            type="number"
                            v-model="settingsStore.numParams.L1"
                            class="param-input"
                        >
                            <template #label>
                                <div class="param-label">L1</div>
                            </template>
                        </v-text-field>
                    </div>

                    <div class="description-container">
                        <p class="description-text">
                            Штраф функции потерь вида + L1 * (a + b + c ...), где [a, b, c ...] веса базисов.
                        </p>
                    </div>
                </div>
                
                <!-- L2 регуляризация -->
                <div class="setting-row">
                    <div class="input-container">
                        <v-text-field 
                            :hide-details="true" 
                            variant="outlined" 
                            title="L2 регуляризация" 
                            type="number"
                            v-model="settingsStore.numParams.L2"
                            class="param-input"
                        >
                            <template #label>
                                <div class="param-label">L2</div>
                            </template>
                        </v-text-field>
                    </div>
                    <div class="description-container">
                        <p class="description-text">
                            Штраф функции потерь вида + L2 * (a² + b² + c² ...), где [a, b, c ...] веса базисов.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Блок предобработки данных -->
        <v-card elevation="0" rounded="xl" class="settings-card mb-6">
            <div class="card-header-wrapper">
                <v-card-title class="settings-card-title">
                    <div class="icon-wrapper secondary-icon">
                        <v-icon icon="mdi-chart-bell-curve-cumulative" />
                    </div>
                    <span>Предобработка аппроксимируемых данных</span>
                </v-card-title>
            </div>
            <v-card-text class="card-content">
                <!-- Коэффициент умножения -->
                <div class="setting-row">
                    <div class="input-container">
                        <v-text-field 
                            :hide-details="true" 
                            variant="outlined"
                            title="Нормализация входных значений *multiplicationFactor" 
                            type="number"
                            v-model="settingsStore.numParams.multiplicationFactor"
                            class="param-input"
                        >
                            <template #label>
                                <div class="param-label">Коэф. умножения</div>
                            </template>
                        </v-text-field>
                    </div>
                    <div class="description-container">
                        <p class="description-text">
                            В процессе вычисления входные данные сначала будут умножены на данное значение.
                        </p>
                    </div>
                </div>
                
                <!-- Нормализация малых значений -->
                <div class="setting-row">
                    <div class="input-container checkbox-container">
                        <v-checkbox 
                            :hide-details="true" 
                            color="primary"
                            v-model="settingsStore.numParams.normSmallValues"
                            class="param-checkbox"
                        >
                            <template #label>
                                <div class="param-label">Нормализация малых значений</div>
                            </template>
                        </v-checkbox>
                    </div>
                    <div class="description-container">
                        <p class="description-text">
                            Слишком малые по модулю значения (в том числе 0), будут заменены на приемлемо малое значение.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </v-card>

        <!-- Блок построения базисов -->
        <v-card elevation="0" rounded="xl" class="settings-card">
            <div class="card-header-wrapper">
                <v-card-title class="settings-card-title">
                    <div class="icon-wrapper tertiary-icon">
                        <v-icon icon="mdi-chart-scatter-plot" />
                    </div>
                    <span>Построение базисов</span>
                </v-card-title>
            </div>
            <v-card-text class="card-content">
                <!-- Степенной шаг -->
                <div class="setting-row">
                    <div class="input-container">
                        <v-text-field 
                            :hide-details="true" 
                            variant="outlined" 
                            title="Шаг построения степеней базисов"
                            type="number" 
                            v-model="settingsStore.numParams.stepPower"
                            class="param-input"
                        >
                            <template #label>
                                <div class="param-label">Степенной шаг</div>
                            </template>
                        </v-text-field>
                    </div>
                    <div class="description-container">
                        <p class="description-text">
                            Шаг для реализации расширенных базисов.
                        </p>
                    </div>
                </div>
                
                <!-- Наличие константы -->
                <div class="setting-row">
                    <div class="input-container checkbox-container">
                        <v-checkbox 
                            :hide-details="true" 
                            color="primary"
                            hint="Наличие константы"
                            v-model="settingsStore.numParams.constant"
                            class="param-checkbox"
                        >
                            <template #label>
                                <div class="param-label">Наличие константы</div>
                            </template>
                        </v-checkbox>
                    </div>
                    <div class="description-container">
                        <p class="description-text">
                            Наличие или отсутствие константы.
                        </p>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </div>
</template>


<script setup>
import { useSettingsStore } from '@/store/settings'

const settingsStore = useSettingsStore();
</script>



<style scoped>
.settings-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
    background-color: #f9fafc;
}

.settings-card {
    position: relative;
    border: 1px solid rgba(226, 232, 240, 0.8);
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.04) !important;
    overflow: visible;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.settings-card:hover {
    /* transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important; */
}

.card-header-wrapper {
    position: relative;
    background: linear-gradient(135deg, #f8fafd 0%, #edf2f7 100%);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    padding: 0.75rem 1.5rem;
}

.settings-card-title {
    display: flex;
    align-items: center;
    font-size: 1.15rem !important;
    font-weight: 600 !important;
    color: #2d3748;
    padding: 0 !important;
}

.icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background-color: rgba(49, 130, 206, 0.1);
    color: #3182ce;
    border-radius: 10px;
    margin-right: 12px;
}

.secondary-icon {
    background-color: rgba(72, 187, 120, 0.1);
    color: #48bb78;
}

.tertiary-icon {
    background-color: rgba(237, 137, 54, 0.1);
    color: #ed8936;
}

.card-content {
    padding: 1.5rem !important;
}

.setting-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1.25rem;
}

.setting-row:last-child {
    margin-bottom: 0;
}

.input-container {
    flex: 0 0 180px;
    max-width: 180px;
    margin-right: 1.5rem;
}

.checkbox-container {
    display: flex;
    align-items: center;
    height: 48px;
}

.description-container {
    flex: 1;
    padding-top: 0.25rem;
}

.param-input {
    margin: 0;
}

.param-input :deep(.v-field__outline) {
    border-color: #e2e8f0 !important;
    border-width: 1.5px !important;
}

.param-input :deep(.v-field) {
    border-radius: 8px !important;
    background-color: #f8fafc !important;
}

.param-input:hover :deep(.v-field__outline) {
    border-color: #a0aec0 !important;
}

.param-input:focus-within :deep(.v-field__outline) {
    border-color: #4299e1 !important;
    border-width: 2px !important;
}

.param-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #4a5568;
}

.param-checkbox :deep(.v-checkbox__check) {
    border-width: 1.5px;
}

.description-text {
    margin: 0;
    line-height: 1.6;
    color: #4a5568;
    font-size: 0.95rem;
}

@media (max-width: 768px) {
    .setting-row {
        flex-direction: column;
    }
    
    .input-container {
        flex: 0 0 100%;
        max-width: 100%;
        margin-right: 0;
        margin-bottom: 0.75rem;
    }
    
    .description-container {
        padding-top: 0;
    }
    
    .settings-container {
        padding: 1rem;
    }
}
</style>