import { getAppLib } from './index';


export async function solveMatrix(matrix) {
  console.time('wasm_matrix_solver');
  try {
    // Получаем WebAssembly-модуль
    const wasm = await getAppLib();

    // Базовые проверки
    if (!matrix || !matrix.length) return null;

    const rows = matrix.length;
    const cols = matrix[0].length;

    if (cols !== rows + 1) {
      console.error(`Неверная размерность матрицы: ${rows}x${cols}`);
      return null;
    }

    // Создаем плоский массив напрямую (быстрее, чем вложенные циклы)
    const flatArray = new Float64Array(rows * cols);
    let index = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        flatArray[index++] = matrix[i][j];
      }
    }


    const dataPtr = wasm.malloc(flatArray.byteLength);
    new Float64Array(wasm.memory.buffer, dataPtr, flatArray.length).set(flatArray);

    const solutionPtr = wasm.solve_matrix(dataPtr, rows, cols);
    wasm.free(dataPtr);


    if (!solutionPtr) return null;
    const resultView = new Float64Array(wasm.memory.buffer, solutionPtr, rows);
    const solution = Array.from(resultView);

    wasm.free_solution(solutionPtr);
    return solution;
  } catch (error) {
    console.error("Ошибка при решении матрицы:", error);
    return null;
  } finally {
    console.timeEnd('wasm_matrix_solver');
  }
}
