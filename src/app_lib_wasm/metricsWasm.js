import { getAppLib } from './moduleLoader';

// Класс для работы с WebAssembly метриками
export class MetricsWasm {
  constructor() {
    this.wasmModule = null;
    this.initialized = false;
  }

  // Инициализация модуля WebAssembly
  async initialize() {
    if (this.initialized) return;

    try {
      this.wasmModule = await getAppLib();
      this.initialized = true;
      console.log('MetricsWasm модуль загружен успешно');
    } catch (error) {
      console.error('Ошибка при загрузке MetricsWasm модуля:', error);
      throw error;
    }
  }

  // Проверка инициализации модуля
  checkInitialized() {
    if (!this.initialized) {
      throw new Error('MetricsWasm модуль не инициализирован. Вызовите initialize() перед использованием.');
    }
  }

  // Вспомогательная функция для создания C-строки в памяти WASM
  createCString(str) {
    const wasm = this.wasmModule;
    const bytes = new TextEncoder().encode(str + '\0');
    const ptr = wasm._malloc(bytes.length);
    const heapBytes = new Uint8Array(wasm.HEAPU8.buffer, ptr, bytes.length);
    heapBytes.set(bytes);
    return ptr;
  }

  // Вспомогательная функция для преобразования JavaScript массива в массив C-строк
  createCStringArray(strArray) {
    const wasm = this.wasmModule;
    const ptrs = [];
    
    for (const str of strArray) {
      ptrs.push(this.createCString(str || ''));
    }
    
    const arrayPtr = wasm._malloc(ptrs.length * 4);
    const arrayView = new Uint32Array(wasm.HEAPU32.buffer, arrayPtr, ptrs.length);
    for (let i = 0; i < ptrs.length; i++) {
      arrayView[i] = ptrs[i];
    }
    
    return { arrayPtr, ptrs, length: ptrs.length };
  }

  // Вспомогательная функция для преобразования JavaScript массива в массив C-чисел
  createDoubleArray(numArray) {
    const wasm = this.wasmModule;
    const ptr = wasm._malloc(numArray.length * 8);
    const doubleArray = new Float64Array(wasm.HEAPF64.buffer, ptr, numArray.length);
    doubleArray.set(numArray);
    return { ptr, length: numArray.length };
  }

  // Вспомогательная функция для преобразования JavaScript массива в массив C-целых чисел
  createIntArray(numArray) {
    const wasm = this.wasmModule;
    const ptr = wasm._malloc(numArray.length * 4);
    const intArray = new Int32Array(wasm.HEAP32.buffer, ptr, numArray.length);
    intArray.set(numArray);
    return { ptr, length: numArray.length };
  }

