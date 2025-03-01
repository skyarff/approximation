import { getAppLib } from '@/app_lib_wasm/index';

export async function solveLargeSystem(coefficientsWithConstants) {
  const wasm = await getAppLib();
  const rows = coefficientsWithConstants.length;
  const cols = coefficientsWithConstants[0].length;
  
  // Создаем плоский массив из матрицы
  // Используем long double в C, поэтому нужно использовать Float64Array
  const flatArray = new Float64Array(rows * cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      flatArray[i * cols + j] = coefficientsWithConstants[i][j];
    }
  }
  
  // Используем экспортированные функции из WASM
  // Создаем массив для хранения решения
  const solutionArray = wasm.create_solution_array(rows);
  
  // Выделяем память в WebAssembly для матрицы
  // Обратите внимание: нам нужно использовать функции из экспортов, а не _malloc
  const dataPtr = wasm.malloc(flatArray.length * 8); // 8 байт для double
  
  // Копируем данные в память WebAssembly
  const dataHeap = new Float64Array(wasm.memory.buffer, dataPtr, flatArray.length);
  dataHeap.set(flatArray);
  
  // Решаем систему
  const solutionPtr = wasm.solve_system(dataPtr, rows, cols);
  
  // Проверка на ошибку
  if (solutionPtr === 0) {
    wasm.free_array(dataPtr);
    return null; // Система не имеет единственного решения
  }
  
  // Извлекаем решение
  const solution = [];
  for (let i = 0; i < rows; i++) {
    solution.push(wasm.get_solution_value(solutionPtr, i));
  }
  
  // Освобождаем память
  wasm.free_array(solutionPtr);
  wasm.free(dataPtr);
  
  return solution;
}