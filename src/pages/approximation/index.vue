<template>
    <div class="h-100 ">
        <input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="fileUpload" style="display: none" ref="fileInput" />

        <div class="ef px-4 w-100" style="background: #d3e3e1;">
            <v-btn @click="$refs.predictMenu.switchMenu()" class="def_btn">
                <KeyIcon :color="'#000'" />
                <predictMenu :allBases="allBases" :dataInfo="dataInfo" ref="predictMenu" />
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

        <div class="w-100 pa-5">
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
                                    <v-btn :disabled="!file" :hide-details="true" elevation="0" class="mb-2" @click="addExtendedBasis">
                                        Расш. базис
                                    </v-btn>
                                </v-col>

                            </v-row>

                            <v-row class="d-flex align-center">

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!customSettings.customBasis.functions.length" :hide-details="true" elevation="0" @click="addOutputFunc">
                                        Вых. функция
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!file" :hide-details="true" elevation="0" @click="addVariable">
                                        Добавить
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!customSettings.customBasis.functions.length" :hide-details="true" elevation="0" @click="addCustomBasis">
                                        Базис
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-center" cols="3">
                                    <v-btn :disabled="!file" :hide-details="true" elevation="0" @click="clearCustomBasis">
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
                        <v-card-text class="pb-0">
                            <v-row>
                                <v-col>
                                    <v-list class="overflow-y-auto" style="max-height: 20vh"  density="compact">
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
                            <v-row class="h-100 w-100 pa-0 ma-0">
                                <v-col class="pa-0 ma-0 overflow-y-auto" style="max-height: 25vh;">


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
                                    <v-list style="height: 20vh;" density="compact"
                                        :style="{ background: successColor }">
                                        <v-list-item v-for="(basisKey, index) in Object.keys(allBases) " :key="index"
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

                                    <v-btn @click="$refs.metricsMenu.switchMenu()" elevation="0"
                                        class="d-flex justify-center align-center mx-2 px-0">
                                        <DocumentIcon :color="`#000`" />
                                        <metricsMenu :metrics="metrics" ref="metricsMenu" />
                                    </v-btn>
                                </v-col>

                                <v-col class="d-flex justify-end">
                                    <v-btn elevation="0" @click="makeApproximation"
                                        class="d-flex justify-center align-center mx-2 px-0">
                                        <div v-if="aproximationLoading" class="mr-2">
                                            <v-progress-circular indeterminate color="#00ff00aa" :size="22" :width="4" />
                                        </div>
                                        <div>
                                            Аппроксимировать
                                        </div>
                                    </v-btn>

                                    <v-btn :disabled="!file" elevation="0" class="mx-2 px-0" @click="getExtendedBases">
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

<script>
import { read, utils } from 'xlsx';
import { getApproximation } from '@/app_lib/index';
import { getExtendedBases, getBasisKey } from '@/app_lib/bases';
import { calculatePredicted } from '@/app_lib/metrics';
import predictMenu from './predictMenu.vue';
import metricsMenu from './metricsMenu.vue';


import { defineAsyncComponent } from 'vue'
import icons from '@/assets/icons';

const asyncIcons = Object.entries(icons).reduce((acc, [key, value]) => {
    acc[key] = defineAsyncComponent(value)
    return acc
}, {})

