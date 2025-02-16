
import { solveMatrix } from '@/app_lib/matrixOperations';
import { Array } from 'core-js';
import { calculateR2, calculateAIC, calculateMSE } from './metrics';
import { basisFunctions } from './bases';
import WorkerPool from './workerPool';



function dataNormalization(data, normSmallValues = false, multiplicationFactor = 1) {

  if (!normSmallValues && multiplicationFactor == 1) return;
  multiplicationFactor = parseFloat(multiplicationFactor);

  const fields = Object.keys(data[0]);

  for (let i = 0; i < data.length; i++) {
    for (let field of fields) {
      if (multiplicationFactor !== 1) data[i][field] *= multiplicationFactor
      if (normSmallValues && Math.abs(data[i][field]) < 1e-20) {
        data[i][field] = 1e-20;
      }
    }
  }
};

async function computeA(data, allBasesArr) {
  const functionCache = new Map();

  const precomputedValues = allBasesArr.map((basisElement, basisIndex) => {

    const key = `A_${basisIndex}`;

    return data.map((dataPoint, dataIndex) => {
      let val = 1;
      for (let t = 0; t < basisElement.variables.length; t++) {
        const cacheKey = `${key}_${dataIndex}_${t}`;


        let funcResult;
        if (functionCache.has(cacheKey)) {
          funcResult = functionCache.get(cacheKey);
        } else {
          const func = basisFunctions.getFunction(basisElement.functions[t]);
          const fieldValue = dataPoint[basisElement.variables[t]];

          funcResult = Math.pow(func(fieldValue), basisElement.powers[t]);
          functionCache.set(cacheKey, funcResult);
        }

        val *= funcResult;
      }

      val = basisFunctions.getFunction(basisElement.outputFunc)(val);

      if ('outputDegree' in basisElement && basisElement.outputDegree != 1)
        val = Math.pow(val, basisElement.outputDegree);

      return val;
    });
  });

  const A = new Array(allBasesArr.length);

  // Создаем пул с оптимальным количеством воркеров
  const pool = new WorkerPool();

  // Разбиваем задачу на части в зависимости от количества воркеров
  const chunkSize = Math.ceil(allBasesArr.length / pool.workers.length);
  const chunks = [];

  for (let i = 0; i < allBasesArr.length; i += chunkSize) {
    chunks.push({
      start: i,
      end: Math.min(i + chunkSize, allBasesArr.length)
    });
  }


  try {
    // Запускаем обработку чанков параллельно
    const results = await Promise.all(chunks.map(chunk =>
      pool.processChunk(
        precomputedValues,
        chunk.start,
        chunk.end,
        allBasesArr.length,
        data.length
      )
    ));

    // Собираем результаты
    results.forEach((result, index) => {
      const startIndex = chunks[index].start;
      result.forEach((row, rowIndex) => {
        A[startIndex + rowIndex] = row;
      });
    });

    return A;
  } finally {
    pool.terminate();
  }
}

async function getApproximation({ data = [], allBases = {}, L1 = 0, L2 = 0, normSmallValues = false, multiplicationFactor = 1 } = {}) {

  dataNormalization(data, normSmallValues, multiplicationFactor);

  const allBasesArr = Object.values(allBases);

  const A = await computeA(data, allBasesArr);
  console.log('матрица A сформирована')

  for (let i = 0; i < A.length; i++)
    A[i][i] += 2 * L2;

  const dataFields = Object.keys(data[0]);

  const B = allBasesArr.map((b, index) => {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {

      let val = 1;
      for (let t = 0; t < allBasesArr[index].variables.length; t++) {
        const func = basisFunctions.getFunction(b.functions[t]);
        val *= Math.pow(func(data[i][allBasesArr[index].variables[t]]), allBasesArr[index].powers[t]);
      }

      val = basisFunctions.getFunction(b.outputFunc)(val);

      if ('outputDegree' in b && b.outputDegree != 1)
        val = Math.pow(val, b.outputDegree);

      sum += data[i][dataFields[0]] * val;
    }

    return sum - L1;
  });


  console.log('матрица B сформирована')


  const weights = await solveMatrix(A, B);
  const success = weights.every(w => Number.isFinite(w));

  const approximatedBases = structuredClone(allBases);

  if (success) Object.values(approximatedBases)
    .forEach((basis, index) => basis.weight = weights[index]);


  const metrics = {
    R2: calculateR2(data, approximatedBases, success),
    AIC: calculateAIC(data, approximatedBases, data, success),
    MSE: calculateMSE(data, approximatedBases, data, success),
  }

  return { A, B, weights, success, metrics, approximatedBases };
}



export { getApproximation }