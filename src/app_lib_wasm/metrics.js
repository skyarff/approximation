import { getAppLib } from './moduleLoader';

// Вспомогательная функция для преобразования имени функции в числовой тип
function getFunctionType(funcName) {
  if (!funcName) return 0; // IDENTITY
  
  if (funcName.startsWith('uf')) return 30; // CUSTOM_FUNCTION
  
  const functionMap = {
    '': 0,
    '1': 1,
    '(2x + 3)': 2,
    'sqrt': 3,
    'sin': 4,
    'cos': 5,
    'tan': 6,
    'ln': 7,
    'lg': 8,
    'atan': 9,
    'asinh': 10,
    'arcosh': 11,
    'abs': 12,
    'tanh': 13,
    'sinh': 14,
    'cosh': 15,
    'frac': 16,
    'dirichlet_approx': 17,
    'sawtooth': 18,
    'square': 19,
    'triangle': 20,
    'meander': 21,
    'jacobi_sn_approx': 22,
    'jacobi_cn_approx': 23,
    'jacobi_dn_approx': 24,
    'fourier_example': 25,
    'periodic_spline_approx': 26,
    'weierstrass_approx': 27,
    'periodic_hat': 28,
    'multi_harmonic': 29
  };
  
  return functionMap[funcName] !== undefined ? functionMap[funcName] : 0;
}

export async function calculatePredictedWasm(data, allBases, metrics = true) {
  console.time('wasm_calculate_predicted');
  try {
    const wasm = await getAppLib();
    
    console.log('Data length:', data.length);
    console.log('Bases count:', Object.values(allBases).length);
    
    const allBasesArr = Object.values(allBases);
    const rows = data.length;
    const fields = Object.keys(data[0]);
    const cols = fields.length;
    
    // Подготовка данных для WebAssembly
    // 1. Преобразование data в формат для WebAssembly
    const dataPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8);
      const rowView = new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols);
      for (let j = 0; j < cols; j++) {
        rowView[j] = data[i][fields[j]];
      }
      dataPtrs.push(rowPtr);
    }
    
    // Создаем указатель на массив указателей строк данных
    const dataArrayPtr = wasm._malloc(rows * 4);
    const dataArrayView = new Uint32Array(wasm.HEAPU32.buffer, dataArrayPtr, rows);
    for (let i = 0; i < rows; i++) {
      dataArrayView[i] = dataPtrs[i];
    }
    
    // 2. Подготовка базисных функций
    const basesCount = allBasesArr.length;
    
    // Подсчет общего количества переменных
    let totalVarsCount = 0;
    const varCounts = new Array(basesCount);
    for (let b = 0; b < basesCount; b++) {
      varCounts[b] = allBasesArr[b].variables.length;
      totalVarsCount += varCounts[b];
    }
    
    // Выделяем память для плоских массивов
    const varIndicesPtr = wasm._malloc(totalVarsCount * 4);
    const funcTypesPtr = wasm._malloc(totalVarsCount * 4);
    const powersPtr = wasm._malloc(totalVarsCount * 8);
    const varCountsPtr = wasm._malloc(basesCount * 4);
    const outputFuncTypesPtr = wasm._malloc(basesCount * 4);
    const outputDegreesPtr = wasm._malloc(basesCount * 8);
    const weightsPtr = wasm._malloc(basesCount * 8);
    const impactsPtr = wasm._malloc(basesCount * 8);
    
    // Заполняем массивы
    const varIndicesView = new Int32Array(wasm.HEAP32.buffer, varIndicesPtr, totalVarsCount);
    const funcTypesView = new Int32Array(wasm.HEAP32.buffer, funcTypesPtr, totalVarsCount);
    const powersView = new Float64Array(wasm.HEAPF64.buffer, powersPtr, totalVarsCount);
    const varCountsView = new Int32Array(wasm.HEAP32.buffer, varCountsPtr, basesCount);
    const outputFuncTypesView = new Int32Array(wasm.HEAP32.buffer, outputFuncTypesPtr, basesCount);
    const outputDegreesView = new Float64Array(wasm.HEAPF64.buffer, outputDegreesPtr, basesCount);
    const weightsView = new Float64Array(wasm.HEAPF64.buffer, weightsPtr, basesCount);
    const impactsView = new Float64Array(wasm.HEAPF64.buffer, impactsPtr, basesCount);
    
    let varIdx = 0;
    for (let b = 0; b < basesCount; b++) {
      const base = allBasesArr[b];
      varCountsView[b] = base.variables.length;
      outputFuncTypesView[b] = getFunctionType(base.outputFunc);
      outputDegreesView[b] = base.outputDegree || 1.0;
      weightsView[b] = base.weight;
      impactsView[b] = 0.0;
      
      for (let i = 0; i < base.variables.length; i++) {
        // Проверка на корректные индексы
        if (base.variables[i] >= cols) {
          varIndicesView[varIdx] = 0; // Безопасный индекс
        } else {
          varIndicesView[varIdx] = base.variables[i];
        }
        
        funcTypesView[varIdx] = getFunctionType(base.functions[i]);
        powersView[varIdx] = base.powers[i];
        varIdx++;
      }
    }
    
    // Выделяем память под результаты предсказаний
    const predictedPtr = wasm._malloc(rows * 8);
    
    // Вызываем функцию в WebAssembly
    wasm._calculatePredicted_simplified(
      dataArrayPtr,
      rows,
      cols,
      varIndicesPtr,
      funcTypesPtr,
      powersPtr,
      varCountsPtr,
      outputFuncTypesPtr,
      outputDegreesPtr,
      weightsPtr,
      impactsPtr,
      basesCount,
      metrics ? 1 : 0,
      predictedPtr
    );
    
    // Получаем результаты предсказаний
    const predictions = new Array(rows);
    const predictedView = new Float64Array(wasm.HEAPF64.buffer, predictedPtr, rows);
    for (let i = 0; i < rows; i++) {
      predictions[i] = predictedView[i];
    }
    
    // Если требуется, обновляем impact в объектах базисных функций
    if (metrics) {
      for (let b = 0; b < basesCount; b++) {
        allBasesArr[b].impact = impactsView[b];
      }
    }
    
    // Освобождаем память
    for (let i = 0; i < rows; i++) {
      wasm._free(dataPtrs[i]);
    }
    wasm._free(dataArrayPtr);
    wasm._free(varIndicesPtr);
    wasm._free(funcTypesPtr);
    wasm._free(powersPtr);
    wasm._free(varCountsPtr);
    wasm._free(outputFuncTypesPtr);
    wasm._free(outputDegreesPtr);
    wasm._free(weightsPtr);
    wasm._free(impactsPtr);
    wasm._free(predictedPtr);
    
    return predictions;
  } catch (error) {
    console.error('Ошибка при вычислении предсказаний:', error);
    return null;
  } finally {
    console.timeEnd('wasm_calculate_predicted');
  }
}

