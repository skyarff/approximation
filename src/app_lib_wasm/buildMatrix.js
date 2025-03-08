import { getAppLib } from './moduleLoader';

export async function buildMatrixFromPrecomputed(precomputedValues, outputValues) {
  try {
    const wasm = await getAppLib();
    
    if (!precomputedValues || !precomputedValues.length || !outputValues || !outputValues.length) {
      console.error("Некорректные входные данные");
      return null;
    }
    
    const rows = precomputedValues.length;
    const cols = precomputedValues[0].length;

    const precomputedPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8);
      new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols).set(precomputedValues[i]);
      precomputedPtrs.push(rowPtr);
    }
    
    const precomputedArrayPtr = wasm._malloc(rows * 4);
    new Int32Array(wasm.HEAP32.buffer, precomputedArrayPtr, rows).set(precomputedPtrs);
    
    const outputPtr = wasm._malloc(outputValues.length * 8);
    new Float64Array(wasm.HEAPF64.buffer, outputPtr, outputValues.length).set(outputValues);
    
    
    const matrixPtr = wasm._build_matrix_from_precomputed(
      precomputedArrayPtr,
      rows,
      cols,
      outputPtr,
      outputValues.length
    );
    
    if (!matrixPtr) {
      console.error("Не удалось построить матрицу");
      
      for (let i = 0; i < rows; i++) wasm._free(precomputedPtrs[i]);

      wasm._free(precomputedArrayPtr);
      wasm._free(outputPtr);
      
      return null;
    }
    

    const flatMatrixPtr = wasm._matrix_to_flat(matrixPtr, rows, rows + 1);
    for (let i = 0; i < rows; i++) wasm._free(precomputedPtrs[i]);

    wasm._free(precomputedArrayPtr);
    wasm._free(outputPtr);
    wasm._free_matrix(matrixPtr, rows);
    
    if (!flatMatrixPtr) {
      console.error("Не удалось преобразовать матрицу в плоский массив");
      return null;
    }
    
    const resultMatrix = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j <= rows; j++)
        row.push(wasm.HEAPF64[(flatMatrixPtr / 8) + i * (rows + 1) + j]);

      resultMatrix.push(row);
    }
    
    wasm._free(flatMatrixPtr);
    
    return resultMatrix;
    
  } catch (error) {
      console.error("Ошибка в buildMatrixFromPrecomputed:", error);
    return null;
  }
}

export async function computeMatrixWithC(precomputedValues, data) {
  
  if (!precomputedValues || !precomputedValues.length || !data || !data.length) {
    console.error('Некорректные входные данные');
    return null;
  }
  
  const outputKey = Object.keys(data[0])[0];
  const outputValues = data.map(item => item[outputKey]);
  
  return await buildMatrixFromPrecomputed(precomputedValues, outputValues);
}