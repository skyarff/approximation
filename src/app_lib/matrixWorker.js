self.onmessage = function(e) {
    console.log('запустился')
    const { augmentedMatrix, startRow, endRow, pivotRowIndex } = e.data;

    for (let i = startRow; i < endRow; i++) {
        if (i === pivotRowIndex) continue; // Пропускаем ведущую строку

        const factor = augmentedMatrix[i][pivotRowIndex] / augmentedMatrix[pivotRowIndex][pivotRowIndex];
        for (let j = pivotRowIndex; j < augmentedMatrix[i].length; j++) {
            augmentedMatrix[i][j] -= factor * augmentedMatrix[pivotRowIndex][j];
        }
    }

    self.postMessage({ augmentedMatrix, startRow, endRow });
};