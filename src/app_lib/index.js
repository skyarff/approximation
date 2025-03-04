import { Array } from 'core-js';
import { basisFunctions } from './bases';
import WorkerPool from './workerPool';
import PrecomputedValuesWorkerPool from './preCompWorkerPool';
import { solveMatrix } from '@/app_lib_wasm/solveMatrix';
import { computeMatrixWithC } from '@/app_lib_wasm/buildMatrix';

function dataNormalization(data, normSmallValues = false, multiplicationFactor = 1) {
  if (!normSmallValues && multiplicationFactor == 1) return;
  multiplicationFactor = parseFloat(multiplicationFactor);

  const fields = Object.keys(data[0]);

  for (let i = 0; i < data.length; i++) {
    for (let field of fields) {
      if (multiplicationFactor !== 1) data[i][field] *= multiplicationFactor;
      if (normSmallValues && Math.abs(data[i][field]) < 1e-20) {
        data[i][field] = 1e-20;
      }
    }
  }
}

// Оригинальная JavaScript-версия computeMatrix
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

  const prePool = new PrecomputedValuesWorkerPool();
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

  // Используем нашу новую C-версию для построения матрицы
  console.log('Переключение на C-версию формирования матрицы');
  const outPutKey = Object.keys(data[0])[0];
  const outputData = data.map(item => ({
    [outPutKey]: item[outPutKey]
  }));

  try {
    // Используем C-версию для построения матрицы
    return await computeMatrixWithC(precomputedValues, outputData);
  } catch (error) {
    console.error('Ошибка в C-версии, возвращаемся к JavaScript:', error);

    // Резервный вариант - используем оригинальную JS-реализацию
    console.log('Формирование матрицы (JS-версия)');
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
      const results = await Promise.all(chunks.map(chunk =>
        pool.processChunk(
          precomputedValues,
          chunk.start,
          chunk.end,
          allBasesArr.length,
          outputData,
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
}

async function getApproximation({ data = [], allBases = {}, L1 = 0, L2 = 0, normSmallValues = false, multiplicationFactor = 1 } = {}) {
  console.time('approximation');

  console.log('allBasesallBases',allBases )

  dataNormalization(data, normSmallValues, multiplicationFactor);

  const allBasesArr = Object.values(allBases);

  console.time('matrix');
  const matrix = await computeMatrix(data, allBasesArr);
  console.timeEnd('matrix');

  console.log('матрица сформирована');

  for (let i = 0; i < matrix.length; i++) {
    matrix[i][i] += 2 * L2;
    matrix[i][matrix.length] -= L1;
  }

  const weights = await solveMatrix(matrix);

  const success = weights.every(w => Number.isFinite(w));



  if (success) Object.values(allBases)
    .forEach((basis, index) => basis.weight = weights[index]);

  console.timeEnd('approximation');

  return { matrix, weights, success, allBases };
}

export { getApproximation };