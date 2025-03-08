import './appLib.js';

let modulePromise = null;

export function getAppLib() {
  if (modulePromise) return modulePromise;
  
  modulePromise = new Promise((resolve, reject) => {
    window.Module = window.Module || {};
    
   
    window.Module.locateFile = function(path) {
      if (path.endsWith('.wasm')) {
        return new URL('./appLib.wasm', import.meta.url).href;
      }
      return path;
    };
    
    const originalOnRuntimeInitialized = window.Module.onRuntimeInitialized;
    window.Module.onRuntimeInitialized = function() {
      if (originalOnRuntimeInitialized) originalOnRuntimeInitialized();
      console.log('WebAssembly модуль инициализирован');
      resolve(window.Module);
    };
    
    const originalOnAbort = window.Module.onAbort;
    window.Module.onAbort = function(what) {
      if (originalOnAbort) originalOnAbort(what);
      console.error('WebAssembly ошибка:', what);
      reject(new Error(`WebAssembly модуль не удалось загрузить: ${what}`));
    };
    

    setTimeout(() => {
      if (!window.Module._malloc) {
        reject(new Error('Превышено время ожидания загрузки WebAssembly модуля'));
      }
    }, 15000);
  });
  
  return modulePromise;
}