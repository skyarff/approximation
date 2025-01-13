import { read, utils } from 'xlsx';
import { AdvancedComponentPredictor } from '@/app_lib/index';

export default {
    data() {
        return {
            file: null,
            formula: '',
            approximationData: null,
            predictor: null,
            results: null,
            trainMetrics: null,
            testMetrics: null,
            formulas: []
        };
    },
    methods: {
        async fileUpload(event) {
            const file = event.target.files[0];
            if (file && file.name.endsWith('.xlsx')) {
                this.file = file;
                const data = await this.readExcelFile(file);
                this.approximationData = data;
            } else {
                // Обработка ошибки - неверный формат файла
                alert('Пожалуйста, выберите файл формата .xlsx');
            }
            event.target.value = ''; // Очищаем input
        },

        async readExcelFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const workbook = read(e.target.result, { type: 'array' });
                        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = utils.sheet_to_json(worksheet);
                        resolve(jsonData);
                    } catch (error) {
                        reject(error);
                        // Обработка ошибки чтения файла
                        alert('Ошибка при чтении файла Excel.');
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        },

        addSymbol(symbol) {
            this.formula += symbol;
        },

        del() {
            this.formula = this.formula.slice(0, -1);
        },

        addFormula() {
            if (this.formula.trim() !== '') {
                try {
                    // Проверяем, что формула - валидный JS код
                    new Function(`return ${this.formula}` )(); // Проверка без выполнения кода
                    this.formulas.push(this.formula);
                    this.formula = '';
                } catch (error) {
                    alert('Некорректная формула.');
                }
            }
        },

        makeApproximation() {
            if (!this.approximationData) {
              alert("Загрузите данные перед аппроксимацией");
              return;
            }

           try {
                const X = this.approximationData.map(row => Object.values(row).slice(1).map(Number));
                const y = this.approximationData.map(row => Number(Object.values(row)[0]));


                const xMeans = X[0].map((_, j) => X.reduce((sum, row) => sum + row[j], 0) / X.length);
                const xStds = X[0].map((_, j) => {
                    const mean = xMeans[j];
                    return Math.sqrt(X.reduce((sum, row) => sum + (row[j] - mean) ** 2, 0) / X.length) || 1; // added || 1
                });

                const X_normalized = X.map(row => row.map((val, j) => (val - xMeans[j]) / xStds[j]));
                const yMean = y.reduce((sum, val) => sum + val, 0) / y.length;
                const yStd = Math.sqrt(y.reduce((sum, val) => (val - yMean) ** 2, 0) / y.length) || 1; // added || 1

                const y_normalized = y.map(val => (val - yMean) / yStd);

                const trainSize = Math.floor(X_normalized.length * 0.99);
                const X_train = X_normalized.slice(0, trainSize);
                const y_train = y_normalized.slice(0, trainSize);
                const X_test = X_normalized.slice(trainSize);
                const y_test = y_normalized.slice(trainSize);

                this.predictor = new AdvancedComponentPredictor(10, 2, 0.001);
                this.predictor.fit(X_train, y_train);


                this.trainMetrics = this.predictor.evaluate(X_train, y_train);
                this.testMetrics = this.predictor.evaluate(X_test, y_test);

                console.log('Train Metrics:', this.trainMetrics);
                console.log('Test Metrics:', this.testMetrics);


                const examples = Array.from({ length: Math.min(10, y.length) }, (_, i) => ({
                    'Реальное значение': y[i],
                    'Предсказание': predictions[i].toFixed(2),
                    'Абсолютная ошибка': Math.abs(predictions[i] - y[i]).toFixed(2),
                    'Относительная ошибка %': ((Math.abs(predictions[i] - y[i]) / y[i]) * 100).toFixed(2)
                }));
                console.table(examples);

                // Сохраняем результаты
                this.results = { metrics, predictions, examples };


           } catch(error) {
              console.error("Ошибка в аппроксимации:", error);
              alert("Ошибка при аппроксимации. Проверьте данные и формулу.");
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
    }
};