  // Вспомогательная функция для создания двумерного массива в памяти WASM
  createDoubleMatrix(matrix) {
    const wasm = this.wasmModule;
    const rows = matrix.length;
    const cols = matrix[0].length;
    
    const rowPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8);
      new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols).set(matrix[i]);
      rowPtrs.push(rowPtr);
    }
    
    const matrixPtr = wasm._malloc(rows * 4);
    const matrixView = new Uint32Array(wasm.HEAPU32.buffer, matrixPtr, rows);
    for (let i = 0; i < rows; i++) {
      matrixView[i] = rowPtrs[i];
    }
    
    return { matrixPtr, rowPtrs, rows, cols };
  }

  // Создание структуры Basis в памяти WASM
  createBasisStructure(basis) {
    const wasm = this.wasmModule;
    
    // Создание массивов variables, functions, powers
    const variables = this.createIntArray(basis.variables);
    const functions = this.createCStringArray(basis.functions);
    const powers = this.createDoubleArray(basis.powers);
    
    // Создание C-строки для outputFunc
    const outputFuncPtr = this.createCString(basis.outputFunc || '');
    
    // Создание базиса через функцию C
    const basisPtr = wasm._create_basis(
      variables.ptr,
      functions.arrayPtr,
      powers.ptr,
      outputFuncPtr,
      basis.outputDegree || 1.0,
      basis.weight || 0.0,
      basis.variables.length
    );
    
    return {
      basisPtr,
      allocatedMemory: {
        variables: variables.ptr,
        functions: { arrayPtr: functions.arrayPtr, ptrs: functions.ptrs },
        powers: powers.ptr,
        outputFunc: outputFuncPtr
      }
    };
  }

  // Освобождение памяти, выделенной для базиса
  freeBasisMemory(allocatedMemory) {
    const wasm = this.wasmModule;
    
    wasm._free(allocatedMemory.variables);
    
    // Освобождение памяти для строк функций
    for (const ptr of allocatedMemory.functions.ptrs) {
      wasm._free(ptr);
    }
    wasm._free(allocatedMemory.functions.arrayPtr);
    
    wasm._free(allocatedMemory.powers);
    wasm._free(allocatedMemory.outputFunc);
  }

  // Функция для расчета предсказанных значений
  async calculatePredicted(data, allBases, calculateMetrics = true) {
    this.checkInitialized();
    const wasm = this.wasmModule;
    
    try {
      console.time('wasm_calculate_predicted');
      
      // Преобразование данных в формат C
      const matrix = this.createDoubleMatrix(data);
      
      // Создание структур для всех базисов
      const basesArray = Object.values(allBases);
      const basisStructures = [];
      const basisPtrs = [];
      
      for (const basis of basesArray) {
        const structure = this.createBasisStructure(basis);
        basisStructures.push(structure);
        basisPtrs.push(structure.basisPtr);
      }
      
      // Создание массива указателей на базисы
      const basesArrayPtr = wasm._malloc(basisPtrs.length * 4);
      const basesArrayView = new Uint32Array(wasm.HEAPU32.buffer, basesArrayPtr, basisPtrs.length);
      for (let i = 0; i < basisPtrs.length; i++) {
        basesArrayView[i] = basisPtrs[i];
      }
      
      // Вызов функции WASM для расчета предсказанных значений
      const predictedPtr = wasm._calculate_predicted(
        matrix.matrixPtr,
        matrix.rows,
        matrix.cols,
        basesArrayPtr,
        basisPtrs.length,
        calculateMetrics ? 1 : 0
      );
      
      // Копирование результата в JavaScript массив
      const predicted = Array.from(
        new Float64Array(wasm.HEAPF64.buffer, predictedPtr, matrix.rows)
      );
      
      // Если требуется расчет метрик, обновляем значения impact в объектах базисов
      if (calculateMetrics) {
        // Обновляем значения impact для базисов в JavaScript
        // У каждого базиса есть поле impact, его значение находится в структуре C
        // В реальном приложении нужно добавить для этого специальную функцию C
      }
      
      // Освобождение памяти
      wasm._free(predictedPtr);
      wasm._free(basesArrayPtr);
      
      for (const structure of basisStructures) {
        wasm._free_basis(structure.basisPtr);
        this.freeBasisMemory(structure.allocatedMemory);
      }
      
      for (const rowPtr of matrix.rowPtrs) {
        wasm._free(rowPtr);
      }
      wasm._free(matrix.matrixPtr);
      
      return predicted;
    } catch (error) {
      console.error('Ошибка при расчете предсказанных значений:', error);
      throw error;
    } finally {
      console.timeEnd('wasm_calculate_predicted');
    }
  }

  // Функция для расчета R2
  async calculateR2(data, allBases, success = true, predicted = null) {
    this.checkInitialized();
    const wasm = this.wasmModule;
    
    if (!success) return null;
    
    try {
      console.time('wasm_calculate_r2');
      
      // Преобразование данных в формат C
      const matrix = this.createDoubleMatrix(data);
      
      // Создание структур для всех базисов
      const basesArray = Object.values(allBases);
      const basisStructures = [];
      const basisPtrs = [];
      
      for (const basis of basesArray) {
        const structure = this.createBasisStructure(basis);
        basisStructures.push(structure);
        basisPtrs.push(structure.basisPtr);
      }
      
      // Создание массива указателей на базисы
      const basesArrayPtr = wasm._malloc(basisPtrs.length * 4);
      const basesArrayView = new Uint32Array(wasm.HEAPU32.buffer, basesArrayPtr, basisPtrs.length);
      for (let i = 0; i < basisPtrs.length; i++) {
        basesArrayView[i] = basisPtrs[i];
      }
      
      // Преобразование predicted в формат C, если предоставлен
      let predictedPtr = 0;
      if (predicted) {
        const predictedArray = this.createDoubleArray(predicted);
        predictedPtr = predictedArray.ptr;
      }
      
      // Вызов функции WASM для расчета R2
      const r2 = wasm._calculate_r2(
        matrix.matrixPtr,
        matrix.rows,
        matrix.cols,
        basesArrayPtr,
        basisPtrs.length,
        success ? 1 : 0,
        predictedPtr
      );
      
      // Освобождение памяти
      if (predictedPtr) {
        wasm._free(predictedPtr);
      }
      
      wasm._free(basesArrayPtr);
      
      for (const structure of basisStructures) {
        wasm._free_basis(structure.basisPtr);
        this.freeBasisMemory(structure.allocatedMemory);
      }
      
      for (const rowPtr of matrix.rowPtrs) {
        wasm._free(rowPtr);
      }
      wasm._free(matrix.matrixPtr);
      
      return r2;
    } catch (error) {
      console.error('Ошибка при расчете R2:', error);
      throw error;
    } finally {
      console.timeEnd('wasm_calculate_r2');
    }
  }

  // Функция для расчета AIC
  async calculateAIC(data, allBases, success = true, predicted = null) {
    this.checkInitialized();
    const wasm = this.wasmModule;
    
    if (!success) return null;
    
    try {
      console.time('wasm_calculate_aic');
      
      // Преобразование данных в формат C
      const matrix = this.createDoubleMatrix(data);
      
      // Создание структур для всех базисов
      const basesArray = Object.values(allBases);
      const basisStructures = [];
      const basisPtrs = [];
      
      for (const basis of basesArray) {
        const structure = this.createBasisStructure(basis);
        basisStructures.push(structure);
        basisPtrs.push(structure.basisPtr);
      }
      
      // Создание массива указателей на базисы
      const basesArrayPtr = wasm._malloc(basisPtrs.length * 4);
      const basesArrayView = new Uint32Array(wasm.HEAPU32.buffer, basesArrayPtr, basisPtrs.length);
      for (let i = 0; i < basisPtrs.length; i++) {
        basesArrayView[i] = basisPtrs[i];
      }
      
      // Преобразование predicted в формат C, если предоставлен
      let predictedPtr = 0;
      if (predicted) {
        const predictedArray = this.createDoubleArray(predicted);
        predictedPtr = predictedArray.ptr;
      }
      
      // Вызов функции WASM для расчета AIC
      const aic = wasm._calculate_aic(
        matrix.matrixPtr,
        matrix.rows,
        matrix.cols,
        basesArrayPtr,
        basisPtrs.length,
        success ? 1 : 0,
        predictedPtr
      );
      
      // Освобождение памяти
      if (predictedPtr) {
        wasm._free(predictedPtr);
      }
      
      wasm._free(basesArrayPtr);
      
      for (const structure of basisStructures) {
        wasm._free_basis(structure.basisPtr);
        this.freeBasisMemory(structure.allocatedMemory);
      }
      
      for (const rowPtr of matrix.rowPtrs) {
        wasm._free(rowPtr);
      }
      wasm._free(matrix.matrixPtr);
      
      return aic;
    } catch (error) {
      console.error('Ошибка при расчете AIC:', error);
      throw error;
    } finally {
      console.timeEnd('wasm_calculate_aic');
    }
  }

  // Функция для расчета MSE
  async calculateMSE(data, allBases, success = true, predicted = null) {
    this.checkInitialized();
    const wasm = this.wasmModule;
    
    if (!success) return null;
    
    try {
      console.time('wasm_calculate_mse');
      
      // Преобразование данных в формат C
      const matrix = this.createDoubleMatrix(data);
      
      // Создание структур для всех базисов
      const basesArray = Object.values(allBases);
      const basisStructures = [];
      const basisPtrs = [];
      
      for (const basis of basesArray) {
        const structure = this.createBasisStructure(basis);
        basisStructures.push(structure);
        basisPtrs.push(structure.basisPtr);
      }
      
      // Создание массива указателей на базисы
      const basesArrayPtr = wasm._malloc(basisPtrs.length * 4);
      const basesArrayView = new Uint32Array(wasm.HEAPU32.buffer, basesArrayPtr, basisPtrs.length);
      for (let i = 0; i < basisPtrs.length; i++) {
        basesArrayView[i] = basisPtrs[i];
      }
      
      // Преобразование predicted в формат C, если предоставлен
      let predictedPtr = 0;
      if (predicted) {
        const predictedArray = this.createDoubleArray(predicted);
        predictedPtr = predictedArray.ptr;
      }
      
      // Вызов функции WASM для расчета MSE
      const mse = wasm._calculate_mse(
        matrix.matrixPtr,
        matrix.rows,
        matrix.cols,
        basesArrayPtr,
        basisPtrs.length,
        success ? 1 : 0,
        predictedPtr
      );
      
      // Освобождение памяти
      if (predictedPtr) {
        wasm._free(predictedPtr);
      }
      
      wasm._free(basesArrayPtr);
      
      for (const structure of basisStructures) {
        wasm._free_basis(structure.basisPtr);
        this.freeBasisMemory(structure.allocatedMemory);
      }
      
      for (const rowPtr of matrix.rowPtrs) {
        wasm._free(rowPtr);
      }
      wasm._free(matrix.matrixPtr);
      
      return mse;
    } catch (error) {
      console.error('Ошибка при расчете MSE:', error);
      throw error;
    } finally {
      console.timeEnd('wasm_calculate_mse');
    }
  }
}