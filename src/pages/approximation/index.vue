<template>
    <div class="app-container">
        <!-- Скрытый input для загрузки файла -->
        <input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="fileUpload" style="display: none" ref="fileInput" />

        <!-- Верхняя панель -->


        <!-- Основной контент -->
        <main class="app-content">
            <!-- Панели управления - двухстрочный вариант -->
            <div class="configuration-panel">
                <div class="config-section">
                    <div class="section-title">
                        <v-icon size="small" color="#1e3a5f">mdi-function</v-icon>
                        <span>Функция и параметры</span>


                        <v-spacer></v-spacer>
                        <functionMenu ref="functionMenuRef" @functions-updated="updateFunctionList" />


                    </div>
                    <div class="config-controls">

                        <div class="control-group basis-function">


                            
                            <div class="control-label">Выберите функцию</div>
                            <v-autocomplete density="compact" hide-details variant="outlined" class="rounded-lg"
                                v-model="funcSettings.selectedFunction" :items="funcSettings.basisFunctions"
                                :item-title="item => `${item.val.split('|')[0]} (${item.label})`" item-value="val" bg-color="white" />
                        </div>
                        <div class="control-group degree">
                            <div class="control-label">Степень</div>
                            <v-text-field density="compact" hide-details variant="outlined" class="rounded-lg"
                                type="number" v-model="numParams.degree" bg-color="white" />
                        </div>
                        <div class="control-group depth">
                            <div class="control-label">Глубина</div>
                            <v-select density="compact" hide-details variant="outlined" class="rounded-lg"
                                v-model="numParams.depth" :items="numParams.depths" item-title="val" item-value="val"
                                bg-color="white" />
                        </div>

                    </div>
                </div>

                <div class="config-section">
                    <div class="section-title">
                        <v-icon size="small" color="#1e3a5f">mdi-function-variant</v-icon>
                        <span>Выходная функция</span>
                    </div>
                    <div class="config-controls">
                        <div class="control-group output-function">
                            <div class="control-label">Выходная функция</div>
                            <v-autocomplete density="compact" hide-details variant="outlined" class="rounded-lg"
                                v-model="funcSettings.selectedOutputFunction" :items="funcSettings.basisFunctions"
                                :item-title="item => `${item.val.split('|')[0]} (${item.label})`" item-value="val" bg-color="white" />
                        </div>
                        <div class="control-group output-degree">
                            <div class="control-label">Степень</div>
                            <v-text-field density="compact" hide-details variant="outlined" class="rounded-lg"
                                type="number" v-model="funcSettings.outputDegree" bg-color="white" />
                        </div>
                        <div class="control-group variable">
                            <div class="control-label">Переменная</div>
                            <v-select density="compact" hide-details variant="outlined" class="rounded-lg"
                                :disabled="!customSettings.selectedVariable" v-model="customSettings.selectedVariable"
                                :items="dataInfo.fields.slice(1)" item-title="field" item-value="field"
                                bg-color="white" />
                        </div>
                    </div>
                </div>

                <div class="config-section action-section">

                    <div class="action-section-content">
                        <!-- Верхний ряд с главными кнопками -->
                        <div class="top-actions mb-2">
                            <v-tooltip text="Получить предсказание" location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn @click="predictMenuRef.switchMenu()" variant="tonal" color="indigo-lighten-4"
                                        v-bind="props" :class="['action-main-btn']">
                                        <component :is="icons.KeyIcon" :color="'#000'" />
                                        <predictMenu :allBases="allBases" :dataInfo="dataInfo" ref="predictMenuRef" />
                                    </v-btn>
                                </template>
                            </v-tooltip>

                            <v-tooltip text="Установить данные в график" location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn :class="['ml-2', 'action-main-btn']" color="primary" variant="flat"
                                        @click="setChartData" v-bind="props">
                                        <v-icon left class="mr-1">mdi-chart-line</v-icon>
                                        <span>ДАННЫЕ</span>
                                        <v-progress-circular v-if="setChartDataLoading" indeterminate color="white"
                                            :size="16" :width="2" class="ml-2" />
                                    </v-btn>
                                </template>
                            </v-tooltip>

                            <v-tooltip text="Загрузить данные из Excel файла" location="bottom">
                                <template v-slot:activator="{ props }">
                                    <v-btn color="success" variant="flat"
                                        :class="['ml-2', 'action-main-btn', { 'file-loaded': file }]"
                                        @click="$refs.fileInput.click()" v-bind="props">
                                        <v-icon left class="mr-1">mdi-file-upload</v-icon>
                                        <span>ЗАГРУЗИТЬ</span>
                                        <v-icon v-if="file" class="ml-1" size="small">mdi-check-circle</v-icon>
                                    </v-btn>
                                </template>
                            </v-tooltip>
                        </div>

                        <!-- Нижний ряд с вторичными кнопками -->
                        <div class="bottom-actions">
                            <v-btn :disabled="!file" color="indigo-lighten-1" variant="flat" size="small"
                                @click="addExtendedBasis" class="text-white action-btn">
                                <v-icon size="small" class="mr-1">mdi-math-integral-box</v-icon>
                                <span>РАСШ. БАЗИС</span>
                            </v-btn>
                            <v-btn :disabled="!customSettings.customBasis.functions.length" color="blue-lighten-1"
                                variant="flat" size="small" @click="addOutputFunc" class="text-white action-btn">
                                <v-icon size="small" class="mr-1">mdi-function-variant</v-icon>
                                <span>ВЫХ. ФУНКЦИЯ</span>
                            </v-btn>
                            <v-btn :disabled="!file" color="teal-lighten-1" variant="flat" size="small"
                                @click="addVariable" class="text-white action-btn">
                                <v-icon size="small" class="mr-1">mdi-plus</v-icon>
                                <span>ДОБАВИТЬ</span>
                            </v-btn>
                            <v-btn :disabled="!customSettings.customBasis.functions.length" color="amber-darken-1"
                                variant="flat" size="small" @click="addCustomBasis" class="text-white action-btn">
                                <v-icon size="small" class="mr-1">mdi-database-plus</v-icon>
                                <span>БАЗИС</span>
                            </v-btn>
                            <v-btn :disabled="!file" color="red-lighten-1" variant="flat" size="small"
                                @click="clearCustomBasis" class="text-white action-btn">
                                <v-icon size="small" class="mr-1">mdi-refresh</v-icon>
                                <span>ОБНУЛИТЬ</span>
                            </v-btn>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Основные панели -->
            <div class="panels-container">
                <!-- Верхний ряд панелей -->
                <div class="panels-row">
                    <!-- Добавляемый базис -->
                    <section class="panel adding-basis">
                        <div class="panel-header">
                            <v-icon class="mr-1" size="small" color="#1e3a5f">mdi-math-integral</v-icon>
                            <span>Добавляемый базис</span>
                        </div>
                        <div class="panel-content">
                            <div v-if="customSettings.customBasis.functions.length" class="basis-preview">
                                {{ getBasisName(customSettings.customBasis) }}
                            </div>
                            <div v-else class="no-data-message">
                                <v-icon color="grey-lighten-1" size="large" class="mb-2">mdi-function</v-icon>
                                <div>Базис не определен</div>
                            </div>
                        </div>
                    </section>

                    <!-- Расширенные базисы -->
                    <section class="panel extended-bases">
                        <div class="panel-header">
                            <v-icon class="mr-1" size="small" color="#1e3a5f">mdi-view-list</v-icon>
                            <span>Расширенные базисы</span>
                            <div class="panel-counter" v-if="extendedBases.size">
                                {{ extendedBases.size }}
                            </div>

                            <v-spacer></v-spacer>

                

                            <v-btn style="max-width: 120px;" :disabled="!extendedBases.size" color="indigo-lighten-1" variant="flat" size="small"
                                @click="extendedBases.clear()" class="text-white action-btn mr-4">
                                <v-icon size="small" class="mr-1">mdi-math-integral-box</v-icon>
                                <span>ОЧИСТИТЬ</span>
                            </v-btn>

                            <v-btn style="max-width: 120px;" color="teal-lighten-1" variant="flat" size="small"
                                @click="rememberExtendedBases" class="text-white action-btn">
                                <v-icon size="small" class="mr-1">mdi-plus</v-icon>
                                <span>ЗАПОМНИТЬ</span>
                            </v-btn>

                        </div>
                        <div class="panel-content">
                            <div class="basis-list">
                                <div v-for="(basis, index) in extendedBases" :key="index" class="basis-item">
                                    <div class="basis-formula">{{ getExtendedBasisName(basis) }}</div>
                                    <v-btn icon="mdi-close" density="compact" variant="text" color="red"
                                        @click="extendedBases.delete(basis)"
                                        size="x-small"></v-btn>
                                </div>
                                <div v-if="!extendedBases.size" class="no-data-message">
                                    <v-icon color="grey-lighten-1" size="large" class="mb-2">mdi-database-off</v-icon>
                                    <div>Нет расширенных базисов</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Нижний ряд - Базисы с контролами -->
                <section class="panel bases-panel">
                    <div class="panel-header">
                        <v-icon class="mr-1" size="small" color="#1e3a5f">mdi-database</v-icon>
                        <span>Базисы</span>
                        <div class="panel-counter" v-if="allBasesKeys.length">
                            {{ allBasesKeys.length }}
                        </div>

                        <v-spacer />

                        <div>
                            <span class="text-caption text-grey mr-4">Удалить базисы</span>
                        </div>

                        <v-select :disabled="!Number.isFinite(allBasesArr[0]?.impact)" style="max-width: 110px;"
                            density="compact" hide-details variant="outlined" class="rounded-lg mr-4"
                            v-model="variableImpact" :items="['all', ...dataInfo.fields.slice(1)]" item-title="field"
                            item-value="field" bg-color="white" />

                        <v-text-field :disabled="!Number.isFinite(allBasesArr[0]?.impact)" :hide-details="true"
                            variant="outlined" title="фильтр вклада" type="number" v-model="minImpact"
                            class="param-input mr-4" style="max-width: 110px;">
                            <template #label>
                                <div class="param-label">вклад</div>
                            </template>
                        </v-text-field>


                        <v-btn style="max-width: 110px;" :disabled="!Number.isFinite(allBasesArr[0]?.impact)"
                            color="indigo-lighten-1" variant="flat" size="small" @click="filterBasesByImapct"
                            class="text-white action-btn">
                            <v-icon size="small" class="mr-1">mdi-math-integral-box</v-icon>
                            <span>ПРИМЕНИТЬ</span>
                        </v-btn>



                        <v-spacer />

                        <div class="panel-actions">


                            <v-btn style="max-width: 130px;" :disabled="!result?.success" color="indigo-lighten-1"
                                variant="flat" size="small" @click="calculateMetrics"
                                class="text-white action-btn mr-4">
                                <v-icon size="small" class="mr-1">mdi-math-integral-box</v-icon>
                                <span>Расч. метрики</span>
                            </v-btn>

                            <v-btn :disabled="!allBasesKeys.length" color="blue-grey-lighten-1" size="x-small"
                                variant="text" class="text-white" @click="metricsMenuRef.switchMenu()">
                                <v-icon size="small">mdi-chart-box</v-icon>
                                <metricsMenu :metrics="metrics" ref="metricsMenuRef" />
                            </v-btn>

                            <v-btn :disabled="!allBasesKeys.length" color="blue-lighten-2" size="x-small" variant="text"
                                class="text-white mr-1" @click="copyBasesRepresentation">
                                <v-icon size="small">mdi-content-copy</v-icon>
                            </v-btn>
                        </div>
                    </div>
                    <div class="panel-content bases-content">
                        <!-- Список базисов -->
                        <div class="basis-list-container" :style="{ background: successColor }">
                            <div v-for="(basisKey, index) in allBasesKeys" :key="index" class="basis-item">
                                <div class="basis-formula">{{ `${allBases[basisKey].weight} ${(basisKey != '1' ? ` *
                                    ${basisKey}` : '')}` }}</div>

                                <v-spacer />
                                <div v-if="allBases[basisKey].impact">
                                    <span class="text-caption text-grey mr-2">вклад</span>
                                    <span class="basis-formula">{{ allBases[basisKey].impact }}</span>
                                </div>
                                <v-spacer />

                                <v-btn icon="mdi-close" density="compact" variant="text" color="red"
                                    @click="delete allBases[basisKey]" size="x-small"></v-btn>
                            </div>
                            <div v-if="!allBasesKeys.length" class="no-data-message">
                                <v-icon color="grey-lighten-1" size="large" class="mb-2">mdi-database-off</v-icon>
                                <div>Нет базисов</div>
                            </div>
                        </div>

                        <!-- Панель кнопок управления -->
                        <div class="bases-actions">
                            <v-btn color="green-darken-1" size="small" variant="flat" class="action-btn text-white"
                                :disabled="!file"
                                @click="makeApproximation">
                                <v-progress-circular v-if="aproximationLoading" indeterminate color="white" :size="16"
                                    :width="2" class="mr-1" />
                                <v-icon v-else size="small" class="mr-1">mdi-chart-bell-curve</v-icon>
                                <span>АППРОКСИМАЦИЯ</span>
                            </v-btn>

                            <v-btn color="amber-darken-1" size="small" variant="flat" class="action-btn text-white ml-2"
                                :disabled="!file" @click="getExtBases">
                                <v-progress-circular v-if="getBasesLoading" indeterminate color="white" :size="16"
                                    :width="2" class="mr-1" />
                                <v-icon v-else size="small" class="mr-1">mdi-database-plus</v-icon>
                                <span>РАСШ. БАЗИСЫ</span>
                            </v-btn>

                            <v-btn color="red-lighten-1" size="small" variant="flat" class="action-btn text-white ml-2"
                                :disabled="!file"
                                @click="clearBases">
                                <v-icon size="small" class="mr-1">mdi-delete</v-icon>
                                <span>ОЧИСТИТЬ</span>
                            </v-btn>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>
