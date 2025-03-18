import PrecomputedValuesWorkerPool from './preCompWorkerPool';
import { buildAndSolveMatrix } from '@/app_lib_wasm/buildAndSolveMatrix';
import { basisFunctions, serializeObject } from './bases';


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

async function computePrecomputedValues(data, allBasesArr) {
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
        serializeObject(basisFunctions)
      )
    ));

    results.forEach((chunkResult, index) => {
      chunkResult.forEach((row, rowIndex) => {
        precomputedValues[preChunks[index].start + rowIndex] = row;
      });
    });

    return precomputedValues;
  } finally {
    prePool.terminate();
  }
}


async function getApproximation({ data = [], allBases = {}, L1 = 0, L2 = 0, normSmallValues = false, multiplicationFactor = 1 } = {}) {
  console.time('approximation');

 
  dataNormalization(data, normSmallValues, multiplicationFactor);
  const allBasesArr = Object.values(allBases);

  console.time('precomputed');
  const precomputedValues = await computePrecomputedValues(data, allBasesArr);
  console.timeEnd('precomputed');
  
  const outPutKey = Object.keys(data[0])[0];
  const outputValues = data.map(item => item[outPutKey]);


  console.time('solving');
  const weights = await buildAndSolveMatrix(precomputedValues, outputValues, L1, L2);
  console.timeEnd('solving');
  
  const success = weights && weights.every(w => Number.isFinite(w));

  if (success) {
    Object.values(allBases).forEach((basis, index) => {
      basis.weight = weights[index];
    });
  }

  console.timeEnd('approximation');

  return { weights, success, allBases };
}

export { getApproximation };