function solveMatrix(A, B) {
    const n = A.length;
    const augmentedMatrix = A.map((row, i) => [...row, B[i]]); // Расширенная матрица

    // Прямой ход
    for (let i = 0; i < n; i++) {
        // Поиск максимального элемента для частичной поворотной стратегии
        let maxRow = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(augmentedMatrix[j][i]) > Math.abs(augmentedMatrix[maxRow][i])) {
                maxRow = j;
            }
        }

        // Перестановка строк
        if (maxRow !== i) {
            [augmentedMatrix[i], augmentedMatrix[maxRow]] = 
            [augmentedMatrix[maxRow], augmentedMatrix[i]];
        }

        // Проверка на вырожденность матрицы
        if (Math.abs(augmentedMatrix[i][i]) < 1e-10) {
            throw new Error('Матрица вырождена');
        }

        // Нормализация строки
        const pivot = augmentedMatrix[i][i];
        for (let j = i; j <= n; j++) {
            augmentedMatrix[i][j] /= pivot;
        }

        // Исключение переменной из других уравнений
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                const factor = augmentedMatrix[j][i];
                for (let k = i; k <= n; k++) {
                    augmentedMatrix[j][k] -= factor * augmentedMatrix[i][k];
                }
            }
        }
    }

    // Получение решения
    return augmentedMatrix.map(row => row[n]);
}

export { solveMatrix };