</template>

<script setup>
import { calculateR2, calculateAIC, calculateMSE, calculatePredicted } from '@/app_lib/metrics';

import { read, utils } from 'xlsx';
import { getApproximation } from '@/app_lib/index';
import { getExtendedBases, getBasisKey } from '@/app_lib/bases';
import predictMenu from './predictMenu.vue';
import metricsMenu from './metricsMenu.vue';
import functionMenu from './functionMenu.vue';
import icons from '@/assets/icons';

import { ref, reactive, toRefs } from 'vue';
import { computed, onMounted } from 'vue';

import { useAppStore } from '@/store/app';
const appStore = useAppStore();

import { useChartStore } from '@/store/chart';
const chartStore = useChartStore();

import { useSettingsStore } from '@/store/settings'
const settingsStore = useSettingsStore();


const predictMenuRef = ref(null);
const metricsMenuRef = ref(null);
const functionMenuRef = ref(null);

function updateFunctionList() {
    // Получаем пользовательские функции из localStorage
    const savedFunctions = localStorage.getItem('customFunctions');
    if (savedFunctions) {
        const customFunctions = JSON.parse(savedFunctions);
        
        // Обновляем список функций, добавляя пользовательские
        funcSettings.basisFunctions = [
            ...funcSettings.basisFunctions.filter(f => !f.id.toString().startsWith('custom_')),
            ...customFunctions.map(f => ({
                ...f,
                id: `custom_${f.id}` // Добавляем префикс, чтобы избежать конфликтов ID
            }))
        ];
    }
}


