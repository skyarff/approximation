// src/app_lib_wasm/index.js
import './appLib.js';

let modulePromise = null;

export function getAppLib() {
  if (modulePromise) return modulePromise;
  
  modulePromise = new Promise((resolve, reject) => {
    window.Module = window.Module || {};
    
    // Функция для поиска файла .wasm
    window.Module.locateFile = function(path) {
      if (path.endsWith('.wasm')) {
        // Используем относительный путь к appLib.wasm
        return new URL('./appLib.wasm', import.meta.url).href;
      }
      return path;
    };
    
    // Обработчик завершения инициализации
    const originalOnRuntimeInitialized = window.Module.onRuntimeInitialized;
    window.Module.onRuntimeInitialized = function() {
      if (originalOnRuntimeInitialized) originalOnRuntimeInitialized();
      console.log('WebAssembly модуль инициализирован');
      resolve(window.Module);
    };
    
    // Обработчик ошибок
    const originalOnAbort = window.Module.onAbort;
    window.Module.onAbort = function(what) {
      if (originalOnAbort) originalOnAbort(what);
      console.error('WebAssembly ошибка:', what);
      reject(new Error(`WebAssembly модуль не удалось загрузить: ${what}`));
    };
    
    // Таймаут на случай, если что-то пойдет не так
    setTimeout(() => {
      if (!window.Module._malloc) {
        reject(new Error('Превышено время ожидания загрузки WebAssembly модуля'));
      }
    }, 10000);
  });
  
  return modulePromise;
}