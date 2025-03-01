import wasmUrl from './streaming.wasm?url';

let appLibPromise = null;

function getAppLib() {
  if (appLibPromise) return appLibPromise;
  
  // Создаем объект окружения для Emscripten
  const importObject = {
    env: {
      // Минимальный набор необходимых функций
      _abort_js: function() { console.error('Abort called'); },
      emscripten_resize_heap: function() { return false; },
      emscripten_notify_memory_growth: function() {}
    },
    wasi_snapshot_preview1: {
      proc_exit: function() {},
      fd_close: function() { return 0; },
      fd_write: function() { return 0; },
      fd_seek: function() { return 0; },
      fd_read: function() { return 0; }
    }
  };
  
  appLibPromise = WebAssembly.instantiateStreaming(fetch(wasmUrl), importObject)
    .then(result => {
      // Просто возвращаем экспорты без попытки модификации
      return result.instance.exports;
    })
    .catch(error => {
      console.error("Ошибка загрузки WASM:", error);
      throw error;
    });
    
  return appLibPromise;
}

export { getAppLib };