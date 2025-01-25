<template>
    <div>
        <input type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            @change="fileUpload" style="display: none" ref="fileInput" />

        <div class="ef px-4 w-100" style="background: #d3e3e1;">
            <v-btn :style="{ color: file ? 'green' : '' }" class="def_btn" @click="$refs.fileInput.click()">
                ЗАГРУЗИТЬ ДАННЫЕ
            </v-btn>
        </div>


        <div class="w-100 pa-2">
            <v-row>
                <v-col cols="1">
                    <v-text-field title="L1 регуляризация" label="L1" v-model="L1" />
                </v-col>
                <v-col cols="1">
                    <v-text-field title="L2 регуляризация" label="L2" v-model="L2" />
                </v-col>
                <v-col cols="1">
                    <v-text-field title="Шаг построения степеней базисов" label="Step" v-model="step" />
                </v-col>
                <v-col cols="1">
                    <v-text-field title="Нормализация входных значений *k" label="k" v-model="k" />
                </v-col>
                <v-col cols="1">
                    <v-checkbox hint="Наличие константы" v-model="constant" label="Constant" />
                </v-col>
                <v-col cols="1">
                    <v-checkbox hint="Замена слишком малых входных значений приемлимыми" v-model="normSV"
                        label="normSV" />
                </v-col>
            </v-row>


            <v-row>
                <v-col class="d-flex flex-row" cols="6">
                    <v-col cols="3">
                        <v-autocomplete title="Функция участник" v-model="selectedFunction" :items="functions"
                            :item-title="item => `${item.val} (${item.label})`" item-value="val"
                            label="Выберите функцию"></v-autocomplete>
                    </v-col>
                    <v-col cols="2">
                        <v-text-field title="Степень базиса" type="number" v-model="degree"
                            label="Степень"></v-text-field>
                    </v-col>
                    <v-col cols="2">
                        <v-select v-model="depth" :items="depths" item-title="val" item-value="val"
                            label="Глубина"></v-select>
                    </v-col>
                    <v-col cols="2">
                        <v-select :disabled="!selectedVariable" v-model="selectedVariable" :items="fields.slice(1)"
                            item-title="field" item-value="field" label="Переменная"></v-select>
                    </v-col>
                    <v-col cols="3">
                        <v-btn class="mb-2" @click="addSimplifiedBasis">
                            Расш. базис
                        </v-btn>
                    </v-col>
                </v-col>

                <v-col class="d-flex flex-row" cols="6">
                    <v-col cols="4">
                        <v-btn @click="addVariables">
                            Добавить переменную
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
                    <v-list class="nScroll" density="compact" style="height: 200px;">
                        <v-list-item v-for="(basis, index) in simplifiedBasis" :key="index"
                            :title="getSimplifiedBasisName(basis)">
                            <template v-slot:append>
                                <v-btn icon="mdi-close" density="compact" variant="text"
                                    @click="simplifiedBasis.splice(index, 1)"></v-btn>
                            </template>
                        </v-list-item>
                    </v-list>
                </v-col>

                <div style="height: fit-content; width: 50%; background: #CC0000CC;">
                    <v-col cols="8">
                        <v-list class="nScroll" density="compact" style="height: 200px;">
                            <v-list-item v-for="(basisKey, index) in Object.keys(customBases)" :key="index"
                                :title="basisKey">
                                <template v-slot:append>
                                    <v-btn icon="mdi-close" density="compact" variant="text"
                                        @click="delete customBases[basisKey]"></v-btn>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-col>
                </div>

            </v-row>

            <v-row>
                <v-btn @click="makeApproximation">
                    Аппроксимировать
                </v-btn>
                <v-btn class="mx-6" @click="getSimplifiedBasis">
                    Получить расширенные базисы
                </v-btn>
                <v-btn class="mr-6" @click="basis = {}">
                    Очистить базисы
                </v-btn>
                <v-btn @click="showBasis">
                    Посмотреть базисы
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
                <div style="display: flex; height: fit-content; width: 40%; background: #CC0000CC;">
                    <v-col cols="9">
                        <v-list class="nScroll" density="compact" style="height: 200px;">
                            <v-list-item v-for="(basisKey, index) in Object.keys(basis) " :key="index"
                                :title="`${basis[basisKey].w} * ${basisKey}`">
                                <template v-slot:append>
                                    <v-btn icon="mdi-close" density="compact" variant="text"
                                        @click="delete basis[basisKey]"></v-btn>
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-col>
                    <v-col cols="3">
                        <v-btn @click="copyBasisRepresentation">
                            Скопировать
                        </v-btn>
                    </v-col>
                </div>

                <div style="display: flex; height: fit-content; width: 30%; background: #AAFFFF;">
                    <v-col cols="4">

                        <!-- <v-col cols="2">
                            <v-select :disabled="!selectedVariable" v-model="selectedVariable" :items="fields.slice(1)"
                                item-title="field" item-value="field" label="Переменная"></v-select>
                        </v-col> -->

                        <v-list class="nScroll" density="compact" style="height: 200px; ">
                            <v-form ref="form1">
                                <v-list-item v-for="(variable, index) in fields.slice(1)" :key="index">
                                    <v-text-field :rules="[v => (v === 0 || !!v) || 'Поле обязательно']"
                                        v-model="forPredict[variable]" :label="variable" />
                                </v-list-item>
                            </v-form>
                        </v-list>
                    </v-col>
                    <v-col cols="5">
                        <v-btn class="mb-3" @click="predict">
                            Предсказать
                        </v-btn>
                        <v-text-field v-model="predictAns" label="Предсказание" readonly />
                    </v-col>
                </div>
            </v-row>
        </div>






    </div>
