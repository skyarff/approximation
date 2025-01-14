function solveMatrix(A, B) {

    const detsVal = [];
    const matrixes = getMatrixes(A, B);

    for (let i = 0; i < matrixes.length; i++) {
        detsVal.push(getDeterminant(matrixes[i]))
    }

    const ans = [];
    for (let i = 1; i < matrixes.length; i++) {
        ans.push(detsVal[i] / detsVal[0]);
    }
    

    console.log('Детерменанты: ', detsVal);
    console.log('ans: ', ans)

    return ans;
}

function getDeterminant(matrix, row = 0, ex = []) {

    if (row == matrix.length - 2) {
        const detVal = []

        for (let i = row; i < row + 2; i++) {
            for (let j = 0; j < matrix[i].length; j++) {            
                if (!ex.includes(j)) {
                    detVal.push(matrix[i][j]);
                }
            }
        }

        return detVal[0] * detVal[3] - detVal[1] * detVal[2]
    }

    let acc = 0;
    let sign = 1;
    for (let i = 0; i < matrix[row].length; i++) {

        if (!ex.includes(i)) {
            const newEx = [...ex, i];
            acc += sign * matrix[row][i] * getDeterminant(matrix, row + 1, newEx)
            sign *= -1;
        }
    }

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