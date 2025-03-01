
import wasmUrl from './gaussian_elimination.wasm?url';


let appLibPromise = null;

function getAppLib() {
  if (appLibPromise) return appLibPromise;
  
  appLibPromise = WebAssembly.instantiateStreaming(fetch(wasmUrl), {})
    .then(result => {
      return result.instance.exports;
    })
    .catch(error => {
      console.error("Ошибка загрузки WASM:", error);
      throw error;
    });
  
  return appLibPromise;
}

getAppLib();


export { getAppLib };