const numParams = reactive({
    constant: true,
    normSmallValues: true,
    multiplicationFactor: 1,
    L1: 1,
    L2: 1,
    stepPower: 1,

    degree: 1,
    depth: 1,
    depths: [
        { id: 0, val: 1 },
        { id: 1, val: 2 },
        { id: 2, val: 3 }
    ],
});



const customSettings = reactive({
    selectedVariable: '',
    defaultCustomBasis: {
        functions: [],
        powers: [],
        variables: [],
        weight: 1,
    },
    customBasis: {
        functions: [],
        powers: [],
        variables: [],
        weight: '',
    },
});
const funcSettings = reactive({
    basisFunctions: [
        { id: 0, val: 'ufSIN|return Math.sin(x)', label: 'TEST' },
        { id: 0.1, val: 'ufX|return x', label: 'TEST' },
        { id: 1, val: '', label: 'Идентичность' },
        { id: 2, val: 'sqrt', label: 'Квадратный корень' },
        { id: 3, val: 'sin', label: 'Синус' },
        { id: 4, val: 'cos', label: 'Косинус' },
        { id: 5, val: 'tan', label: 'Тангенс' },
        { id: 6, val: 'atan', label: 'Арктангенс' },
        { id: 7, val: 'asinh', label: 'Гиперболический арксинус' },
        { id: 8, val: 'acosh', label: 'Гиперболический арккосинус от модуля' },
        { id: 9, val: 'ln', label: 'Натуральный логарифм от модуля' },
        { id: 10, val: 'lg', label: 'Десятичный логарифм от модуля' },
        { id: 11, val: 'exp', label: 'Экспонента' },
        { id: 12, val: 'abs', label: 'Модуль' },
        { id: 13, val: 'sinh', label: 'Гиперболический синус' },
        { id: 14, val: 'cosh', label: 'Гиперболический косинус' },
        { id: 15, val: 'tanh', label: 'Гиперболический тангенс' },
        { id: 16, val: '(2x + 3)', label: '2x + 3' },
        { id: 17, val: 'frac', label: 'Дробная часть' },
        { id: 18, val: 'dirichlet_approx', label: 'Аппроксимация функции Дирихле' },
        { id: 19, val: 'sawtooth', label: 'Пилообразная функция' },
        { id: 20, val: 'square', label: 'Прямоугольная волна' },
        { id: 21, val: 'triangle', label: 'Треугольная волна' },
        { id: 22, val: 'meander', label: 'Функция меандра' },
        { id: 23, val: 'jacobi_sn_approx', label: 'Эллиптическая функция Якоби sn - обобщение синуса (sin(x)/(1+k⋅sin²(x)), k=0.5)' },
        { id: 24, val: 'jacobi_cn_approx', label: 'Эллиптическая функция Якоби cn - обобщение косинуса (cos(x)/(1+k⋅sin²(x)), k=0.5)' },
        { id: 25, val: 'jacobi_dn_approx', label: 'Эллиптическая функция Якоби dn - нормализованное выражение (1/(1+k⋅sin²(x)), k=0.5)' },
        { id: 26, val: 'fourier_example', label: 'Пример ряда Фурье - суммирование sin(nx)/n для n от 1 до 5' },
        { id: 27, val: 'periodic_spline_approx', label: 'Периодический сплайн - гладкая кусочно-полиномиальная функция (период 2π)' },
        { id: 28, val: 'weierstrass_approx', label: 'Функция Вейерштрасса - непрерывная недифференцируемая функция (Σa^n⋅cos(b^n⋅π⋅x), a=0.5, b=3)' },
        { id: 29, val: 'periodic_hat', label: 'Периодическая функция "шляпа" - треугольный импульс, повторяющийся с периодом 2π' },
        { id: 30, val: 'multi_harmonic', label: 'Мультигармоническая функция - сумма синусов (0.5sin(x)+0.3sin(2x)+0.1sin(3x))' },
        { id: 31, val: '1', label: 'Константа 1' }
    ],
    selectedFunction: '',
    selectedOutputFunction: '',
    outputDegree: 1
});
function addVariable() {
    const { customBasis } = toRefs(customSettings);

    customBasis.value.functions.push(funcSettings.selectedFunction);
    customBasis.value.powers.push(Number(numParams.degree));
    customBasis.value.variables.push(customSettings.selectedVariable);
    customBasis.value.weight = 1;
    customBasis.value.outputDegree = funcSettings.outputDegree;

    console.log('customSettings.customBasis_', customSettings.customBasis)
};
function addCustomBasis() {
    allBases.value[getBasisName(customSettings.customBasis)]
        = (
            {
                weight: 1,
                functions: customSettings.customBasis.functions,
                variables: customSettings.customBasis.variables,
                powers: customSettings.customBasis.powers,
                outputFunc: funcSettings.selectedOutputFunction,
                outputDegree: funcSettings.outputDegree,
            }
        );

    console.log('allBases', allBases.value)
};
function clearCustomBasis() {
    customSettings.customBasis = structuredClone(customSettings.defaultCustomBasis);
};
function addOutputFunc() {
    if (funcSettings.selectedOutputFunction) {
        customSettings.customBasis.outputFunc = funcSettings.selectedOutputFunction;
    } else if (customSettings.customBasis.outputFunc)
        delete customSettings.customBasis.outputFunc;

};



