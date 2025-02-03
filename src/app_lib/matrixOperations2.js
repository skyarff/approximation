let cacheHits = 0; // Счетчик кэш-хитов (объявлен вне функции getDeterminant)

function solveMatrix(A, B) {

    const detsVal = [];
    const matrixes = getMatrixes(A, B);

    for (let i = 0; i < matrixes.length; i++) {
        const cache = new Map();
        detsVal.push(getDeterminant(matrixes, i, cache));
    }

    const ans = [];
    for (let i = 1; i < matrixes.length; i++) {
        ans.push(detsVal[i] / detsVal[0]);
    }

    console.log('Детерменанты: ', detsVal);
    console.log('ans: ', ans);
    console.log('Cache Hits:', cacheHits); // Вывод количества кэш-хитов

    return ans;
}

function getDeterminant(matrixes, index, cache, row = 0, ex = []) {

    // 1. Сортируем массив ex для создания более эффективного ключа
    const sortedEx = [...ex].sort((a, b) => a - b);
    const key = `${1}_${row}_${sortedEx.join('')}`;

    if (cache.has(key)) {
        cacheHits++; // Увеличиваем счетчик кэш-хитов при попадании в кэш
        console.log('Cache Hits:', cacheHits); 
        return cache.get(key);
    }

    if (row == matrixes[index].length - 2) {
        const detVal = []

        for (let i = row; i < row + 2; i++) {
            for (let j = 0; j < matrixes[index][i].length; j++) {
                if (!ex.includes(j)) {
                    detVal.push(matrixes[index][i][j]);
                }
            }
        }

        let acc = detVal[0] * detVal[3] - detVal[1] * detVal[2];
        cache.set(key, acc);

        return acc;
    }

    let acc = 0;
    let sign = 1;
    for (let i = 0; i < matrixes[index][row].length; i++) {

        if (!ex.includes(i)) {
            const newEx = [...ex, i];
            acc += sign * matrixes[index][row][i] * getDeterminant(matrixes, index, cache, row + 1, newEx)
            sign *= -1;
        }
    }

    cache.set(key, acc)

    return acc;
}

function getMatrixes(A, B) {
    const matrixes = [];
    matrixes.push(A);

    let tempA;
    for (let i = 0; i < B.length; i++) {
        tempA = A.map(row => [...row]);
        for (let j = 0; j < A.length; j++) {
            tempA[j][i] = B[j];
        }
        matrixes.push(tempA);
    }

    return matrixes;
}

export { solveMatrix }