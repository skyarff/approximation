function solveMatrix(matrix) {

    console.time('_matrix_solver');
    const n = matrix.length;
    
    // Прямой ход
    for (let i = 0; i < n; i++) {
        // Поиск максимального элемента для частичной поворотной стратегии
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(matrix[j][i]) > Math.abs(matrix[maxRow][i])) {
                maxRow = j;
            }
        }

        // Перестановка строк
        if (maxRow !== i) {
            [matrix[i], matrix[maxRow]] = 
            [matrix[maxRow], matrix[i]];
        }

        // Проверка на вырожденность матрицы
        if (Math.abs(matrix[i][i]) < 1e-308) {
            throw new Error('Матрица вырождена');
        }

        // Нормализация строки
        const pivot = matrix[i][i];
        for (let j = i; j <= n; j++) {
            matrix[i][j] /= pivot;
        }

        // Исключение переменной из других уравнений
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const factor = matrix[j][i];
                for (let k = i; k <= n; k++) {
                    matrix[j][k] -= factor * matrix[i][k];
                }
            }
        }
    }

    const res = matrix.map(row => row[n]);

    console.timeEnd('_matrix_solver');

    // Получение решения
    return res;
}

export { solveMatrix };