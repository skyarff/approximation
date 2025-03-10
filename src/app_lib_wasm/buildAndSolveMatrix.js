import { getAppLib } from './moduleLoader';

export async function buildAndSolveMatrix(precomputedValues, outputValues, L1 = 0, L2 = 0) {
  console.time('wasm_combined_matrix_solver');
  try {
    const wasm = await getAppLib();
    
    const rows = precomputedValues.length;
    const cols = precomputedValues[0].length;
    

    const precomputedPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8);
      new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols).set(precomputedValues[i]);
      precomputedPtrs.push(rowPtr);
    }


    const precomputedArrayPtr = wasm._malloc(rows * 4);
    const precomputedArrayView = new Uint32Array(wasm.HEAPU32.buffer, precomputedArrayPtr, rows);
    for (let i = 0; i < rows; i++) 
        precomputedArrayView[i] = precomputedPtrs[i];
    

    const outputPtr = wasm._malloc(outputValues.length * 8);
    new Float64Array(wasm.HEAPF64.buffer, outputPtr, outputValues.length).set(outputValues);
    

    const solutionPtr = wasm._build_and_solve_matrix(
      precomputedArrayPtr,
      rows,
      cols,
      outputPtr,
      outputValues.length,
      L1,
      L2
    );
    
    
    for (let i = 0; i < rows; i++) 
        wasm._free(precomputedPtrs[i]);

    wasm._free(precomputedArrayPtr);
    wasm._free(outputPtr);
    
    if (!solutionPtr) return null;
    
    const solution = [];
    for (let i = 0; i < rows; i++) 
        solution.push(wasm.HEAPF64[(solutionPtr / 8) + i]);
    
    wasm._free(solutionPtr);
    
    return solution;

  } catch (error) {
    return null;
  } finally {
    console.timeEnd('wasm_combined_matrix_solver');
  }
}