const extendedBases = ref(new Set(['3ln^4', '3^6', '3cos^4', '3tanh^3', '3^3/cos^-1', '1', '2^2/sin', '3sin^3', '2sin^2']));
function addExtendedBasis() {
    if (funcSettings.outputDegree) {
        extendedBases.value.add(
            `${numParams.depth}${funcSettings.selectedFunction}^${numParams.degree}/${funcSettings.selectedOutputFunction}^${funcSettings.outputDegree}`);
    }

};
function getExtendedBasisName(basis) {
    const funcs = basis.split('/');

    const rows1 = funcs[0].split('^');

    const depth1 = rows1.length > 0 ? `${rows1[0][0]}` : '1';
    const degree1 = rows1.length > 1 ? `${rows1[1]}` : '';
    const func1 = rows1[0].substring(1);


    let name = `x`;
    if (func1) name = `${func1}(x)`;
    if (degree1 && degree1 != 1) name = `${name}^${degree1}`;


    if (funcs[1]) {

        const rows2 = funcs[1].split('^');
        if (rows2[0]) {
            const func2 = rows2[0];
            name = `${func2}(${name})`
        }

        if (rows2[1] && rows2[1] != 1) {
            if (!rows2[0]) name = `(${name})`;
            name = `${name}^${rows2[1]}`
        }
    }

    name = `${name} - глубина ${depth1}`

    return name;
};

