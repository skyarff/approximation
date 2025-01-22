class WorkerPool {
    constructor(workerScript, initialSize = 4) {
        this.workers = [];
        this.queue = [];
        this.activeWorkers = 0;
        
        // Создаём начальный пул
        const size = Math.min(initialSize, navigator.hardwareConcurrency - 1 || initialSize);
        for (let i = 0; i < size; i++) {
            this.addWorker(workerScript);
        }
    }

    addWorker(workerScript) {
        try {
            const worker = new Worker(workerScript);
            worker.onmessage = (e) => this.handleWorkerMessage(worker, e);
            this.workers.push(worker);
            return true;
        } catch (e) {
            console.warn('Не удалось создать дополнительный воркер:', e);
            return false;
        }
    }

    handleWorkerMessage(worker, e) {
        this.activeWorkers--;
        // Если есть задачи в очереди, отправляем следующую
        if (this.queue.length > 0) {
            const nextTask = this.queue.shift();
            this.executeTask(worker, nextTask);
        }
    }

    executeTask(worker, task) {
        this.activeWorkers++;
        worker.postMessage(task);
    }

    // Отправка задачи в пул
    async processTask(task) {
        // Ищем свободный воркер
        const availableWorker = this.workers.find(w => !w.busy);
        
        if (availableWorker) {
            this.executeTask(availableWorker, task);
        } else {
            // Если все воркеры заняты и можно создать новый
            if (this.workers.length < (navigator.hardwareConcurrency - 1)) {
                if (this.addWorker()) {
                    const newWorker = this.workers[this.workers.length - 1];
                    this.executeTask(newWorker, task);
                    return;
                }
            }
            // Иначе добавляем в очередь
            this.queue.push(task);
        }
    }

    terminate() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.queue = [];
    }
}