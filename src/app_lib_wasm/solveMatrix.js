// src/app_lib_wasm/solveMatrix.js
import { getAppLib } from './moduleLoader';

export async function solveMatrix(matrix) {
  console.time('wasm_matrix_solver');
  try {
    // Получаем WebAssembly-модуль
    console.log('Получаем WebAssembly модуль...');
    const wasm = await getAppLib();
    console.log('Модуль получен, начинаем решение матрицы');

    // Базовые проверки
    if (!matrix || !matrix.length) return null;

    const rows = matrix.length;
    const cols = matrix[0].length;

    if (cols !== rows + 1) {
      console.error(`Неверная размерность матрицы: ${rows}x${cols}`);
      return null;
    }

    // Создаем плоский массив 
    const flatArray = new Float64Array(rows * cols);
    let index = 0;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        flatArray[index++] = matrix[i][j];
      }
    }

    // Выделяем память для данных
    console.log(`Выделяем память для матрицы (${rows}x${cols})...`);
    const dataPtr = wasm._malloc(flatArray.byteLength);

    // Копируем данные в память WebAssembly
    console.log('Копируем данные...');
    new Float64Array(wasm.HEAPF64.buffer, dataPtr, flatArray.length).set(flatArray);

    console.log(`Вызываем решатель матрицы (${rows >= 4 ? 'многопоточный' : 'однопоточный'})...`);
    const solutionPtr = rows >= 4
      ? wasm._solve_matrix_mt(dataPtr, rows, cols)
      : wasm._solve_matrix(dataPtr, rows, cols);

    // Освобождаем память входных данных
    wasm._free(dataPtr);

    if (!solutionPtr) {
      console.warn("Не удалось решить матрицу (возможно вырожденная матрица)");
      return null;
    }

    // Копируем результат
    console.log('Копируем результат...');
    const solution = [];
    for (let i = 0; i < rows; i++) {
      solution.push(wasm.HEAPF64[(solutionPtr / 8) + i]);
    }

    // Освобождаем память решения
    wasm._free_solution(solutionPtr);

    console.log('Решение матрицы завершено успешно');
    return solution;
  } catch (error) {
    console.error("Ошибка при решении матрицы:", error);
    return null;
  } finally {
    console.timeEnd('wasm_matrix_solver');
  }
}