onMounted(() => {
    const extendedBasesFromLS = JSON.parse(localStorage.getItem('extendedBases'));
    if (extendedBasesFromLS && extendedBasesFromLS.length)
        extendedBases.value = new Set(extendedBasesFromLS);

    updateFunctionList();
});

function rememberExtendedBases() {
    localStorage.setItem('extendedBases', JSON.stringify(Array.from(extendedBases.value)));
}



const dataInfo = ref({
    data: [],
    fields: [],
});


const allBases = ref({});

const minImpact = ref(0);
const variableImpact = ref('all');

const allBasesKeys = computed(() => {
    return Object.keys(allBases.value);
});
const allBasesArr = computed(() => {
    return Object.values(allBases.value);
});

function filterBasesByImapct() {
    const keys = Object.keys(allBases.value);
    if (allBases.value[keys[0]]?.impact) {
        for (const key of keys) {
            if (variableImpact.value != 'all' && !allBases.value[key].variables.includes(variableImpact.value)) continue;

            if (Math.abs(allBases.value[key].impact) < Math.abs(minImpact.value)) {
                delete allBases.value[key];
            }
        }
    }
}





const getBasesLoading = ref(false);
async function getExtBases() {
    getBasesLoading.value = true;
    try {
        if (Object.keys(allBases.value).length) {
            filterBases();
        }

        if (dataInfo.value.data.length > 0) {
            const options = {
                extendedBases: Array.from(extendedBases.value),
                allBases: allBases.value,
                constant: settingsStore.numParams.constant,
                stepPower: settingsStore.numParams.stepPower,
                keys: dataInfo.value.fields,
            }

            allBases.value = { ...getExtendedBases(options) };
        } else {
            appStore.showEvent({
                text: 'Данные отсутствуют.',
                color: 'warning'
            });
        }
    } catch (error) {
        console.error(error)
    } finally {
        getBasesLoading.value = false;
        console.log('basis_123', allBases.value)
    }
};
function filterBases() {
    const fields = dataInfo.value.fields.slice(1);
    for (let key of Object.keys(allBases.value)) {
        for (let variable of allBases.value[key].variables) {
            if (!fields.includes(variable)) {
                delete allBases.value[key];
                break;
            }
        }
    }
    console.log('exit')
};
function getBasisName(basis) {
    return getBasisKey(basis);
};
async function copyBasesRepresentation() {
    let res = '';
    for (let key in allBases.value) {
        let weight = allBases.value[key].weight.toString();
        const sign = weight[0] == '-' ? '-' : '+';
        weight = sign === '+' ? weight : weight.substring(1);

        res += `${sign} ${weight}${(key != '1' ? ` * ${key}` : '')}\n`
    }

    await navigator.clipboard.writeText(res.slice(0, -1));
};
function clearBases() {
    allBases.value = {};
    result.value = null;
}



