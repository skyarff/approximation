<template>
    <v-menu v-model="funcMenu" :close-on-content-click="false" location="bottom">
        <template v-slot:activator="{ props }">
            <v-btn variant="text" color="indigo-lighten-1" v-bind="props" class="ml-2">
                <v-icon size="small" class="mr-1">mdi-function-variant</v-icon>
                <span>ФУНКЦИИ</span>
            </v-btn>
        </template>
        
        <div class="function-menu">
            <div class="panel-header">
                <v-icon class="mr-1" size="small" color="#1e3a5f">mdi-function</v-icon>
                <span>Управление функциями</span>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" size="x-small" variant="text" @click="funcMenu = false"></v-btn>
            </div>
            
            <div class="panel-content">
                
                <div class="config-section">
                    <div class="control-group">
                        <div class="control-label">Имя функции</div>
                        <v-text-field
                            density="compact"
                            hide-details
                            variant="outlined"
                            class="rounded-lg"
                            v-model="functionName"
                            placeholder="SIN"
                            bg-color="white"
                        ></v-text-field>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-label">Описание функции</div>
                        <v-text-field
                            density="compact"
                            hide-details
                            variant="outlined"
                            class="rounded-lg"
                            v-model="functionDescription"
                            placeholder="Функция синуса"
                            bg-color="white"
                        ></v-text-field>
                    </div>
                    
                    <div class="control-group">
                        <div class="control-label">Код функции</div>
                        <v-textarea
                            density="compact"
                            hide-details
                            variant="outlined"
                            class="rounded-lg"
                            v-model="functionCode"
                            placeholder="return Math.sin(x);"
                            bg-color="white"
                            rows="4"
                            :persistent-placeholder="true"
                        ></v-textarea>
                    </div>
                    
                    <div class="preview-section" v-if="functionName && functionCode">
                        <div class="control-label">Предпросмотр</div>
                        <div class="preview-code">uf{{ functionName.toUpperCase() }}#{{ functionCode }}</div>
                    </div>
                    
                    <div class="test-section" v-if="functionName && functionCode">
                        <div class="control-label">Тестирование</div>
                        
                        <div class="test-row">
                            <div class="test-x">x =</div>
                            <v-text-field
                                density="compact"
                                hide-details
                                variant="outlined"
                                class="test-input"
                                v-model="testValue"
                                type="number"
                                bg-color="white"
                            ></v-text-field>
                            
                            <v-btn 
                                @click="testFunction" 
                                icon="mdi-play"
                                density="comfortable"
                                color="primary"
                                variant="text" 
                                class="ml-2"
                            ></v-btn>
                        </div>
                        
                        <transition name="fade">
                            <div v-if="testPerformed" class="test-result">
                                <template v-if="testError">
                                    <span class="error-text">{{ testError }}</span>
                                </template>
                                <template v-else>
                                    <span class="result-text">f({{ testValue }}) = {{ testResult }}</span>
                                </template>
                            </div>
                        </transition>
                    </div>
                
                    <div class="menu-actions">
                        <v-btn color="indigo-lighten-1" variant="flat" 
                            @click="saveToLocalStorage" class="text-white action-btn"
                            :disabled="testPerformed && testError">
                            <v-icon size="small" class="mr-1">mdi-plus</v-icon>
                            <span>ДОБАВИТЬ</span>
                        </v-btn>
                        
                    </div>
                </div>
                
            </div>
        </div>
    </v-menu>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['functions-updated']);
const funcMenu = ref(false);
const customFunction = ref({});
const functionName = ref('');
const functionCode = ref('');
const functionDescription = ref('');

const testValue = ref(1);
const testResult = ref(null);
const testError = ref(null);
const testPerformed = ref(false);

