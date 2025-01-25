import { basisFunctions } from './basis';

function calculatePredicted(basis, data) {
    const fullBasis = Object.values(basis);

    return data.map((_, k) => {
        return fullBasis.reduce((sum, b) => {

            let val = 1;
            for (let t = 0; t < b.v.length; t++) {
                const func = basisFunctions.getFunction(b.b[t]);
                val *= Math.pow(func(data[k][b.v[t]]), b.p[t]);
            }

            return sum + b.w * basisFunctions.getFunction(b.outputFunc)(val);

        }, 0);
    });
}

function R2(basis, data, success = true) {
    if (!success) return null;

    const fields = Object.keys(data[0]);

    const predicted = calculatePredicted(basis, data);

    const mean = data.reduce((sum, val) => sum + val[fields[0]], 0) / data.length;
    const tss = data.reduce((sum, val) => sum + Math.pow(val[fields[0]] - mean, 2), 0);
    const rss = data.reduce((sum, val, i) => sum + Math.pow(val[fields[0]] - predicted[i], 2), 0);

    return 1 - (rss / tss);
}

function calculateAIC(basis, data, success = true) {
    if (!success) return null;

    const fields = Object.keys(data[0]);
    const n = data.length;
    const k = Object.keys(basis).length;

    const predicted = calculatePredicted(basis, data);
    const rss = data.reduce((sum, val, i) => sum + Math.pow(val[fields[0]] - predicted[i], 2), 0);

    const aic = n * Math.log(rss / n) + 2 * k;

    return aic;
}

// MSE (Mean Squared Error) - среднеквадратическая ошибка
function calculateMSE(basis, data, success = true) {
    if (!success) return null;

    const predicted = calculatePredicted(basis, data);
    const fields = Object.keys(data[0]);
    const n = data.length;

    const squaredErrors = data.map((val, i) =>
        Math.pow(val[fields[0]] - predicted[i], 2)
    );

    return squaredErrors.reduce((sum, err) => sum + err, 0) / n;
}


export { R2, calculateAIC, calculateMSE, calculatePredicted };