const result = ref(null);
const successColor = computed(() => {
    if (result.value == null) return '';
    return result.value.success ? '#00ff0010' : '#ff000010';
});
const metrics = ref({
    R2: '',
    AIC: '',
    MSE: '',
});


function calculateMetrics() {
    const data = dataInfo.value.data;

    const predicted = calculatePredicted(data, allBases.value);
    metrics.value = {
        R2: calculateR2(data, allBases.value, result.value.success, predicted),
        AIC: calculateAIC(data, allBases.value, result.value.success, predicted),
        MSE: calculateMSE(data, allBases.value, result.value.success, predicted),
    };
}



const aproximationLoading = ref(false);
async function makeApproximation() {
    try {
        aproximationLoading.value = true;

        const options = {
            data: dataInfo.value.data,
            allBases: allBases.value,
            L1: settingsStore.numParams.L1,
            L2: settingsStore.numParams.L2,
            normSmallValues: settingsStore.numParams.normSmallValues,
            multiplicationFactor: settingsStore.numParams.multiplicationFactor
        }

        result.value = await getApproximation(options);

        console.log('result.value', result.value)

        // allBases.value = result.value.approximatedBases;

    } catch (error) {
        console.log(error)
    } finally {
        aproximationLoading.value = false;
    }
};
const setChartDataLoading = ref(false);
async function setChartData() {
    try {
        setChartDataLoading.value = true;

        const { data, fields } = dataInfo.value;
        const [yField, xField] = fields;

        console.log('fields', fields, xField)

        const approximated = calculatePredicted(data, allBases.value, false);
        const approximatedKey = `${yField} (approximated)`;
        const diffKey = `${yField} (difference)`;

        data.forEach((row, i) => {
            row[approximatedKey] = approximated[i];
            row[diffKey] = row[yField] - approximated[i];
        });

        data.sort((a, b) => a[xField] - b[xField]);


        const payload = {
            chartData: data,
            xKey: xField,
            xKeys: fields.slice(1, fields.length),
            yKeys: [yField, approximatedKey, diffKey],
            newData: true
        }

        chartStore.setChartData(payload);

    } catch (error) {
        console.log(error)
    } finally {
        setChartDataLoading.value = false;
    }

};



