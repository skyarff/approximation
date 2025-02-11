export default class WorkerPool {
    constructor() {
        // Получаем количество логических процессоров
        this.maxWorkers = navigator.hardwareConcurrency || 2;
        // Оставляем два потока для UI
        this.optimalSize = Math.max(1, this.maxWorkers - 1);
        
        console.log('Доступно процессоров:', this.maxWorkers);
        console.log('Оптимальное количество воркеров:', this.optimalSize);
  
        this.workers = [];
        this.tasks = [];
        
        // Создаем оптимальное количество воркеров
        for (let i = 0; i < this.optimalSize; i++) {
            this.createWorker();
        }
    }
  
    createWorker() {
        const workerCode = `
            self.onmessage = function(e) {
                const { precomputedValues, start, end, fullBasisLength, dataLength } = e.data;
                
                const result = [];
                for (let i = start; i < end; i++) {
                    const row = new Array(fullBasisLength);
                    for (let j = 0; j < fullBasisLength; j++) {
                        let sum = 0;
                        for (let k = 0; k < dataLength; k++) {
                            sum += precomputedValues[i][k] * precomputedValues[j][k];
                        }
                        row[j] = sum;
                    }
                    result.push(row);
                }
                
                self.postMessage({ result, start, end });
            }
        `;
        
        try {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            this.workers.push(worker);
            return true;
        } catch (e) {
            console.error('Не удалось создать воркер:', e);
            return false;
        }
    }
  
  
    async processChunk(precomputedValues, start, end, fullBasisLength, dataLength) {
        return new Promise((resolve) => {
            const worker = this.workers.find(w => !w.busy);
            if (worker) {
                worker.busy = true;
                worker.onmessage = (e) => {
                    worker.busy = false;
                    resolve(e.data.result);
                };
                worker.postMessage({ 
                    precomputedValues, 
                    start, 
                    end, 
                    fullBasisLength, 
                    dataLength 
                });
            }
        });
    }
  
    terminate() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
    }
  }