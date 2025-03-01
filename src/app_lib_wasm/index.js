import wasmUrl from '../app_lib_wasm/streaming.wasm?url';

export let appLib;
try {
    const result = await WebAssembly.instantiateStreaming(
        fetch(wasmUrl), {}
    );
    appLib = result.instance.exports;
    console.log('cool!', appLib)
} catch { }