const file = ref(null);
async function fileUpload(event) {
    const docFile = event.target.files[0];
    if (docFile && docFile.name.endsWith('.xlsx')) {
        file.value = docFile;
        dataInfo.value.data = await readExcelFile(file.value);
        dataInfo.value.fields = Object.keys(dataInfo.value.data[0]);
        customSettings.selectedVariable = dataInfo.value.fields[1];
    } else {

        appStore.showEvent({
            text: 'Пожалуйста, выберите файл формата .xlsx',
            color: 'error'
        });
    }
    event.target.value = '';
};
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const workbook = read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = utils.sheet_to_json(worksheet);

                console.log('Прочитанные данные:', jsonData);
                console.log('Структура первой строки:', Object.keys(jsonData[0]));
                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };

        reader.readAsArrayBuffer(file);
    });
};


</script>


<style scoped>
.app-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f8fafc;
    overflow: hidden;
}

.app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background: linear-gradient(to right, #f5f7fa, #e1e5ea);
    border-bottom: 1px solid #dde3ec;
    height: 56px;
    flex-shrink: 0;
    /* Предотвратит сжатие при нехватке места */
}

.app-title {
    display: flex;
    align-items: center;
}

.action-buttons {
    display: flex;
    align-items: center;
}

.file-loaded {
    background-color: rgba(56, 142, 60, 0.8) !important;
    /* Темно-зеленый для подтверждения загрузки */
}

.app-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    height: calc(100% - 56px);
}

/* Панель конфигурации вверху */
.configuration-panel {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e6ed;
    margin: 8px;
    padding: 8px;
    display: flex;
    gap: 12px;
    flex-shrink: 0;
    /* Предотвратит сжатие при нехватке места */
}

.config-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    /* Позволяет flex-контейнеру сжиматься */
}

