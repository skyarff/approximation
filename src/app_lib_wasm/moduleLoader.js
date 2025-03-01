// src/app_lib_wasm/moduleLoader.js
let modulePromise = null;

export function getAppLib() {
  if (modulePromise) return modulePromise;
  
  modulePromise = new Promise((resolve, reject) => {
    console.log('Начало загрузки WebAssembly модуля...');
    
    // Создаем элемент скрипта для загрузки appLib.js
    const script = document.createElement('script');
    // Используем абсолютный путь из public директории
    script.src = '/appLib.js';
    
    script.onload = () => {
      console.log('Скрипт appLib.js загружен');
      
      // Проверяем, доступна ли функция createMatrixModule
      if (typeof window.createMatrixModule !== 'function') {
        return reject(new Error('Функция createMatrixModule не найдена после загрузки скрипта'));
      }
      
      // Создаем экземпляр модуля
      const moduleInstance = window.createMatrixModule({
        locateFile: function(path) {
          // Используем абсолютный путь для всех файлов
          return '/' + path;
        },
        
        onRuntimeInitialized: function() {
          console.log('WebAssembly модуль инициализирован');
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
      
      // Защита от зависания
      const timeoutId = setTimeout(() => {
        if (moduleInstance && moduleInstance._malloc) {
          console.log('Обнаружен загруженный модуль, но onRuntimeInitialized не вызван');
          resolve(moduleInstance);
        } else {
          reject(new Error('Таймаут инициализации WebAssembly'));
        }
      }, 30000);
      
      // Обработка ошибок
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
    
    // Добавляем скрипт на страницу
    document.body.appendChild(script);
  });
  
  return modulePromise;
}