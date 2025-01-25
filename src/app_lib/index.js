
import { solveMatrix } from '@/app_lib/matrixOperations';
import { Array } from 'core-js';
import { R2, calculateAIC, calculateMSE } from './metrics';
import { basisFunctions } from './basis';
import WorkerPool from './workerPool';





function dataNormalization(data, normSV = false, k = 1) {

  if (!normSV && k === 1) return;

  for (let i = 0; i < data.length; i++) {


    for (let field in data[0]) {

      if (k !== 1) data[i][field] *= k
      if (normSV && Math.abs(data[i][field]) < 1e-20) {
        data[i][field] = 1e-20;
      }

    }
  }

};

async function computeA(data, fullBasis) {
  const functionCache = new Map();

  const precomputedValues = fullBasis.map((basisElement, basisIndex) => {

    const key = `${basisElement.b.join()}_${basisIndex}`;

    return data.map((dataPoint, dataIndex) => {
      let val = 1;
      for (let t = 0; t < basisElement.v.length; t++) {
        const cacheKey = `${key}_${dataIndex}_${t}`;


        let funcResult;
        if (functionCache.has(cacheKey)) {
          funcResult = functionCache.get(cacheKey);
        } else {
          const func = basisFunctions.getFunction(basisElement.b[t]);
          const fieldValue = dataPoint[basisElement.v[t]];

          funcResult = Math.pow(func(fieldValue), basisElement.p[t]);
          functionCache.set(cacheKey, funcResult);
        }

        val *= funcResult;
      }

      return basisFunctions.getFunction(basisElement.outputFunc)(val);
    });
  });

  const A = new Array(fullBasis.length);

  // Создаем пул с оптимальным количеством воркеров
  const pool = new WorkerPool();

  // Разбиваем задачу на части в зависимости от количества воркеров
  const chunkSize = Math.ceil(fullBasis.length / pool.workers.length);
  const chunks = [];

  for (let i = 0; i < fullBasis.length; i += chunkSize) {
    chunks.push({
      start: i,
      end: Math.min(i + chunkSize, fullBasis.length)
    });
  }

  // Периодически проверяем возможность добавления воркеров
  const checkInterval = setInterval(() => pool.checkAndAdjustPool(), 5000);

  try {
    // Запускаем обработку чанков параллельно
    const results = await Promise.all(chunks.map(chunk =>
      pool.processChunk(
        precomputedValues,
        chunk.start,
        chunk.end,
        fullBasis.length,
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
    clearInterval(checkInterval);
    pool.terminate();
  }
}

async function dataProcessing(data, basis = {}, L1 = 0, L2 = 0, normSV = false, k = 1) {


  console.log('k', k)
  dataNormalization(data, normSV, k);


  const fullBasis = Object.values(basis);

  
  const A = await computeA(data, fullBasis); 
  console.log('матрица A сформирована')

  for (let i = 0; i < A.length; i++) 
    A[i][i] += 2 * L2;
  

  const fields = Object.keys(data[0]);
  const B = fullBasis.map((b, index) => {

    let sum = 0;
    for (let i = 0; i < data.length; i++) {

      let val = 1;
      for (let t = 0; t < fullBasis[index].v.length; t++) {
        const func = basisFunctions.getFunction(b.b[t]);
        val *= Math.pow(func(data[i][fullBasis[index].v[t]]), fullBasis[index].p[t]);
      }

      sum += data[i][fields[0]] * val;
    }

    return basisFunctions.getFunction(b.outputFunc)(sum) - L1;

  });


  console.log('матрица сформирована', B)


  

  const weights = solveMatrix(A, B);
  const success = weights.some(w => Number.isFinite(w));
  if (success)
    Object.keys(basis).forEach((key, index) => basis[key].w = weights[index]);
    
  console.log('basisFinal', basis)




  const metrics = {
    R2: R2(fullBasis, weights, data, success),
    AIC: calculateAIC(fullBasis, weights, data, success),
    MSE: calculateMSE(fullBasis, weights, data, success),

  }


  return { A, B, weights, success, metrics };
}



export { dataProcessing }