import { getAppLib } from './moduleLoader';

export async function solveMatrix(matrix) {
  console.time('wasm_matrix_solver');
  try {
    const wasm = await getAppLib();
    if (!matrix || !matrix.length) return null;

    const rows = matrix.length;
    const cols = matrix[0].length;

    if (cols !== rows + 1) {
      console.error(`Неверная размерность матрицы: ${rows}x${cols}`);
      return null;
    }

    const flatArray = new Float64Array(rows * cols);
    let index = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        flatArray[index++] = matrix[i][j];
      }
    }

    const dataPtr = wasm._malloc(flatArray.byteLength);
    new Float64Array(wasm.HEAPF64.buffer, dataPtr, flatArray.length).set(flatArray);


    const solutionPtr = wasm._solve_matrix(dataPtr, rows, cols)
      
    wasm._free(dataPtr);

    if (!solutionPtr) {
      console.warn("Не удалось решить матрицу (возможно вырожденная матрица)");
      return null;
    }

    const solution = [];
    for (let i = 0; i < rows; i++) {
      solution.push(wasm.HEAPF64[(solutionPtr / 8) + i]);
    }

    return solution;
  } catch (error) {
    console.error("Ошибка при решении матрицы:", error);
    return null;
  } finally {
    console.timeEnd('wasm_matrix_solver');
  }
}