.action-section {
    display: flex;
    align-items: center;
    min-width: 0;
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

.config-controls {
    display: flex;
    gap: 8px;
    /* flex-grow: 1; */
}

/* Основные панели */
.panels-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
}

.panels-row {
    display: flex;
    height: 40%;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
}

.panel {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid #e0e6ed;
    overflow: hidden;
    margin: 0 8px 8px 8px;
    flex: 1;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
}

.adding-basis {
    max-width: 38.2%;
}

.extended-bases {
    flex: 1;
}

.bases-panel {
    flex: 1;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
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
    flex-shrink: 0;
    /* Предотвратит сжатие при нехватке места */
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

.panel-actions {
    display: flex;
    margin-left: auto;
    /* Убедимся, что действия всегда справа */
}

.panel-content {
    padding: 0.75rem;
    overflow-y: auto;
    overflow-x: hidden;
    /* Предотвращает горизонтальный скролл */
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
}

.bases-content {
    display: flex;
    flex-direction: column;
}

.control-group {
    display: flex;
    flex-direction: column;
}

.basis-function,
.output-function,
.variable {
    flex: 1;
}

.degree,
.output-degree,
.depth {
    width: 70px;
}

.control-label {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 4px;
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    width: 100%;
}

.action-btn {
    flex: 1;
    white-space: nowrap;
    letter-spacing: 0.5px;
    height: 32px;
    font-size: 11px;
    font-weight: 500;
}

.basis-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    overflow-x: hidden;
    /* Предотвращает горизонтальный скролл */
    height: 100%;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
}

.basis-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: #f2f7fc;
    border: 1px solid #e2ecf7;
    border-radius: 6px;
    transition: all 0.2s;
    width: 100%;
    /* Фиксированная ширина */
    box-sizing: border-box;
    /* Учитывает padding в размере */
}

.basis-item:hover {
    background-color: #e6f1fa;
    transform: translateX(2px);
    /* Сдвиг вместо роста, который может вызвать скролл */
}

.basis-formula {
    font-family: 'Roboto Mono', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    /* Занимает доступное пространство */
    margin-right: 8px;
    /* Отступ от кнопки удаления */
}

.basis-preview {
    flex: 1;
    font-family: 'Roboto Mono', monospace;
    padding: 0.75rem;
    background-color: #f0f7ff;
    border-radius: 8px;
    border: 1px solid #d1e3fa;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    /* Предотвращает горизонтальный скролл */
    word-break: break-word;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
}

.basis-list-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-y: auto;
    overflow-x: hidden;
    /* Предотвращает горизонтальный скролл */
    flex: 1;
    padding: 0.5rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e0e6ed;
    margin-bottom: 0.75rem;
    min-height: 0;
    /* Важно для работы flex и overflow в Firefox */
}

.success-highlight {
    background-color: #f0fff5 !important;
    border-color: #d1fadf !important;
}

.bases-actions {
    display: flex;
    margin-top: auto;
    flex-shrink: 0;
    /* Предотвратит сжатие при нехватке места */
}

.no-data-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
    padding: 1rem;
    height: 100%;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px dashed #d0d7de;
}



.action-section {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 0.75rem;
    background-color: #f9fafc;
    border-radius: 6px;
    border: 1px solid #e8edf4;
}

.action-section-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
}

.top-actions {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    width: 100%;
}

.bottom-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    width: 100%;
}

.action-main-btn {
    padding: 0 12px !important;
    height: 36px !important;
    flex: 1;
    white-space: nowrap;
    letter-spacing: 0.5px;
    font-weight: 500;
    font-size: 0.8rem;
}

.action-btn {
    flex: 1;
    white-space: nowrap;
    letter-spacing: 0.5px;
    height: 32px;
    font-size: 11px;
    font-weight: 500;
}

/* Адаптивность для маленьких экранов */
@media (max-width: 960px) {
    .configuration-panel {
        flex-direction: column;
        gap: 8px;
    }

    .panels-row {
        flex-direction: column;
        height: auto;
    }

    .extended-bases {
        width: auto;
        margin-bottom: 8px;
    }

    .action-buttons {
        flex-wrap: wrap;
    }
}
</style>