let matrixSize;
let workers;
let numWorkers;
let rowsPerWorker;
let augmentedMatrix;

// Инициализация воркеров
async function initWorkers() {
    for (let i = 0; i < numWorkers; i++) {
        const workerCode = `
    self.onmessage = function(e) {
        const { augmentedMatrix, startRow, endRow, pivotRowIndex } = e.data;

        for (let i = startRow; i < endRow; i++) {
            if (i === pivotRowIndex.val) continue; // Пропускаем ведущую строку

            const factor = augmentedMatrix[i][pivotRowIndex.val] / augmentedMatrix[pivotRowIndex.val][pivotRowIndex.val];
            for (let j = 0; j < augmentedMatrix[0].length; j++) {
                augmentedMatrix[i][j] -= factor * augmentedMatrix[pivotRowIndex.val][j];
            }
        }

        self.postMessage({ augmentedMatrix, startRow, endRow });
    };
`;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        workers.push(worker);
    }
}

// Прямой и обратный ход метода Гаусса
async function gaussianElimination() {
    
    let pivotRowIndex = {val: 0}

    for (; pivotRowIndex.val < matrixSize; pivotRowIndex.val++) {
        // Выбор ведущей строки (частичный выбор главного элемента)
        let maxRow = pivotRowIndex.val;
        for (let i = pivotRowIndex.val + 1; i < matrixSize; i++) {
            if (Math.abs(augmentedMatrix[i][pivotRowIndex.val]) > Math.abs(augmentedMatrix[maxRow][pivotRowIndex.val])) {
                maxRow = i;
            }
        }

        // Перестановка строк
        if (maxRow !== pivotRowIndex.val) {
            [augmentedMatrix[pivotRowIndex.val], augmentedMatrix[maxRow]] = [
                augmentedMatrix[maxRow],
                augmentedMatrix[pivotRowIndex.val],
            ];
        }

        // Нормализация ведущей строки
        const pivotElement = augmentedMatrix[pivotRowIndex.val][pivotRowIndex.val];
        for (let j = pivotRowIndex.val; j < augmentedMatrix[pivotRowIndex.val].length; j++) {
            augmentedMatrix[pivotRowIndex.val][j] /= pivotElement;
        }

        
    }

    const workerPromises = workers.map((worker, workerIndex) => {
        const startRow = workerIndex * rowsPerWorker;
        const endRow = Math.min(startRow + rowsPerWorker, matrixSize);

        return new Promise((resolve) => {
            worker.onmessage = function (e) {
                const { augmentedMatrix: updatedMatrix, startRow, endRow } = e.data;

                // Обновляем матрицу в основном потоке
                for (let i = startRow; i < endRow; i++) {
                    augmentedMatrix[i] = updatedMatrix[i];
                }

                resolve();
            };

            worker.postMessage({
                augmentedMatrix,
                startRow,
                endRow,
                pivotRowIndex,
            });
        });
    });

    // Ожидаем завершения всех воркеров
    await Promise.all(workerPromises);
}

// Инициализация и запуск
async function solveMatrix(A, B) {
    augmentedMatrix = A.map((row, i) => [...row, B[i]]); // Расширенная матрица


    matrixSize = A.length;
    workers = [];
    numWorkers = Math.min(Math.pow(matrixSize, 3) / 8e+5, navigator.hardwareConcurrency - 1, 19);
    rowsPerWorker = Math.ceil(matrixSize / numWorkers);



    await initWorkers();
    await gaussianElimination();

    const solution = augmentedMatrix.map(row => row[matrixSize]);


    return solution;
}

export { solveMatrix };