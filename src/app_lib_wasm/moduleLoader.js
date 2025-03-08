let modulePromise = null;

export function getAppLib() {
  if (modulePromise) return modulePromise;
  
  modulePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/appLib.js';
    
    script.onload = () => {
      
      if (typeof window.createMatrixModule !== 'function')
        return reject(new Error('Функция createMatrixModule не найдена после загрузки скрипта'));
      

      const moduleInstance = window.createMatrixModule({
        locateFile: function(path) {
          return '/' + path;
        },
        onRuntimeInitialized: function() {
          resolve(moduleInstance);
        },
        print: function(text) {
          console.log('WASM stdout:', text);
        },
        printErr: function(text) {
          console.warn('WASM stderr:', text);
        },
        onAbort: function(reason) {
          const error = new Error(`WebAssembly модуль прервал выполнение: ${reason}`);
          console.error(error);
          reject(error);
        }
      });
      
      const timeoutId = setTimeout(() => {
        if (moduleInstance && moduleInstance._malloc) {
          console.log('Обнаружен загруженный модуль, но onRuntimeInitialized не вызван');
          resolve(moduleInstance);
        } else {
          reject(new Error('Таймаут инициализации WebAssembly'));
        }
      }, 30000);
      
    
      moduleInstance.then(() => {
        clearTimeout(timeoutId);
      }).catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
    };
    
    script.onerror = () => {
      reject(new Error('Не удалось загрузить скрипт appLib.js'));
    };
    
    document.body.appendChild(script);
  });
  
  return modulePromise;
}