export async function calculateR2Wasm(data, allBases, success = true, predicted = null) {
  console.time('wasm_calculate_r2');
  if (!success) return null;
  
  try {
    const wasm = await getAppLib();
    
    // Подготовка данных и базисных функций - аналогично calculatePredictedWasm
    const allBasesArr = Object.values(allBases);
    const rows = data.length;
    const fields = Object.keys(data[0]);
    const cols = fields.length;
    
    // Преобразование data
    const dataPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8);
      const rowView = new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols);
      for (let j = 0; j < cols; j++) {
        rowView[j] = data[i][fields[j]];
      }
      dataPtrs.push(rowPtr);
    }
    
    const dataArrayPtr = wasm._malloc(rows * 4);
    const dataArrayView = new Uint32Array(wasm.HEAPU32.buffer, dataArrayPtr, rows);
    for (let i = 0; i < rows; i++) {
      dataArrayView[i] = dataPtrs[i];
    }
    
    // Подготовка плоских массивов для базисных функций
    const basesCount = allBasesArr.length;
    
    // Подсчет общего количества переменных
    let totalVarsCount = 0;
    const varCounts = new Array(basesCount);
    for (let b = 0; b < basesCount; b++) {
      varCounts[b] = allBasesArr[b].variables.length;
      totalVarsCount += varCounts[b];
    }
    
    // Выделяем память для плоских массивов
    const varIndicesPtr = wasm._malloc(totalVarsCount * 4);
    const funcTypesPtr = wasm._malloc(totalVarsCount * 4);
    const powersPtr = wasm._malloc(totalVarsCount * 8);
    const varCountsPtr = wasm._malloc(basesCount * 4);
    const outputFuncTypesPtr = wasm._malloc(basesCount * 4);
    const outputDegreesPtr = wasm._malloc(basesCount * 8);
    const weightsPtr = wasm._malloc(basesCount * 8);
    const impactsPtr = wasm._malloc(basesCount * 8);
    
    // Заполняем массивы
    const varIndicesView = new Int32Array(wasm.HEAP32.buffer, varIndicesPtr, totalVarsCount);
    const funcTypesView = new Int32Array(wasm.HEAP32.buffer, funcTypesPtr, totalVarsCount);
    const powersView = new Float64Array(wasm.HEAPF64.buffer, powersPtr, totalVarsCount);
    const varCountsView = new Int32Array(wasm.HEAP32.buffer, varCountsPtr, basesCount);
    const outputFuncTypesView = new Int32Array(wasm.HEAP32.buffer, outputFuncTypesPtr, basesCount);
    const outputDegreesView = new Float64Array(wasm.HEAPF64.buffer, outputDegreesPtr, basesCount);
    const weightsView = new Float64Array(wasm.HEAPF64.buffer, weightsPtr, basesCount);
    const impactsView = new Float64Array(wasm.HEAPF64.buffer, impactsPtr, basesCount);
    
    let varIdx = 0;
    for (let b = 0; b < basesCount; b++) {
      const base = allBasesArr[b];
      varCountsView[b] = base.variables.length;
      outputFuncTypesView[b] = getFunctionType(base.outputFunc);
      outputDegreesView[b] = base.outputDegree || 1.0;
      weightsView[b] = base.weight;
      impactsView[b] = 0.0;
      
      for (let i = 0; i < base.variables.length; i++) {
        if (base.variables[i] >= cols) {
          varIndicesView[varIdx] = 0;
        } else {
          varIndicesView[varIdx] = base.variables[i];
        }
        
        funcTypesView[varIdx] = getFunctionType(base.functions[i]);
        powersView[varIdx] = base.powers[i];
        varIdx++;
      }
    }
    
    // Если предсказания переданы, копируем их в память WebAssembly
    let predictedPtr = 0;
    if (predicted) {
      predictedPtr = wasm._malloc(rows * 8);
      const predictedView = new Float64Array(wasm.HEAPF64.buffer, predictedPtr, rows);
      for (let i = 0; i < rows; i++) {
        predictedView[i] = predicted[i];
      }
    }
    
    // Вызываем упрощенную функцию в WebAssembly, которая внутри вызовет calculateR2
    const r2Ptr = wasm._malloc(8); // выделяем память для возврата результата
    
    // Ваша C-функция должна принимать указатель на результат
    wasm._calculateR2(
      dataArrayPtr,
      rows,
      cols,
      varIndicesPtr,
      funcTypesPtr,
      powersPtr,
      varCountsPtr,
      outputFuncTypesPtr,
      outputDegreesPtr,
      weightsPtr,
      impactsPtr,
      basesCount,
      success ? 1 : 0,
      predictedPtr
    );
    
    // Получаем результат
    const r2 = wasm.HEAPF64[r2Ptr / 8];
    
    // Освобождаем память
    for (let i = 0; i < rows; i++) {
      wasm._free(dataPtrs[i]);
    }
    wasm._free(dataArrayPtr);
    wasm._free(varIndicesPtr);
    wasm._free(funcTypesPtr);
    wasm._free(powersPtr);
    wasm._free(varCountsPtr);
    wasm._free(outputFuncTypesPtr);
    wasm._free(outputDegreesPtr);
    wasm._free(weightsPtr);
    wasm._free(impactsPtr);
    
    if (predictedPtr) {
      wasm._free(predictedPtr);
    }
    wasm._free(r2Ptr);
    
    return isNaN(r2) ? null : r2;
  } catch (error) {
    console.error('Ошибка при вычислении R2:', error);
    return null;
  } finally {
    console.timeEnd('wasm_calculate_r2');
  }
}

