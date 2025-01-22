console.log('Воркер: Я запустился!_');

// Слушаем сообщения из основного потока
self.onmessage = function (event) {
    console.log('Воркер получил:', event.data);

    // Отправляем ответ в основной поток
    self.postMessage('Привет из воркера!');

    self.close();
    setTimeout(() => {
        console.log('terminate!_!');
    }, 0)
};


// let workers = [];
// let count = 0;

// try {
//     while (true) {
//         workers.push(new Worker('worker.js'));
//         count++;
//         console.log('Создан воркер №', count);
//     }
// } catch (e) {
//     console.log('Достигнут лимит воркеров:', count);
//     // Очищаем созданные воркеры
//     workers.forEach(w => w.terminate());
// }