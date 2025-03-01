
import { solveMatrix } from '@/app_lib/matrixOperations';

import { solveLargeSystem } from '@/app_lib_wasm/solveMatrix';

import { Array } from 'core-js';
import { calculateR2, calculateAIC, calculateMSE } from './metrics';
import { basisFunctions } from './bases';
import WorkerPool from './workerPool';
import PrecomputedValuesWorkerPool from './preCompWorkerPool'



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

async function computeMatrix(data, allBasesArr) {
  console.log('Предвычисления');

  const simplifyBasisArray = (allBasesArr) => {
    return allBasesArr.map(basis => ({
      variables: basis.variables.slice(),
      functions: basis.functions.slice(),
      powers: basis.powers.slice(),
      outputFunc: basis.outputFunc,
      outputDegree: basis.outputDegree
    }));
  };

  const simplifiedBasisArr = simplifyBasisArray(allBasesArr);

  const getUniqueVariables = (basisArr) => {
    const variables = new Set();
    for (const basis of basisArr) {
      for (const variable of basis.variables) {
        variables.add(variable);
      }
    }
    return variables;
  };

  const simplifyData = (data, basisArr) => {
    const uniqueVariables = getUniqueVariables(basisArr);

    return data.map(point => {
      const result = {};
      for (const variable of uniqueVariables) {
        if (point[variable] !== undefined) {
          result[variable] = Number(point[variable]);
        }
      }
      return result;
    });
  };

  const simplifiedData = simplifyData(data, simplifiedBasisArr);

  const prePool = new PrecomputedValuesWorkerPool(basisFunctions);
  const preChunkSize = Math.ceil(allBasesArr.length / prePool.workers.length);
  const preChunks = [];

  for (let i = 0; i < allBasesArr.length; i += preChunkSize) {
    preChunks.push({
      start: i,
      end: Math.min(i + preChunkSize, allBasesArr.length)
    });
  }

  const precomputedValues = [];

  try {
    const results = await Promise.all(preChunks.map(chunk =>
      prePool.processChunk(
        simplifiedBasisArr,
        simplifiedData,
        chunk.start,
        chunk.end,
      )
    ));

    results.forEach((chunkResult, index) => {
      chunkResult.forEach((row, rowIndex) => {
        precomputedValues[preChunks[index].start + rowIndex] = row;
      });
    });

  } finally {
    prePool.terminate();
  }


  console.log('Формирование матрицы');
  const matrix = new Array(allBasesArr.length);

  const pool = new WorkerPool();
  const chunkSize = Math.ceil(allBasesArr.length / pool.workers.length);
  const chunks = [];

  for (let i = 0; i < allBasesArr.length; i += chunkSize) {
    chunks.push({
      start: i,
      end: Math.min(i + chunkSize, allBasesArr.length)
    });
  }

  try {
    const outPutKey = Object.keys(data[0])[0];
    const simplifiedData = data.map(item => ({
      [outPutKey]: item[outPutKey]
  }));
    const results = await Promise.all(chunks.map(chunk =>
      pool.processChunk(
        precomputedValues,
        chunk.start,
        chunk.end,
        allBasesArr.length,
        simplifiedData,
        outPutKey
      )
    ));

    results.forEach((result, index) => {
      const startIndex = chunks[index].start;
      result.forEach((row, rowIndex) => {
        matrix[startIndex + rowIndex] = row;
      });
    });


    return matrix;
    
  } finally {
    pool.terminate();
  }
}


async function getApproximation({ data = [], allBases = {}, L1 = 0, L2 = 0, normSmallValues = false, multiplicationFactor = 1 } = {}) {

  dataNormalization(data, normSmallValues, multiplicationFactor);

  const allBasesArr = Object.values(allBases);

  const matrix = await computeMatrix(data, allBasesArr);
  console.log('матрица сформирована')

  for (let i = 0; i < matrix.length; i++) {
    matrix[i][i] += 2 * L2;
    matrix[i][matrix.length] -= L1;
  }
    
  const weights = await solveLargeSystem(matrix);
  // const weights = await solveMatrix(matrix);
  
  const success = weights.every(w => Number.isFinite(w));

  const approximatedBases = structuredClone(allBases);

  if (success) Object.values(approximatedBases)
    .forEach((basis, index) => basis.weight = weights[index]);

  const metrics = {
    R2: calculateR2(data, approximatedBases, success),
    AIC: calculateAIC(data, approximatedBases, data, success),
    MSE: calculateMSE(data, approximatedBases, data, success),
  }

  return { matrix, weights, success, metrics, approximatedBases };
}


export { getApproximation }