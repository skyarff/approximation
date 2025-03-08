<template>
    <v-menu v-model="isVisible" :close-on-content-click="false" location="bottom">
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
                <v-btn icon="mdi-close" size="x-small" variant="text" @click="isVisible = false"></v-btn>
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
                
                    <div class="menu-actions">
                        <v-btn color="indigo-lighten-1" variant="flat" 
                            @click="saveToLocalStorage" class="text-white action-btn">
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
import { ref, onMounted } from 'vue';

const props = defineProps({
    basisFunctions: Array
});

const emit = defineEmits(['functions-updated']);

const isVisible = ref(false);
const customFunctions = ref([]);
const functionName = ref('');
const functionCode = ref('');
const editIndex = ref(-1);
const testValue = ref(1);
const testResult = ref(null);




onMounted(() => {
    const savedFunctions = localStorage.getItem('customFunctions');
    if (savedFunctions) {
        customFunctions.value = JSON.parse(savedFunctions);
    }
});


function addFunction() {

    if (functionName.value && functionCode.value) {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        
        const funcVal = `uf${functionName.value.toUpperCase()}#${functionCode.value}`;

        const functionData = {
            id: randomId,
            val: funcVal,
            label: ''
        };
        
        if (editIndex.value >= 0) {
            customFunctions.value[editIndex.value] = functionData;
            editIndex.value = -1;
        } else {
            customFunctions.value.push(functionData);
        }
        
        functionName.value = '';
        functionCode.value = '';
        testResult.value = null;
        
        emit('functions-updated');
    }
}



function saveToLocalStorage() {
    addFunction();

    localStorage.setItem('customFunctions', JSON.stringify(customFunctions.value));
    emit('functions-updated');
}

function testFunction() {
    try {
        let functionCode = this.functionCode.value.trim();
        let func;
        
        if (functionCode.startsWith('function')) {
            func = eval(`(${functionCode})`);
        } else if (functionCode.includes('return')) {
            func = new Function('x', functionCode);
        } else {
            func = new Function('x', `return ${functionCode}`);
        }
        
        const result = func(parseFloat(testValue.value));
        testResult.value = Number.isFinite(result) ? result : 'Ошибка: неверный результат';
    } catch (error) {
        testResult.value = `Ошибка: ${error.message}`;
    }
}

defineExpose({
    customFunctions,
    addFunction,
    saveToLocalStorage,
    isVisible
});
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

.test-inputs {
    display: flex;
    align-items: center;
}

.test-result {
    padding: 0.5rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
}

.result-value {
    font-family: 'Roboto Mono', monospace;
    font-weight: 500;
}

/* Адаптивность для маленьких экранов */
@media (max-width: 560px) {
    .function-menu {
        width: 95vw;
    }
}
</style>