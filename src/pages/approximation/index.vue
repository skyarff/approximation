<template>
    <div class="h-100 ">
        <input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="fileUpload" style="display: none" ref="fileInput" />

        <div class="ef px-4 w-100" style="background: #d3e3e1;">
            <v-btn @click="predictMenuRef.switchMenu()" class="def_btn">
                <component :is="icons.KeyIcon" :color="'#000'" />
                <predictMenu :allBases="allBases" :dataInfo="dataInfo" ref="predictMenuRef" />
            </v-btn>
            <v-btn class="def_btn" @click="setChartData">
                <div>
                    УСТАНОВИТЬ ДАННЫЕ
                </div>
                <div v-if="setChartDataLoading" class="ml-2">
                    <v-progress-circular indeterminate color="red" :size="22" :width="4" />
                </div>
            </v-btn>
            <v-btn :style="{ color: file ? 'green' : '' }" class="def_btn" @click="$refs.fileInput.click()">
                ЗАГРУЗИТЬ ДАННЫЕ
            </v-btn>
        </div>

        <div class="w-100 pa-5 pb-1">
            <v-row>
                <v-col cols="4">
                    <v-card class="h-100">
                        <v-card-title>
                            <span style="font-size: 17px;">
                                Управление базисами
                            </span>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col class="d-flex justify-center">
                                    <v-autocomplete :hide-details="true" variant="outlined" title="Функция участник"
                                        v-model="funcSettings.selectedFunction" :items="funcSettings.basisFunctions"
                                        :item-title="item => `${item.val} (${item.label})`" item-value="val"
                                        label="Выберите функцию"></v-autocomplete>
                                </v-col class="d-flex justify-center">
                                <v-col>
                                    <v-text-field :hide-details="true" variant="outlined" title="Степень базиса"
                                        type="number" v-model="numParams.degree" label="Степень"></v-text-field>
                                </v-col>
                                <v-col class="d-flex justify-center">
                                    <v-select :hide-details="true" variant="outlined" v-model="numParams.depth"
                                        :items="numParams.depths" item-title="val" item-value="val"
                                        label="Глубина"></v-select>
                                </v-col>
                            </v-row>

                            <v-row class="d-flex align-center">
                                <v-col class="d-flex justify-center" cols="3">
                                    <v-autocomplete :hide-details="true" variant="outlined" title="Выходная функция"
                                        v-model="funcSettings.selectedOutputFunction"
                                        :items="funcSettings.basisFunctions"
                                        :item-title="item => `${item.val} (${item.label})`" item-value="val"
                                        label="Выберите выходную функцию"></v-autocomplete>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-text-field :hide-details="true" variant="outlined" title="Выходная степень"
                                        type="number" label="Выходная степень" v-model="funcSettings.outputDegree" />
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-select :hide-details="true" variant="outlined"
                                        :disabled="!customSettings.selectedVariable"
                                        v-model="customSettings.selectedVariable" :items="dataInfo.fields.slice(1)"
                                        item-title="field" item-value="field" label="Переменная"></v-select>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!file" :hide-details="true" elevation="0" class="mb-2"
                                        @click="addExtendedBasis">
                                        Расш. базис
                                    </v-btn>
                                </v-col>

                            </v-row>

                            <v-row class="d-flex align-center">

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!customSettings.customBasis.functions.length" :hide-details="true"
                                        elevation="0" @click="addOutputFunc">
                                        Вых. функция
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!file" :hide-details="true" elevation="0" @click="addVariable">
                                        Добавить
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!customSettings.customBasis.functions.length" :hide-details="true"
                                        elevation="0" @click="addCustomBasis">
                                        Базис
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!file" :hide-details="true" elevation="0"
                                        @click="clearCustomBasis">
                                        Обнулить
                                    </v-btn>
                                </v-col>



                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="8" class="pl-0">
                    <v-card class="h-100">
                        <v-card-title>
                            <span style="font-size: 17px;">
                                Расширенные базисы
                            </span>
                        </v-card-title>
                        <v-card-text>
                            <v-row>
                                <v-col>
                                    <v-list class="overflow-y-auto" style="height: calc(40vh - 100px)"
                                        density="compact">
                                        <v-list-item v-for="(basis, index) in extendedBases" :key="index"
                                            :title="getExtendedBasisName(basis)">
                                            <template v-slot:append>
                                                <v-btn elevation="0" icon="mdi-close" density="compact" variant="text"
                                                    @click="extendedBases.splice(index, 1)"></v-btn>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-col>


            </v-row>

            <v-row class="pt-0 mt-0">
                <v-col cols="4">
                    <v-card class="h-100">
                        <v-card-title>
                            <span style="font-size: 17px;">
                                Добавляемый базис
                            </span>
                        </v-card-title>
                        <v-card-text>
                            <v-row class="w-100 pa-0 ma-0">
                                <v-col class="pa-0 ma-0 overflow-y-auto">

                                    <div class="pt-2">
                                        {{ getBasisName(customSettings.customBasis) }}
                                    </div>

                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-col>


                <v-col cols="8" class="pl-0">
                    <v-card class="h-100">
                        <v-card-title>
                            <span style="font-size: 17px;">
                                Базисы
                            </span>
                        </v-card-title>
                        <v-card-text>
                            <v-row class="h-100 w-100 pa-0 ma-0">
                                <v-col class="pb-0">
                                    <v-list style="height: calc(60vh - 225px);" density="compact"
                                        :style="{ background: successColor }">
                                        <v-list-item v-for="(basisKey, index) in Object.keys(allBases)" :key="index"
                                            :title="`${allBases[basisKey].weight} ${(basisKey != '1' ? ` * ${basisKey}` : '')}`">
                                            <template v-slot:append>
                                                <v-btn elevation="0" icon="mdi-close" density="compact" variant="text"
                                                    @click="delete allBases[basisKey]"></v-btn>
                                            </template>
                                        </v-list-item>
                                    </v-list>
                                </v-col>
                            </v-row>
                            <v-row class="mt-0">
                                <v-col class="d-flex justify-start">
                                    <v-btn elevation="0" @click="copyBasesRepresentation">
                                        Скопировать
                                    </v-btn>

                                    <v-btn @click="metricsMenuRef.switchMenu()" elevation="0"
                                        class="d-flex justify-center align-center mx-2 px-0">
                                        <component :is="icons.DocumentIcon" :color="'#000'" />
                                        <metricsMenu :metrics="metrics" ref="metricsMenuRef" />
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-end">
                                    <v-btn elevation="0" @click="makeApproximation"
                                        class="d-flex justify-center align-center mx-2 px-0">
                                        <div v-if="aproximationLoading" class="mr-2">
                                            <v-progress-circular indeterminate color="#00ff00aa" :size="22"
                                                :width="4" />
                                        </div>
                                        <div>
                                            Аппр.
                                        </div>
                                    </v-btn>

                                    <v-btn :disabled="!file" elevation="0" class="mx-2 px-0" @click="getExtBases">
                                        <div>
                                            Получить расширенные базисы
                                        </div>
                                        <div v-if="getBasesLoading" class="ml-2">
                                            <v-progress-circular indeterminate color="red" :size="22" :width="4" />
                                        </div>
                                    </v-btn>

                                    <v-btn class="mx-2 px-0" elevation="0" @click="clearBases">
                                        Очистить базисы
                                    </v-btn>
                                </v-col>
                            </v-row>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </div>
    </div>