export async function calculateAICWasm(data, allBases, success = true, predicted = null) {
  console.time('wasm_calculate_aic');
  if (!success) return null;
  
  try {
    const wasm = await getAppLib();
    
    // Подготовка данных и базисных функций - аналогично расчету R2
    const allBasesArr = Object.values(allBases);
    const rows = data.length;
    const fields = Object.keys(data[0]);
    const cols = fields.length;
    
    // Преобразование data
    const dataPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8);
      const rowView = new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols);
      for (let j = 0; j < cols; j++) {
        rowView[j] = data[i][fields[j]];
      }
      dataPtrs.push(rowPtr);
    }
    
    const dataArrayPtr = wasm._malloc(rows * 4);
    const dataArrayView = new Uint32Array(wasm.HEAPU32.buffer, dataArrayPtr, rows);
    for (let i = 0; i < rows; i++) {
      dataArrayView[i] = dataPtrs[i];
    }
    
    // Подготовка плоских массивов для базисных функций
    const basesCount = allBasesArr.length;
    
    // Подсчет общего количества переменных
    let totalVarsCount = 0;
    const varCounts = new Array(basesCount);
    for (let b = 0; b < basesCount; b++) {
      varCounts[b] = allBasesArr[b].variables.length;
      totalVarsCount += varCounts[b];
    }
    
    // Выделяем память для плоских массивов
    const varIndicesPtr = wasm._malloc(totalVarsCount * 4);
    const funcTypesPtr = wasm._malloc(totalVarsCount * 4);
    const powersPtr = wasm._malloc(totalVarsCount * 8);
    const varCountsPtr = wasm._malloc(basesCount * 4);
    const outputFuncTypesPtr = wasm._malloc(basesCount * 4);
    const outputDegreesPtr = wasm._malloc(basesCount * 8);
    const weightsPtr = wasm._malloc(basesCount * 8);
    const impactsPtr = wasm._malloc(basesCount * 8);
    
    // Заполняем массивы
    const varIndicesView = new Int32Array(wasm.HEAP32.buffer, varIndicesPtr, totalVarsCount);
    const funcTypesView = new Int32Array(wasm.HEAP32.buffer, funcTypesPtr, totalVarsCount);
    const powersView = new Float64Array(wasm.HEAPF64.buffer, powersPtr, totalVarsCount);
    const varCountsView = new Int32Array(wasm.HEAP32.buffer, varCountsPtr, basesCount);
    const outputFuncTypesView = new Int32Array(wasm.HEAP32.buffer, outputFuncTypesPtr, basesCount);
    const outputDegreesView = new Float64Array(wasm.HEAPF64.buffer, outputDegreesPtr, basesCount);
    const weightsView = new Float64Array(wasm.HEAPF64.buffer, weightsPtr, basesCount);
    const impactsView = new Float64Array(wasm.HEAPF64.buffer, impactsPtr, basesCount);
    
    let varIdx = 0;
    for (let b = 0; b < basesCount; b++) {
      const base = allBasesArr[b];
      varCountsView[b] = base.variables.length;
      outputFuncTypesView[b] = getFunctionType(base.outputFunc);
      outputDegreesView[b] = base.outputDegree || 1.0;
      weightsView[b] = base.weight;
      impactsView[b] = 0.0;
      
      for (let i = 0; i < base.variables.length; i++) {
        if (base.variables[i] >= cols) {
          varIndicesView[varIdx] = 0;
        } else {
          varIndicesView[varIdx] = base.variables[i];
        }
        
        funcTypesView[varIdx] = getFunctionType(base.functions[i]);
        powersView[varIdx] = base.powers[i];
        varIdx++;
      }
    }
    
    // Если предсказания переданы, копируем их в память WebAssembly
    let predictedPtr = 0;
    if (predicted) {
      predictedPtr = wasm._malloc(rows * 8);
      const predictedView = new Float64Array(wasm.HEAPF64.buffer, predictedPtr, rows);
      for (let i = 0; i < rows; i++) {
        predictedView[i] = predicted[i];
      }
    }
    
    // Вызываем функцию calculateAIC в WebAssembly
    const aic = wasm._calculateAIC(
      dataArrayPtr,
      rows,
      cols,
      // Здесь нужно изменить, если ваша функция calculateAIC ожидает другие параметры
      predictedPtr
    );
    
    // Освобождаем память
    for (let i = 0; i < rows; i++) {
      wasm._free(dataPtrs[i]);
    }
    wasm._free(dataArrayPtr);
    wasm._free(varIndicesPtr);
    wasm._free(funcTypesPtr);
    wasm._free(powersPtr);
    wasm._free(varCountsPtr);
    wasm._free(outputFuncTypesPtr);
    wasm._free(outputDegreesPtr);
    wasm._free(weightsPtr);
    wasm._free(impactsPtr);
    
    if (predictedPtr) {
      wasm._free(predictedPtr);
    }
    
    return isNaN(aic) ? null : aic;
  } catch (error) {
    console.error('Ошибка при вычислении AIC:', error);
    return null;
  } finally {
    console.timeEnd('wasm_calculate_aic');
  }
}

