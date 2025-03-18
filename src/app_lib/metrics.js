import { basisFunctions, serializeObject } from './bases';
import MetricsWorkerPool from '@/app_lib/metricsWorkerPool';


async function calculatePredicted(data, allBases, metrics = true) {
    const allBasesArr = Object.values(allBases);
    
    if (metrics) allBasesArr.forEach(b => b.impact = 0);
    
    const serializedBasisFunctions = serializeObject(basisFunctions);

    const workerPool = new MetricsWorkerPool();
    const chunkSize = Math.ceil(data.length / workerPool.workers.length);
    const chunks = [];

    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push({
            start: i,
            end: Math.min(i + chunkSize, data.length)
        });
    }

    try {
        const serializedAllBasesArr = JSON.stringify(allBasesArr);
        const serializedData = JSON.stringify(data);

        const results = await Promise.all(chunks.map(chunk =>
            workerPool.processChunk(
                serializedData,
                serializedAllBasesArr,
                chunk.start,
                chunk.end,
                serializedBasisFunctions,
                'predicted',
                metrics
            )
        ));

        const predicted = [];
        results.sort((a, b) => a.chunkStart - b.chunkStart);

        // Собираем предсказанные значения
        for (const chunkResult of results) {
            predicted.push(...chunkResult.result.predicted);
            
            // Обновляем impact, если нужно
            if (metrics && chunkResult.result.impacts) {
                chunkResult.result.impacts.forEach((impact, index) => {
                    allBasesArr[index].impact = (allBasesArr[index].impact || 0) + impact;
                });
            }
        }

        return predicted;
    } catch (error) {
        throw error;
    } finally {
        workerPool.terminate();
    }
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