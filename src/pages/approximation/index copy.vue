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
// import { AdvancedComponentPredictor } from '@/app_lib/index';

export default {
    data() {
        return {
            file: null,
            formula: '',
            approximationData: null,
            predictor: null,
            results: null
        }
    },
    methods: {
        async fileUpload(event) {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.xlsx')) {
                this.file = file;
                // Читаем данные из Excel
                const data = await this.readExcelFile(file);
                this.approximationData = data;
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
                        // Используем импортированные функции
                        const workbook = read(data, { type: 'array' });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        // Конвертируем в массив
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

        makeApproximation() {
            try {
                // Подготовка данных
                const X = this.approximationData.map(row => {
                    const values = Object.values(row).slice(1);
                    return values.map(Number);
                });

                const y = this.approximationData.map(row => {
                    return Number(Object.values(row)[0]);
                });

                // Нормализация данных
                const xMeans = X[0].map((_, j) =>
                    X.reduce((sum, row) => sum + row[j], 0) / X.length
                );
                const xStds = X[0].map((_, j) => {
                    const mean = xMeans[j];
                    const variance = X.reduce((sum, row) => sum + Math.pow(row[j] - mean, 2), 0) / X.length;
                    return Math.sqrt(variance);
                });

                const X_normalized = X.map(row =>
                    row.map((val, j) => (val - xMeans[j]) / (xStds[j] || 1))
                );

                const yMean = y.reduce((a, b) => a + b) / y.length;
                const yStd = Math.sqrt(y.reduce((a, b) => Math.pow(b - yMean, 2), 0) / y.length);
                const y_normalized = y.map(val => (val - yMean) / yStd);

                // Создаем модель с измененными параметрами
                this.predictor = new AdvancedComponentPredictor(
                    10,    // уменьшаем количество компонент
                    2,     // уменьшаем мета-компоненты
                    0.001  // уменьшаем скорость обучения
                );

                // Сохраняем параметры нормализации
                this.predictor.xMeans = xMeans;
                this.predictor.xStds = xStds;
                this.predictor.yMean = yMean;
                this.predictor.yStd = yStd;

                // Обучаем модель на нормализованных данных
                this.predictor.fit(X_normalized, y_normalized);

                // Получаем предсказания
                const predictions = this.predictor.predict(X_normalized)
                    .map(pred => pred * yStd + yMean); // возвращаем к исходному масштабу

                // Выводим метрики
                const metrics = {
                    MSE: predictions.reduce((sum, pred, i) => sum + Math.pow(pred - y[i], 2), 0) / predictions.length,
                    MAE: predictions.reduce((sum, pred, i) => sum + Math.abs(pred - y[i]), 0) / predictions.length,
                    R2: 1 - (predictions.reduce((sum, pred, i) => sum + Math.pow(pred - y[i], 2), 0) /
                        y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0))
                };

                console.log('\nМетрики качества:');
                console.table(metrics);

                // Выводим примеры предсказаний
                console.log('\nПримеры предсказаний (первые 10):');
                const examples = Array.from({ length: Math.min(10, y.length) }, (_, i) => ({
                    'Реальное значение': y[i],
                    'Предсказание': predictions[i].toFixed(2),
                    'Абсолютная ошибка': Math.abs(predictions[i] - y[i]).toFixed(2),
                    'Относительная ошибка %': ((Math.abs(predictions[i] - y[i]) / y[i]) * 100).toFixed(2)
                }));
                console.table(examples);

                // Сохраняем результаты
                this.results = { metrics, predictions, examples };

            } catch (error) {
                console.error('Ошибка при аппроксимации:', error);
                this.$store.dispatch('notify', {
                    text: `Ошибка при выполнении аппроксимации: ${error.message}`,
                    color: 'error'
                });
            }
        },

        predict() {
            if (!this.predictor) {
                this.$store.dispatch('notify', {
                    text: 'Сначала нужно обучить модель',
                    color: 'warning'
                });
                return;
            }

            try {
                // Берем 5 примеров из данных
                const testData = this.approximationData.slice(0, 5).map(row => {
                    const values = Object.values(row).slice(1);
                    return values.map(Number);
                });

                // Нормализуем тестовые данные
                const testData_normalized = testData.map(row =>
                    row.map((val, j) => (val - this.predictor.xMeans[j]) / (this.predictor.xStds[j] || 1))
                );

                // Получаем и денормализуем предсказания
                const predictions = this.predictor.predict(testData_normalized)
                    .map(pred => pred * this.predictor.yStd + this.predictor.yMean);

                // Получаем реальные значения
                const realValues = this.approximationData.slice(0, 5)
                    .map(row => Number(Object.values(row)[0]));

                // Выводим результаты
                console.log('\nРезультаты предсказания:');
                const results = testData.map((data, i) => ({
                    'Входные данные': data.join(', '),
                    'Предсказание': predictions[i].toFixed(2),
                    'Реальное значение': realValues[i],
                    'Ошибка': Math.abs(predictions[i] - realValues[i]).toFixed(2)
                }));
                console.table(results);

            } catch (error) {
                console.error('Ошибка при предсказании:', error);
                this.$store.dispatch('notify', {
                    text: `Ошибка при выполнении предсказания: ${error.message}`,
                    color: 'error'
                });
            }
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
</style>