export async function calculateMSEWasm(data, allBases, success = true, predicted = null) {
  console.time('wasm_calculate_mse');
  if (!success) return null;
  
  try {
    const wasm = await getAppLib();
    
    // Подготовка данных и базисных функций - аналогично расчету R2 и AIC
    const allBasesArr = Object.values(allBases);
    const rows = data.length;
    const fields = Object.keys(data[0]);
    const cols = fields.length;
    
    // Преобразование data
    const dataPtrs = [];
    for (let i = 0; i < rows; i++) {
      const rowPtr = wasm._malloc(cols * 8);
      const rowView = new Float64Array(wasm.HEAPF64.buffer, rowPtr, cols);
      for (let j = 0; j < cols; j++) {
        rowView[j] = data[i][fields[j]];
      }
      dataPtrs.push(rowPtr);
    }
    
    const dataArrayPtr = wasm._malloc(rows * 4);
    const dataArrayView = new Uint32Array(wasm.HEAPU32.buffer, dataArrayPtr, rows);
    for (let i = 0; i < rows; i++) {
      dataArrayView[i] = dataPtrs[i];
    }
    
    // Подготовка плоских массивов для базисных функций
    const basesCount = allBasesArr.length;
    
    // Подсчет общего количества переменных
    let totalVarsCount = 0;
    const varCounts = new Array(basesCount);
    for (let b = 0; b < basesCount; b++) {
      varCounts[b] = allBasesArr[b].variables.length;
      totalVarsCount += varCounts[b];
    }
    
    // Выделяем память для плоских массивов
    const varIndicesPtr = wasm._malloc(totalVarsCount * 4);
    const funcTypesPtr = wasm._malloc(totalVarsCount * 4);
    const powersPtr = wasm._malloc(totalVarsCount * 8);
    const varCountsPtr = wasm._malloc(basesCount * 4);
    const outputFuncTypesPtr = wasm._malloc(basesCount * 4);
    const outputDegreesPtr = wasm._malloc(basesCount * 8);
    const weightsPtr = wasm._malloc(basesCount * 8);
    const impactsPtr = wasm._malloc(basesCount * 8);
    
    // Заполняем массивы
    const varIndicesView = new Int32Array(wasm.HEAP32.buffer, varIndicesPtr, totalVarsCount);
    const funcTypesView = new Int32Array(wasm.HEAP32.buffer, funcTypesPtr, totalVarsCount);
    const powersView = new Float64Array(wasm.HEAPF64.buffer, powersPtr, totalVarsCount);
    const varCountsView = new Int32Array(wasm.HEAP32.buffer, varCountsPtr, basesCount);
    const outputFuncTypesView = new Int32Array(wasm.HEAP32.buffer, outputFuncTypesPtr, basesCount);
    const outputDegreesView = new Float64Array(wasm.HEAPF64.buffer, outputDegreesPtr, basesCount);
    const weightsView = new Float64Array(wasm.HEAPF64.buffer, weightsPtr, basesCount);
    const impactsView = new Float64Array(wasm.HEAPF64.buffer, impactsPtr, basesCount);
    
    let varIdx = 0;
    for (let b = 0; b < basesCount; b++) {
      const base = allBasesArr[b];
      varCountsView[b] = base.variables.length;
      outputFuncTypesView[b] = getFunctionType(base.outputFunc);
      outputDegreesView[b] = base.outputDegree || 1.0;
      weightsView[b] = base.weight;
      impactsView[b] = 0.0;
      
      for (let i = 0; i < base.variables.length; i++) {
        if (base.variables[i] >= cols) {
          varIndicesView[varIdx] = 0;
        } else {
          varIndicesView[varIdx] = base.variables[i];
        }
        
        funcTypesView[varIdx] = getFunctionType(base.functions[i]);
        powersView[varIdx] = base.powers[i];
        varIdx++;
      }
    }
    
    // Если предсказания переданы, копируем их в память WebAssembly
    let predictedPtr = 0;
    if (predicted) {
      predictedPtr = wasm._malloc(rows * 8);
      const predictedView = new Float64Array(wasm.HEAPF64.buffer, predictedPtr, rows);
      for (let i = 0; i < rows; i++) {
        predictedView[i] = predicted[i];
      }
    }
    
    // Вызываем функцию calculateMSE в WebAssembly
    const mse = wasm._calculateMSE(
      dataArrayPtr,
      rows,
      cols,
      // Здесь нужно изменить, если ваша функция calculateMSE ожидает другие параметры
      predictedPtr
    );
    
    // Освобождаем память
    for (let i = 0; i < rows; i++) {
      wasm._free(dataPtrs[i]);
    }
    wasm._free(dataArrayPtr);
    wasm._free(varIndicesPtr);
    wasm._free(funcTypesPtr);
    wasm._free(powersPtr);
    wasm._free(varCountsPtr);
    wasm._free(outputFuncTypesPtr);
    wasm._free(outputDegreesPtr);
    wasm._free(weightsPtr);
    wasm._free(impactsPtr);
    
    if (predictedPtr) {
      wasm._free(predictedPtr);
    }
    
    return isNaN(mse) ? null : mse;
  } catch (error) {
    console.error('Ошибка при вычислении MSE:', error);
    return null;
  } finally {
    console.timeEnd('wasm_calculate_mse');
  }
}

