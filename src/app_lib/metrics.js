import { basisFunctions } from './bases';

function calculatePredicted(data, allBases) {
    const allBasesArr = Object.values(allBases);

    return data.map((_, k) => {
        return allBasesArr.reduce((sum, b) => {

            let val = 1;
            for (let t = 0; t < b.variables.length; t++) {
                const func = basisFunctions.getFunction(b.functions[t]);
                val *= Math.pow(func(data[k][b.variables[t]]), b.powers[t]);
            }

            val = basisFunctions.getFunction(b.outputFunc)(val)

            if ('outputDegree' in b && b.outputDegree != 1)
                val = Math.pow(val, b.outputDegree);
                

            return sum + b.weight * val;

        }, 0);
    });
}

function calculateR2(data, allBases, success = true, predicted) {
    if (!success) return null;

    const fields = Object.keys(data[0]);


    if (!predicted) 
        predicted = calculatePredicted(data, allBases);
    

    const mean = data.reduce((sum, val) => sum + val[fields[0]], 0) / data.length;
    const tss = data.reduce((sum, val) => sum + Math.pow(val[fields[0]] - mean, 2), 0);
    const rss = data.reduce((sum, val, i) => sum + Math.pow(val[fields[0]] - predicted[i], 2), 0);

    return 1 - (rss / tss);
}

function calculateAIC(data, allBases, success = true, predicted) {
    if (!success) return null;

    const fields = Object.keys(data[0]);
    const n = data.length;
    const k = Object.keys(allBases).length;

    if (!predicted) 
        predicted = calculatePredicted(data, allBases);


    const rss = data.reduce((sum, val, i) => sum + Math.pow(val[fields[0]] - predicted[i], 2), 0);

    const aic = n * Math.log(rss / n) + 2 * k;

    return aic;
}


function calculateMSE(data, allBases, success = true, predicted) {
    if (!success) return null;

    if (!predicted) 
        predicted = calculatePredicted(data, allBases);

    const fields = Object.keys(data[0]);
    const n = data.length;

    const squaredErrors = data.map((val, i) =>
        Math.pow(val[fields[0]] - predicted[i], 2)
    );

    return squaredErrors.reduce((sum, err) => sum + err, 0) / n;
}


export { calculateR2, calculateAIC, calculateMSE, calculatePredicted };