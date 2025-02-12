<template>
    <div>
        <input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="fileUpload" style="display: none" ref="fileInput" />

        <div class="ef px-4 w-100" style="background: #d3e3e1;">
            <v-btn class="def_btn" @click="setChartData">
                УСТАНОВИТЬ ДАННЫЕ
            </v-btn>
            <v-btn :style="{ color: file ? 'green' : '' }" class="def_btn" @click="$refs.fileInput.click()">
                ЗАГРУЗИТЬ ДАННЫЕ
            </v-btn>
        </div>


        <div class="w-100 pa-2">
     

            <v-row>
                <v-col class="d-flex flex-row" cols="6">
                    <v-col cols="3">
                        <v-autocomplete title="Функция участник" v-model="funcSettings.selectedFunction"
                            :items="funcSettings.basisFunctions" :item-title="item => `${item.val} (${item.label})`"
                            item-value="val" label="Выберите функцию"></v-autocomplete>

                        <v-autocomplete title="Выходная функция" v-model="funcSettings.selectedOutputFunction"
                            :items="funcSettings.basisFunctions" :item-title="item => `${item.val} (${item.label})`"
                            item-value="val" label="Выберите выходную функцию"></v-autocomplete>

                        <v-text-field title="Выходная степень" type="number" label="outputDegree"
                            v-model="funcSettings.outputDegree" />
                    </v-col>

                    <v-col cols="2">
                        <v-text-field title="Степень базиса" type="number" v-model="numParams.degree"
                            label="Степень"></v-text-field>
                    </v-col>
                    <v-col cols="2">
                        <v-select v-model="numParams.depth" :items="numParams.depths" item-title="val" item-value="val"
                            label="Глубина"></v-select>
                    </v-col>
                    <v-col cols="2">
                        <v-select :disabled="!customSettings.selectedVariable" v-model="customSettings.selectedVariable"
                            :items="dataInfo.fields.slice(1)" item-title="field" item-value="field"
                            label="Переменная"></v-select>
                    </v-col>
                    <v-col cols="3">
                        <v-btn class="mb-2" @click="addExtendedBasis">
                            Расш. базис
                        </v-btn>
                    </v-col>
                </v-col>

                <v-col class="d-flex flex-row" cols="6">
                    <v-col cols="4">

                        <div style="width: 500px; background: #0000AA44;">
                            Добавляемая переменная
                        </div>
                        <div style="height: 100px; width: 500px; background: #ff000044;">
                            {{ getBasisName(customSettings.customBasis) }}
                        </div>


                        <v-btn @click="addVariable">
                            Добавить переменную
                        </v-btn>

                        <v-btn @click="addOutputFunc">
                            Добавить выходную функцию
                        </v-btn>


                        <v-btn @click="addCustomBasis">
                            Добавить базис
                        </v-btn>

                        <v-btn @click="clearCustomBasis">
                            Обнулить базис
                        </v-btn>
                    </v-col>
                </v-col>
            </v-row>


            <v-row>
                <v-col cols="4">
                    <v-list density="compact" style="height: 200px;">
                        <v-list-item v-for="(basis, index) in extendedBases" :key="index"
                            :title="getExtendedBasisName(basis)">
                            <template v-slot:append>
                                <v-btn icon="mdi-close" density="compact" variant="text"
                                    @click="extendedBases.splice(index, 1)"></v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-col>

                <div style="display: flex; height: fit-content; width: 40%; background: #CC0000CC;">
                    <v-col cols="9">
                        <v-list density="compact" style="height: 200px;">
                            <v-list-item v-for="(basisKey, index) in Object.keys(allBases) " :key="index"
                                :title="`${allBases[basisKey].weight} ${(basisKey != '1' ? ` * ${basisKey}` : '')}`">
                                <template v-slot:append>
                                    <v-btn icon="mdi-close" density="compact" variant="text"
                                        @click="delete allBases[basisKey]"></v-btn>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-col>
                    <v-col cols="3">
                        <v-btn @click="copyBasesRepresentation">
                            Скопировать
                        </v-btn>
                    </v-col>
                </div>

            </v-row>

            <v-row>
                <v-btn @click="makeApproximation" class="d-flex justify-center align-center">
                    <div>
                        Аппроксимировать
                    </div>
                    <div v-if="aproximationLoading" class="ml-2">
                        <v-progress-circular indeterminate color="red" :size="22" :width="4" />
                    </div>
                </v-btn>
                <v-btn class="mx-6" @click="getExtendedBases">
                    Получить расширенные базисы
                </v-btn>
                <v-btn class="mr-6" @click="allBases = {}">
                    Очистить базисы
                </v-btn>
            </v-row>

            <v-row>
                <v-col cols="1">
                    <div class="truncate bg-red">
                        R2: {{ metrics.R2 }}
                    </div>
                </v-col>
                <v-col cols="1">
                    <div class="truncate bg-green">
                        AIC: {{ metrics.AIC }}
                    </div>
                </v-col>
                <v-col cols="1">
                    <div class="truncate bg-blue">
                        MSE: {{ metrics.MSE }}
                    </div>
                </v-col>
            </v-row>

            <v-row>

                <div style="display: flex; height: fit-content; width: 30%; background: #AAFFFF;">
                    <v-col cols="4">
                        <v-list density="compact" style="height: 200px; ">
                            <v-form ref="form1">
                                <v-list-item v-for="(variable, index) in dataInfo.fields.slice(1)" :key="index">
                                    <v-text-field :rules="[v => (v === 0 || !!v) || 'Поле обязательно']"
                                        v-model="predictInfo.predictData[0][variable]" :label="variable" />
                                </v-list-item>
                            </v-form>
                        </v-list>
                    </v-col>
                    <v-col cols="5">
                        <v-btn class="mb-3" @click="predict">
                            Предсказать
                        </v-btn>
                        <v-text-field v-model="predictInfo.predictAns" label="Предсказание" readonly />
                    </v-col>
                </div>
            </v-row>
        </div>

    </div>
</template>

<script>
import { read, utils } from 'xlsx';
import { getApproximation } from '@/app_lib/index';
import { getExtendedBases, getBasisKey } from '@/app_lib/bases';
import { calculatePredicted } from '@/app_lib/metrics';



export default {
    data() {
        return {
            file: null,

            aproximationLoading: false,

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

            predictInfo: {
                predictData: [{}],
                predictAns: ''
            }
        }
    },
    computed: {
        storeNumParams() {
            return this.$store.state.settings.storeNumParams;
        },
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

                this.result = await getApproximation(options)

                this.metrics = this.result.metrics;

                this.allBases = this.result.approximatedBases;

                console.log('Result:', this.result);

                // setTimeout(() => {
                //     this.setChartData();
                // }, 0)
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
        getExtendedBases() {

            if (Object.keys(this.allBases).length) this.filterBases();

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
        async predict() {
            const isValid = await this.$refs.form1.validate();
            if (isValid) {
                this.predictInfo.predictAns =
                    calculatePredicted([this.predictInfo.predictData[0]], this.allBases)
                        .map(ans => ans.toFixed(4))
                        .join(', ');
            } else
                alert('Вы не заполнили форму?');
        },
        setChartData() {
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