function testFunction() {
    testPerformed.value = true;
    testResult.value = null;
    testError.value = null;
    
    if (!functionName.value || !functionCode.value) {
        testError.value = "Введите имя и код функции";
        return;
    }
    
    try {
        const functionBody = functionCode.value;
        const testFunc = new Function('x', functionBody);
        
        const x = Number(testValue.value);
        const result = testFunc(x);
        
        if (typeof result !== 'number' || isNaN(result)) {
            testError.value = "Функция должна возвращать число";
            return;
        }

        testResult.value = result;
    } catch (error) {
        testError.value = `Ошибка: ${error.message}`;
    }
}

function addFunction() {
    if (functionName.value && functionCode.value) {
        if (!testPerformed.value || !testError.value) {
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const funcVal = `uf${functionName.value.toUpperCase()}#${functionCode.value}`;
            
            customFunction.value = {
                id: randomId,
                val: funcVal,
                label: functionDescription.value || ''
            };
            
            return true;
        }
        return false;
    }
    return false;
}

function saveToLocalStorage() {
    if (addFunction()) {
        emit('functions-updated', customFunction.value);
        
        functionName.value = '';
        functionCode.value = '';
        functionDescription.value = '';
        testValue.value = 1;
        testResult.value = null;
        testError.value = null;
        testPerformed.value = false;
        
        funcMenu.value = false;
    }
}

</script>

<style scoped>
.function-menu {
    width: 520px;
    max-height: 700px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.panel-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(to right, #e6f0fa, #d0e6fa);
    border-bottom: 1px solid #c4d8e9;
    font-weight: 500;
    font-size: 15px;
    color: #1e3a5f;
}

.panel-content {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    max-height: 650px;
}

.section-title {
    display: flex;
    align-items: center;
    color: #1e3a5f;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
    white-space: nowrap;
}

.section-title .v-icon {
    margin-right: 4px;
}

.panel-counter {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    background-color: rgba(30, 58, 95, 0.1);
    height: 20px;
    min-width: 20px;
    border-radius: 10px;
    font-size: 12px;
    padding: 0 6px;
}

.config-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.control-group {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.control-label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
}

.menu-actions {
    display: flex;
    margin-top: 8px;
}

.action-btn {
    flex: 1;
    white-space: nowrap;
    letter-spacing: 0.5px;
    height: 38px;
    font-size: 13px;
    font-weight: 500;
}

.function-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 250px;
    overflow-y: auto;
}

.basis-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0.75rem;
    background-color: #f2f7fc;
    border: 1px solid #e2ecf7;
    border-radius: 6px;
    transition: all 0.2s;
}

.basis-item:hover {
    background-color: #e6f1fa;
    transform: translateX(2px);
}

.basis-formula {
    font-family: 'Roboto Mono', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    margin-right: 8px;
}

.function-code {
    font-size: 12px;
    margin-top: 4px;
    padding: 6px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    font-family: monospace;
}

.preview-section {
    margin-top: 8px;
}

.preview-code {
    font-size: 12px;
    margin-top: 4px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
    border: 1px dashed #ccc;
}

.basis-actions {
    display: flex;
    align-items: center;
}

.no-data-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px dashed #d0d7de;
}


.test-section {
    margin-top: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding-top: 16px;
}

.test-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
}

.test-x {
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    color: #555;
    margin-right: 8px;
}

.test-input {
    width: 100px;
    margin-right: 4px;
}

.test-result {
    font-family: 'Roboto Mono', monospace;
    padding: 8px 0;
    margin-top: 4px;
    font-size: 14px;
}

.error-text {
    color: #e53935;
}

.result-text {
    color: #333;
}


.fade-enter-active, .fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(4px);
}

@media (max-width: 560px) {
    .test-row {
        flex-wrap: wrap;
    }
    
    .test-input {
        flex: 1;
        min-width: 80px;
    }
}


@media (max-width: 560px) {
    .function-menu {
        width: 95vw;
    }
    
    .test-inputs {
        flex-direction: column;
        align-items: stretch;
    }
    
    .test-inputs .v-btn {
        margin-left: 0;
        margin-top: 8px;
    }
    
    .test-input {
        max-width: 100%;
    }
}
</style>