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
                <v-col cols="5">
                    <v-card>
                        <v-toolbar density="compact" aria-multiline="true">
                            <v-btn icon @click="addSymbol('x')">x</v-btn>
                            <v-btn icon @click="addSymbol('e')">e</v-btn>
                            <v-btn icon @click="addSymbol('3.14')">pi</v-btn>
                            <v-btn icon @click="addSymbol('sin')">sin</v-btn>
                            <v-btn icon @click="addSymbol('cos')">cos</v-btn>
                            <v-btn icon @click="addSymbol('log')">log</v-btn>
                            <v-btn icon @click="addSymbol('(')">(</v-btn>
                            <v-btn icon @click="addSymbol(')')">)</v-btn>

                        </v-toolbar>
                        <v-toolbar density="compact" aria-multiline="true">
                            <v-btn icon @click="addSymbol('+')">+</v-btn>
                            <v-btn icon @click="addSymbol('-')">−</v-btn>
                            <v-btn icon @click="addSymbol('×')">×</v-btn>
                            <v-btn icon @click="addSymbol('÷')">÷</v-btn>
                            <v-btn icon @click="addSymbol('√')">√</v-btn>
                            <v-btn icon @click="addSymbol('^')">^</v-btn>
                            <v-btn icon @click="addSymbol('.')">.</v-btn>

                            <v-btn icon @click="del()">del</v-btn>
                        </v-toolbar>

                        <v-textarea class="basis_textarea" v-model="formula" label="Базис" variant="underlined"
                            clearable rows="4" :no-resize="true" />
                    </v-card>
                </v-col>

                <v-col cols="2" class="d-flex flex-column px-0">

                    <div class="num_grid">
                        <div v-for="i in 3" class="d-flex flex-row sf">
                            <div cols="3" v-for="j in 3">
                                <v-btn class="num_btn def_btn" @click="addSymbol(j + 3 * (i - 1))">{{ j + 3 * (i - 1)
                                    }}</v-btn>
                            </div>
                        </div>


                        <div class="add_div">
                            <v-btn class="def_btn">
                                Добавить
                            </v-btn>
                        </div>
                    </div>



                </v-col>


                <v-col cols="5">

                </v-col>
            </v-row>
        </div>


        <div class="w-100">
            <v-btn @click="makeApproximation">
                Аппроксимировать
            </v-btn>
            <v-btn @click="predict">
                Predict
            </v-btn>
        </div>


    </div>
</template>

<script>
import { read, utils } from 'xlsx';
import { dataProcessing } from '@/app_lib/index';



export default {
    data() {
        return {
            file: null,
            formula: '',
            approximationData: null,
            predictor: null,
            results: null,
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
            basis: ['3x^3', '2x^2', '1x', '3sin^3', '2sin^2',]
        }
    },
    mounted() {

        // console.log('pow', Math.pow(4, eval('1/2')))
    },
    methods: {
        makeApproximation() {
            console.log('APPdata', dataProcessing(this.data, this.basis, this.L1, this.L2, 1, true, 1))
        },
        async fileUpload(event) {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.xlsx')) {
                this.file = file;
                this.data = await this.readExcelFile(file);
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



        addSymbol(symbol) {
            if (this.formula === null) this.formula = '';
            this.formula += symbol;
        },

        del() {
            if (this.formula.length) this.formula = this.formula.slice(0, -1);
        },

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
</style>