export default {
    components: {
        ...asyncIcons,
        predictMenu,
        metricsMenu,
    },
    data() {
        return {
            file: null,

            aproximationLoading: false,
            getBasesLoading: false,
            setChartDataLoading: false,

            dataInfo: {
                data: [
                    { z: 1, y: 1, x: 2, t: 2 },
                    { z: 4, y: 2, x: 5, t: 2 },
                    { z: 9, y: 3, x: 2, t: 2 },
                    { z: 16, y: 4, x: 9, t: 2 },
                    { z: 25, y: 5, x: 4, t: 2 },
                    { z: 36, y: 6, x: 42, t: 2 },
                    { z: 49, y: 7, x: 5, t: 2 },
                    { z: 64, y: 8, x: 1, t: 2 },
                    { z: 81, y: 9, x: 9, t: 2 },
                    { z: 100, y: 10, x: 2, t: 2 }
                ],
                fields: ['z', 'y', 'x'],
            },

            numParams: {
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
            },

            funcSettings: {
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
            },

            customSettings: {
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
            },

            extendedBases: ['3ln^4', '3^6', '3cos^4', '3tanh^3', '3^3/cos^-1', '1', '2^2/sin', '3sin^3', '2sin^2'],
            allBases: {},

            metrics: {
                R2: '',
                AIC: '',
                MSE: '',
            },

            result: null,
        }
    },
    computed: {
        storeNumParams() {
            return this.$store.state.settings.storeNumParams;
        },
        successColor() {
            if (this.result == null) return '';
            return this.result.success ? '#00ff0010' : '#ff000010';
        }
    },
    mounted() {
    },
    methods: {
        async makeApproximation() {

            try {
                this.aproximationLoading = true;

                const options = {
                    data: this.dataInfo.data,
                    allBases: this.allBases,
                    L1: this.storeNumParams.L1,
                    L2: this.storeNumParams.L2,
                    normSmallValues: this.storeNumParams.normSmallValues,
                    multiplicationFactor: this.storeNumParams.multiplicationFactor
                }

                this.result = await getApproximation(options);
                this.metrics = this.result.metrics;
                this.allBases = this.result.approximatedBases;

            } catch (error) {
                console.log(error)
            } finally {
                this.aproximationLoading = false;
            }


        },
        addExtendedBasis() {
            if (this.funcSettings.outputDegree) {
                this.extendedBases.push(
                    `${this.numParams.depth}${this.funcSettings.selectedFunction}^${this.numParams.degree}/${this.funcSettings.selectedOutputFunction}^${this.funcSettings.outputDegree}`)
            }

        },
        filterBases() {
            const fields = this.dataInfo.fields.slice(1);
            for (let key of Object.keys(this.allBases)) {
                for (let variable of this.allBases[key].variables) {
                    if (!fields.includes(variable)) {
                        delete this.allBases[key];
                        break;
                    }
                }
            }
        },
        async getExtendedBases() {
            this.getBasesLoading = true;
            try {

                if (Object.keys(this.allBases).length) {
                    this.filterBases();
                }

                if (this.dataInfo.data.length > 0) {
                    const options = {
                        extendedBases: this.extendedBases,
                        allBases: this.allBases,
                        constant: this.storeNumParams.constant,
                        stepPower: this.storeNumParams.stepPower,
                        keys: this.dataInfo.fields,
                    }

                    this.allBases = { ...getExtendedBases(options) };
                    console.log('this.basis_', this.allBases)
                } else {
                    this.$store.dispatch('notify', {
                        text: 'Данные отсутствуют.',
                        color: 'warning'
                    });
                }
            } catch (error) {

            } finally {
                this.getBasesLoading = false;
            }
        },
        getExtendedBasisName(basis) {
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
        },
        addCustomBasis() {

            this.allBases[this.getBasisName(this.customSettings.customBasis)]
                = (
                    {
                        weight: 1,
                        functions: this.customSettings.customBasis.functions,
                        variables: this.customSettings.customBasis.variables,
                        powers: this.customSettings.customBasis.powers,
                        outputFunc: this.funcSettings.selectedOutputFunction,
                        outputDegree: this.funcSettings.outputDegree,
                    }
                );

            console.log('this.allBases', this.allBases)
        },
        getBasisName(basis) {
            return getBasisKey(basis);
        },
        addVariable() {
            this.customSettings.customBasis.functions.push(this.funcSettings.selectedFunction);
            this.customSettings.customBasis.powers.push(Number(this.numParams.degree));
            this.customSettings.customBasis.variables.push(this.customSettings.selectedVariable);
            this.customSettings.customBasis.weight = 1;
            this.customSettings.customBasis.outputDegree = this.funcSettings.outputDegree;

            console.log('this.customSettings.customBasis_', this.customSettings.customBasis)
        },
        addOutputFunc() {
            if (this.funcSettings.selectedOutputFunction) {
                this.customSettings.customBasis.outputFunc = this.funcSettings.selectedOutputFunction;
            } else if (this.customSettings.customBasis.outputFunc)
                delete this.customSettings.customBasis.outputFunc;

        },
        addOutputDegree() {
            if (this.funcSettings.outputDegree) {
                this.customSettings.customBasis.outputDegree = this.funcSettings.outputDegree;
            }
        },
        clearCustomBasis() {
            this.customSettings.customBasis = structuredClone(this.customSettings.defaultCustomBasis);
        },
        async fileUpload(event) {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.xlsx')) {
                this.file = file;
                this.dataInfo.data = await this.readExcelFile(file);
                this.dataInfo.fields = Object.keys(this.dataInfo.data[0]);
                this.customSettings.selectedVariable = this.dataInfo.fields[1];
            } else {
                this.$store.dispatch('notify', {
                    text: 'Пожалуйста, выберите файл формата .xlsx',
                    color: 'error'
                });
            }
            event.target.value = '';
        },
        async readExcelFile(file) {
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
        },
        async copyBasesRepresentation() {
            let result = '';
            for (let key in this.allBases) {
                let weight = this.allBases[key].weight.toString();
                const sign = weight[0] == '-' ? '-' : '+';
                weight = sign === '+' ? weight : weight.substring(1);

                result += `${sign} ${weight}${(key != '1' ? ` * ${key}` : '')}\n`
            }

            await navigator.clipboard.writeText(result.slice(0, -1));
        },
        async setChartData() {
            try {
                this.setChartDataLoading = true;

                const { data, fields } = this.dataInfo;
                const [yField, xField] = fields;

                const approximated = calculatePredicted(data, this.allBases);
                const approximatedKey = `${yField} (approximated)`;
                const diffKey = `${yField} (difference)`;

                data.forEach((row, i) => {
                    row[approximatedKey] = approximated[i];
                    row[diffKey] = row[yField] - approximated[i];
                });

                data.sort((a, b) => a[xField] - b[xField]);


                Object.assign(this.$store.state.chart, {
                    chartData: data,
                    xKey: xField,
                    yKeys: [yField, approximatedKey, diffKey]
                });
            } catch (error) {
                console.log(error)
            } finally {
                this.setChartDataLoading = false;
            }

        },
        clearBases() {
            this.allBases = {};
            this.result = null;
        }
    },
}
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