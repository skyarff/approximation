let matrixSize;
let workers;
let numWorkers;
let rowsPerWorker;
let augmentedMatrix;

async function initWorkers() {
    for (let i = 0; i < numWorkers; i++) {
        const workerCode = `
        self.onmessage = async function(e) {
            const { augMat, startRow, endRow, pivotRowIndex } = e.data;
            const augmentedMatrix = augMat.augmentedMatrix;
            const length = augmentedMatrix[0].length - 1;
            
            let index = -1;
            while (index < length - 1) {
                index++;

                // Обрабатываем строки для текущего индекса
                for (let i = startRow; i < endRow; i++) {
                    if (i === index) continue;
                    
                    const pivotElement = augmentedMatrix[index][index];
                    if (Math.abs(pivotElement) < 1e-10) {
                        console.log('Близкое к нулю значение на диагонали:', index);
                        continue;
                    }
                    
                    const factor = augmentedMatrix[i][index] / pivotElement;
                    
                    // Обрабатываем всю строку, включая свободный член
                    for (let j = 0; j <= length; j++) {
                        augmentedMatrix[i][j] -= factor * augmentedMatrix[index][j];
                    }
                }

                // Ждем обработки других потоков
                if (index !== length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            self.postMessage({ augmentedMatrix, startRow, endRow });
        };`;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        workers.push(worker);
    }
}

async function solveMatrix(A, B) {
    matrixSize = A.length;
    augmentedMatrix = A.map((row, i) => [...row, B[i]]);
    
    numWorkers = Math.min(4, navigator.hardwareConcurrency - 1);
    rowsPerWorker = Math.ceil(matrixSize / numWorkers);
    workers = [];

    await initWorkers();

    const workerPromises = workers.map((worker, workerIndex) => {
        const startRow = workerIndex * rowsPerWorker;
        const endRow = Math.min(startRow + rowsPerWorker, matrixSize);

        return new Promise((resolve) => {
            worker.onmessage = function(e) {
                const { augmentedMatrix: updatedMatrix, startRow, endRow } = e.data;
                for (let i = startRow; i < endRow; i++) {
                    augmentedMatrix[i] = updatedMatrix[i];
                }
                resolve();
            };

            worker.postMessage({
                augMat: {
                    augmentedMatrix
                },
                startRow,
                endRow,
                pivotRowIndex: { val: 0 }
            });
        });
    });

    await Promise.all(workerPromises);
    workers.forEach(worker => worker.terminate());

    // Решаем систему, нормализуя каждую строку
    const solution = new Array(matrixSize);
    for (let i = 0; i < matrixSize; i++) {
        const diagonalElement = augmentedMatrix[i][i];
        if (Math.abs(diagonalElement) < 1e-10) {
            console.log('Предупреждение: близкое к нулю значение на диагонали:', i);
            solution[i] = 0;
            continue;
        }
        solution[i] = augmentedMatrix[i][matrixSize] / diagonalElement;
    }

    return solution;
}

export { solveMatrix };