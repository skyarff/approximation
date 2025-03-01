import { getAppLib } from './moduleLoader';

// Функция для построения матрицы с использованием C-кода
export async function buildMatrixFromPrecomputed(precomputedValues, outputValues) {
  try {
    const wasm = await getAppLib();
    
    // Проверяем входные данные
    if (!precomputedValues || !precomputedValues.length || !outputValues || !outputValues.length) {
      console.error("Некорректные входные данные для buildMatrixFromPrecomputed");
      return null;
    }
    
    const rows = precomputedValues.length;
    const cols = precomputedValues[0].length;
    
    console.log(`Преобразование предвычисленных значений в формат C (${rows}x${cols})`);
    
    // Преобразуем двумерный массив precomputedValues в набор одномерных массивов
    const precomputedPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8); // 8 байт на double
      new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols).set(precomputedValues[i]);
      precomputedPtrs.push(rowPtr);
    }
    
    // Создаем массив указателей на строки precomputedValues
    const precomputedArrayPtr = wasm._malloc(rows * 4); // 4 байта на указатель int32
    new Int32Array(wasm.HEAP32.buffer, precomputedArrayPtr, rows).set(precomputedPtrs);
    
    // Преобразуем outputValues в одномерный массив
    const outputPtr = wasm._malloc(outputValues.length * 8);
    new Float64Array(wasm.HEAPF64.buffer, outputPtr, outputValues.length).set(outputValues);
    
    console.log("Вызов C-функции build_matrix_from_precomputed");
    
    // Вызываем C-функцию для построения матрицы
    const matrixPtr = wasm._build_matrix_from_precomputed(
      precomputedArrayPtr,
      rows,
      cols,
      outputPtr,
      outputValues.length
    );
    
    if (!matrixPtr) {
      console.error("Не удалось построить матрицу");
      
      // Освобождаем выделенную память
      for (let i = 0; i < rows; i++) {
        wasm._free(precomputedPtrs[i]);
      }
      wasm._free(precomputedArrayPtr);
      wasm._free(outputPtr);
      
      return null;
    }
    
    console.log("Матрица успешно построена, преобразуем в плоский массив");
    
    // Преобразуем результат в плоский массив для solve_matrix
    const flatMatrixPtr = wasm._matrix_to_flat(matrixPtr, rows, rows + 1);
    
    // Освобождаем память, выделенную для промежуточных данных
    for (let i = 0; i < rows; i++) {
      wasm._free(precomputedPtrs[i]);
    }
    wasm._free(precomputedArrayPtr);
    wasm._free(outputPtr);
    wasm._free_matrix(matrixPtr, rows);
    
    if (!flatMatrixPtr) {
      console.error("Не удалось преобразовать матрицу в плоский массив");
      return null;
    }
    
    // Копируем результат в JavaScript
    const resultMatrix = [];
    for (let i = 0; i < rows; i++) {
      const row = [];
      for (let j = 0; j <= rows; j++) { // rows + 1 cols
        row.push(wasm.HEAPF64[(flatMatrixPtr / 8) + i * (rows + 1) + j]);
      }
      resultMatrix.push(row);
    }
    
    // Освобождаем память, выделенную для результата
    wasm._free(flatMatrixPtr);
    
    console.log("Матрица успешно преобразована");
    return resultMatrix;
    
  } catch (error) {
    console.error("Ошибка в buildMatrixFromPrecomputed:", error);
    return null;
  }
}

// Новая функция для обновления вашего computeMatrix
export async function computeMatrixWithC(precomputedValues, data) {
  console.log('Формирование матрицы (C-версия)');
  
  if (!precomputedValues || !precomputedValues.length || !data || !data.length) {
    console.error('Некорректные входные данные');
    return null;
  }
  
  // Получаем ключ выходного параметра
  const outputKey = Object.keys(data[0])[0];
  
  // Подготавливаем массив выходных значений
  const outputValues = data.map(item => item[outputKey]);
  
  // Вызываем C-функцию для построения матрицы
  return await buildMatrixFromPrecomputed(precomputedValues, outputValues);
}