</template>

<script>
import { read, utils } from 'xlsx';
import { dataProcessing } from '@/app_lib/index';
import { getBasis, getBasisName } from '@/app_lib/basis';
import { calculatePredicted } from '@/app_lib/metrics';



export default {
    data() {
        return {
            file: null,
            functions: [
                { id: 1, val: '', label: 'Идентичность' },
                { id: 2, val: 'sqrt', label: 'Квадратный корень' },
                { id: 3, val: 'sin', label: 'Синус' },
                { id: 4, val: 'cos', label: 'Косинус' },
                { id: 5, val: 'tan', label: 'Тангенс' },
                { id: 6, val: 'ln', label: 'Натуральный логарифм' },
                { id: 7, val: 'exp', label: 'Экспонента' },
                { id: 8, val: 'abs', label: 'Модуль' },
                { id: 9, val: 'tanh', label: 'Гиперболический тангенс' }
            ],
            selectedFunction: '',
            degree: 1,
            depth: 1,
            depths: [
                { id: 0, val: 1 },
                { id: 1, val: 2 },
                { id: 2, val: 3 }
            ],
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
            selectedVariable: '',
            simplifiedBasis: ['3^3', '2^2', '1', '3sin^3', '2sin^2'],
            basis: {},
            L1: 1,
            L2: 1,
            step: 1,
            normSV: true,
            k: 1,
            constant: true,
            result: null,
            defaultCustomBasis: {
                b: [],
                p: [],
                v: []
            },
            customBasis: {
                b: [],
                p: [],
                v: []
            },
            customBases: {},
            fields: ['z', 'y', 'x'],
            metrics: {
                R2: '',
                AIC: '',
                MSE: '',
            },
            forPredict: {},
            predictAns: ''

        }
    },
    mounted() {
    },
    methods: {
        async makeApproximation() {
            this.result = await dataProcessing(this.data, this.basis, this.L1, this.L2, this.normSV, this.k)

            this.metrics = this.result.metrics;

            console.log('Result:', this.result);
        },
        addSimplifiedBasis() {
            this.simplifiedBasis.push(`${this.depth}${this.selectedFunction}^${this.degree}`)
        },
        addCustomBasis() {

            this.basis[getBasisName(this.customBasis)]
                = ({ w: 1, b: this.customBasis.b, v: this.customBasis.v, p: this.customBasis.p });
        },
        addVariables() {
            this.customBasis.b.push(this.selectedFunction);
            this.customBasis.p.push(Number(this.degree));
            this.customBasis.v.push(this.selectedVariable);

            console.log('this.customBasis', this.customBasis)
        },
        clearCustomBasis() {
            this.customBasis = this.defaultCustomBasis;
            this.customBases = {};
        },
        getBasisName(basis, names) {
            return getBasisName(basis, names);
        },
        getSimplifiedBasis() {
            if (this.data.length > 0) {
                this.basis = { ...getBasis(this.fields.length, this.simplifiedBasis, this.basis, this.constant, this.step, this.fields) };
                console.log('this.basis_', this.basis)

            } else {
                this.$store.dispatch('notify', {
                    text: 'Данные отсутствуют.',
                    color: 'warning'
                });
            }
        },
        getSimplifiedBasisName(basis) {
            const rows = basis.split('^');
            const depth = rows.length > 0 ? `${rows[0][0]}` : '1'
            const degree = rows.length > 1 ? `^${rows[1]}` : ''
            return `${rows[0].substring(1)}(x)${degree} - глубина ${depth}`
        },
        async fileUpload(event) {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.xlsx')) {
                this.file = file;
                this.data = await this.readExcelFile(file);
                this.fields = Object.keys(this.data[0]);
                this.selectedVariable = this.fields[1];
            } else {
                this.$store.dispatch('notify', {
                    text: 'Пожалуйста, выберите файл формата .xlsx',
                    color: 'error'
                });
            }
            event.target.value = '';
        },
        showBasis() {
            console.log('showBasis', this.basis)
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
        async copyBasisRepresentation() {
            let result = '';
            for (let key in this.basis) {
                let weight = this.basis[key].w.toString();
                const sign = weight[0] == '-' ? '-' : '+';
                weight = sign === '+' ? weight : weight.substring(1);

                result += `${sign} ${weight} * ${key}\n`
            }

            await navigator.clipboard.writeText(result.slice(0, -1));
        },
        async predict() {
            const isValid = await this.$refs.form1.validate();
            console.log(isValid, this.forPredict)
            if (isValid) {
                this.predictAns = calculatePredicted(this.basis, [this.forPredict])
            } else 
                alert('Вы не заполнили форму?');
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