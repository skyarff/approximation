
import { solveMatrix } from '@/app_lib/matrixOperations';
import { Array } from 'core-js';
import { R2, calculateAIC, calculateMSE } from './metrics';
import { basisFunctions } from './basis';



class WorkerPool {
  constructor(size) {
    this.workers = [];
    this.tasks = [];

    for (let i = 0; i < size; i++) {
      const workerCode = `
              self.onmessage = function(e) {
                  const { precomputedValues, start, end, fullBasisLength, dataLength } = e.data;
                  
                  const result = [];
                  for (let i = start; i < end; i++) {
                      const row = new Array(fullBasisLength);
                      for (let j = 0; j < fullBasisLength; j++) {
                          let sum = 0;
                          for (let k = 0; k < dataLength; k++) {
                              sum += precomputedValues[i][k] * precomputedValues[j][k];
                          }
                          row[j] = sum;
                      }
                      result.push(row);
                  }
                  
                  self.postMessage({ result, start, end });
              }
          `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      this.workers.push(worker);
    }
  }

  async processChunk(precomputedValues, start, end, fullBasisLength, dataLength) {
    return new Promise((resolve) => {
      const worker = this.workers.find(w => !w.busy);
      if (worker) {
        worker.busy = true;
        worker.onmessage = (e) => {
          worker.busy = false;
          resolve(e.data.result);
        };
        worker.postMessage({
          precomputedValues,
          start,
          end,
          fullBasisLength,
          dataLength
        });
      }
    });
  }

  terminate() {
    this.workers.forEach(worker => worker.terminate());
  }
}



function dataNormalization(data, fields, normSV = false, k = 1) {

  if (!normSV && k === 1) return;

  for (let i = 0; i < data.length; i++) {
    for (let field of fields) {

      if (k !== 1) data[i][field] *= k

      if (normSV && Math.abs(data[i][field]) < 1e-20) {
        data[i][field] = 1e-20;
      }

    }
  }

};

async function computeA(data, fullBasis, fields) {
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
          const fieldValue = dataPoint[fields[basisElement.v[t]]];

          funcResult = Math.pow(func(fieldValue), basisElement.p[t]);
          functionCache.set(cacheKey, funcResult);
        }

        val *= funcResult;
      }

      return basisFunctions.getFunction(basisElement.outputFunc)(val);
    });
  });

  const A = new Array(fullBasis.length);

  // Создаем пул воркеров (например, 4 воркера)
  const poolSize = 4;
  const pool = new WorkerPool(poolSize);

  // Разбиваем задачу на части
  const chunkSize = Math.ceil(fullBasis.length / poolSize);
  const chunks = [];

  for (let i = 0; i < fullBasis.length; i += chunkSize) {
    chunks.push({
      start: i,
      end: Math.min(i + chunkSize, fullBasis.length)
    });
  }

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

  // Завершаем работу пула
  pool.terminate();

  return A;
}

async function dataProcessing(data, basis = {}, L1 = 0, L2 = 0, normSV = false, k = 1) {

  const fields = Object.keys(data[0]);
    console.log('k', k)
    dataNormalization(data, fields, normSV, k);
    
    const fullBasis = Object.values(basis);
    const A = await computeA(data, fullBasis, fields);  // 

  console.log('матрица A сформирована')

  for (let i = 0; i < A.length; i++) {
    A[i][i] += 2 * L2;
  }


  const B = fullBasis.map((b, index) => {

    let sum = 0;

    for (let i = 0; i < data.length; i++) {

      let val = 1;
      for (let t = 0; t < fullBasis[index].v.length; t++) {
        const func = basisFunctions.getFunction(b.b[t]);
        val *= Math.pow(func(data[i][fields[fullBasis[index].v[t]]]), fullBasis[index].p[t]);
      }

      sum += data[i][fields[0]] * val;
    }

    return basisFunctions.getFunction(b.outputFunc)(sum) - L1;

  });

  console.log('матрица сформирована')
  const weights = solveMatrix(A, B);
  const success = weights.some(w => Number.isFinite(w));
  const r2 = R2(fullBasis, weights, data, success);
  const aic = calculateAIC(fullBasis, weights, data, success);
  const mse = calculateMSE(fullBasis, weights, data);

  return { A, B, R2: r2, weights, success, AIC: aic, MSE: mse };
}



export { dataProcessing }