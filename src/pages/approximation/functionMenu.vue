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
                        <div class="preview-code">uf{{ functionName.toUpperCase() }}|{{ functionCode }}</div>
                    </div>
                
                    <div class="menu-actions">
                        <v-btn color="indigo-lighten-1" variant="flat" 
                            @click="addFunction" class="text-white action-btn">
                            <v-icon size="small" class="mr-1">mdi-plus</v-icon>
                            <span>ДОБАВИТЬ</span>
                        </v-btn>
                        
                        <v-btn color="amber-darken-1" variant="flat" 
                            @click="saveToLocalStorage" class="text-white action-btn ml-2">
                            <v-icon size="small" class="mr-1">mdi-content-save</v-icon>
                            <span>СОХРАНИТЬ</span>
                        </v-btn>
                    </div>
                </div>
                
                <!-- Тестовая панель для JavaScript функций -->
                <div class="section-title mt-4">
                    <v-icon size="small" color="#1e3a5f">mdi-code-json</v-icon>
                    <span>Проверка JavaScript функции</span>
                </div>
                
                <div class="config-section">
                    <div class="test-inputs">
                        <v-text-field
                            density="compact"
                            hide-details
                            variant="outlined"
                            class="rounded-lg"
                            v-model="testValue"
                            label="Тестовое значение"
                            type="number"
                            bg-color="white"
                        ></v-text-field>
                        
                        <v-btn color="teal-lighten-1" variant="flat" 
                            @click="testFunction" class="text-white action-btn ml-2">
                            <v-icon size="small" class="mr-1">mdi-play</v-icon>
                            <span>ТЕСТ</span>
                        </v-btn>
                    </div>
                    
                    <div v-if="testResult !== null" class="test-result mt-2">
                        <div class="control-label">Результат:</div>
                        <div class="result-value">{{ testResult }}</div>
                    </div>
                </div>
                
                <!-- Список существующих функций -->
                <div class="section-title mt-4">
                    <v-icon size="small" color="#1e3a5f">mdi-view-list</v-icon>
                    <span>Пользовательские функции</span>
                    <div class="panel-counter" v-if="customFunctions.length">
                        {{ customFunctions.length }}
                    </div>
                </div>
                
                <div class="function-list">
                    <div v-for="(func, index) in customFunctions" :key="index" class="basis-item">
                        <div class="basis-formula">
                            <strong>{{ func.label }}</strong>
                            <div class="function-code">{{ func.val }}</div>
                        </div>
                        <div class="basis-actions">
                            <v-btn icon="mdi-pencil" density="compact" variant="text" color="blue"
                                @click="editFunction(index)" size="x-small" class="mr-1"></v-btn>
                            <v-btn icon="mdi-close" density="compact" variant="text" color="red"
                                @click="removeFunction(index)" size="x-small"></v-btn>
                        </div>
                    </div>
                    <div v-if="!customFunctions.length" class="no-data-message">
                        <v-icon color="grey-lighten-1" size="large" class="mb-2">mdi-function-variant</v-icon>
                        <div>Нет пользовательских функций</div>
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

// Генерация случайного ID
function generateRandomId() {
    // Генерируем случайное число от 1000 до 9999
    return Math.floor(1000 + Math.random() * 9000);
}

// Загрузка данных из localStorage при монтировании компонента
onMounted(() => {
    const savedFunctions = localStorage.getItem('customFunctions');
    if (savedFunctions) {
        customFunctions.value = JSON.parse(savedFunctions);
    }
});

// Добавление или обновление функции
function addFunction() {
    // Проверяем наличие имени и кода функции
    if (functionName.value && functionCode.value) {
        // Генерируем случайный ID
        const randomId = generateRandomId();
        
        // Формируем значение функции в нужном формате
        const funcVal = `uf${functionName.value.toUpperCase()}|${functionCode.value}`;
        
        // Используем имя функции как метку
        const label = functionName.value;
        
        const functionData = {
            id: randomId,
            val: funcVal,
            label: label
        };
        
        if (editIndex.value >= 0) {
            // Обновляем существующую функцию
            customFunctions.value[editIndex.value] = functionData;
            editIndex.value = -1;
        } else {
            // Добавляем новую функцию
            customFunctions.value.push(functionData);
        }
        
        // Очистка полей ввода
        functionName.value = '';
        functionCode.value = '';
        testResult.value = null;
        
        // Уведомляем родительский компонент об изменениях
        emit('functions-updated');
    }
}

// Редактирование функции
function editFunction(index) {
    const func = customFunctions.value[index];
    
    // Разбираем значение функции
    let val = func.val;
    
    // Извлекаем имя и код функции
    if (val.startsWith('uf') && val.includes('|')) {
        const namePart = val.substring(2, val.indexOf('|'));
        const codePart = val.substring(val.indexOf('|') + 1);
        
        functionName.value = namePart;
        functionCode.value = codePart;
    } else {
        // Если формат не соответствует ожидаемому
        functionName.value = func.label;
        functionCode.value = val;
    }
    
    editIndex.value = index;
}

// Удаление функции
function removeFunction(index) {
    customFunctions.value.splice(index, 1);
    
    // Если удаляем редактируемую функцию, сбрасываем форму
    if (index === editIndex.value) {
        functionName.value = '';
        functionCode.value = '';
        editIndex.value = -1;
    }
    
    // Уведомляем родительский компонент об изменениях
    emit('functions-updated');
}

// Сохранение в localStorage
function saveToLocalStorage() {
    localStorage.setItem('customFunctions', JSON.stringify(customFunctions.value));
    
    // Уведомляем родительский компонент об изменениях
    emit('functions-updated');
    
    // Уведомить пользователя
    alert('Функции сохранены в localStorage');
}

// Тестирование JavaScript-функции
function testFunction() {
    try {
        // Используем код функции напрямую
        let functionCode = this.functionCode.value.trim();
        let func;
        
        // Проверяем формат кода
        if (functionCode.startsWith('function')) {
            // Функция уже определена полностью
            func = eval(`(${functionCode})`);
        } else if (functionCode.includes('return')) {
            // Содержит только тело функции
            func = new Function('x', functionCode);
        } else {
            // Предполагаем, что это выражение
            func = new Function('x', `return ${functionCode}`);
        }
        
        // Выполняем функцию с тестовым значением
        const result = func(parseFloat(testValue.value));
        testResult.value = Number.isFinite(result) ? result : 'Ошибка: неверный результат';
    } catch (error) {
        testResult.value = `Ошибка: ${error.message}`;
    }
}

// Экспорт функций для внешнего использования
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