</template>

<script setup>
import { read, utils } from 'xlsx';
import { getApproximation } from '@/app_lib/index';
import { getExtendedBases, getBasisKey } from '@/app_lib/bases';
import { calculatePredicted } from '@/app_lib/metrics';
import predictMenu from './predictMenu.vue';
import metricsMenu from './metricsMenu.vue';
import icons from '@/assets/icons';

import { useStore } from 'vuex';
import { ref, reactive, toRefs } from 'vue';
import { computed } from 'vue';



const store = useStore();
const predictMenuRef = ref(null);
const metricsMenuRef = ref(null);



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
        { id: 15, val: 'tanh', label: 'Гиперболический тангенс' }
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



const extendedBases = ref(['3ln^4', '3^6', '3cos^4', '3tanh^3', '3^3/cos^-1', '1', '2^2/sin', '3sin^3', '2sin^2']);

function addExtendedBasis() {
    if (funcSettings.outputDegree) {
        extendedBases.value.push(
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



const storeNumParams = computed(() => store.state.settings.storeNumParams);

const dataInfo = reactive({
    data: [],
    fields: [],
});



const allBases = ref({});

const getBasesLoading = ref(false);

async function getExtBases() {
    getBasesLoading.value = true;
    try {
        if (Object.keys(allBases.value).length) {
            filterBases();
        }

        if (dataInfo.data.length > 0) {
            const options = {
                extendedBases: extendedBases.value,
                allBases: allBases.value,
                constant: storeNumParams.value.constant,
                stepPower: storeNumParams.value.stepPower,
                keys: dataInfo.fields,
            }

            allBases.value = { ...getExtendedBases(options) };
        } else {
            store.dispatch('notify', {
                text: 'Данные отсутствуют.',
                color: 'warning'
            });
        }
    } catch (error) {

    } finally {
        getBasesLoading.value = false;
        console.log('basis_123', allBases.value)
    }
};

function filterBases() {
    const fields = dataInfo.fields.slice(1);
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

const aproximationLoading = ref(false);

async function makeApproximation() {
    try {
        aproximationLoading.value = true;

        const options = {
            data: dataInfo.data,
            allBases: allBases.value,
            L1: storeNumParams.value.L1,
            L2: storeNumParams.value.L2,
            normSmallValues: storeNumParams.value.normSmallValues,
            multiplicationFactor: storeNumParams.value.multiplicationFactor
        }


        result.value = await getApproximation(options);

        metrics.value = result.value.metrics;
        allBases.value = result.value.approximatedBases;

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

        const { data, fields } = dataInfo;
        const [yField, xField] = fields;

        const approximated = calculatePredicted(data, allBases.value);
        const approximatedKey = `${yField} (approximated)`;
        const diffKey = `${yField} (difference)`;

        data.forEach((row, i) => {
            row[approximatedKey] = approximated[i];
            row[diffKey] = row[yField] - approximated[i];
        });

        data.sort((a, b) => a[xField] - b[xField]);


        Object.assign(store.state.chart, {
            chartData: data,
            xKey: xField,
            yKeys: [yField, approximatedKey, diffKey]
        });
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
        dataInfo.data = await readExcelFile(file.value);
        dataInfo.fields = Object.keys(dataInfo.data[0]);
        customSettings.selectedVariable = dataInfo.fields[1];
    } else {
        store.dispatch('notify', {
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
.num_grid {
    width: fit-content;
    height: 100%;
    position: relative;
}

.num_btn {
    padding: 0;
    height: 64px !important;
    width: 64px !important;

}

.add_div {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    bottom: 0;
    left: auto;
    right: auto;
}

.truncate {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>