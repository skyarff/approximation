const precomputedWorkerCode = `

  self.onmessage = function(e) {
    let { basisElements, data, start, end, basisFunctions } = e.data;


    function deserializeObject(serialized, name = 'basisFunctions') {
        try {
            if (typeof serialized !== 'string') {
                throw new Error('Serialized input must be a string');
            }
            
            const func = new Function(\`
                \${serialized}
                return \${name};
            \`);
            
            return func();
        } catch (error) {
            console.error('Ошибка при десериализации объекта:', error);
            return null;
        }
    }


    basisFunctions = deserializeObject(basisFunctions);

    const result = [];
    
    for(let basisIndex = start; basisIndex < end; basisIndex++) {
      const basisElement = basisElements[basisIndex];
      
      const values = data.map((dataPoint) => {
        let val = 1;
        
        for (let t = 0; t < basisElement.variables.length; t++) {
          const func = basisFunctions.getFunction(basisElement.functions[t]);
          const fieldValue = dataPoint[basisElement.variables[t]];
          
          const funcResult = Math.pow(func(fieldValue), basisElement.powers[t]);
          val *= funcResult;
        }
        
        val = basisFunctions.getFunction(basisElement.outputFunc)(val);
        
        if ('outputDegree' in basisElement && basisElement.outputDegree != 1) {
          val = Math.pow(val, basisElement.outputDegree);
        }

        return val;
      });
      
      result.push(values); // Добавили эту строку
    } 
    
    self.postMessage({ result, start, end });
  } 
`;

export default class PrecomputedValuesWorkerPool {
    constructor() {
        this.maxWorkers = navigator.hardwareConcurrency || 2;
        this.optimalSize = Math.min(35, this.maxWorkers * 4);


        this.workers = [];
        this.tasks = [];

        const blob = new Blob([precomputedWorkerCode], { type: 'application/javascript' });
        for (let i = 0; i < this.optimalSize; i++) {
            this.workers.push(new Worker(URL.createObjectURL(blob)));
        }
    }

    async processChunk(basisElements, data, start, end, basisFunctions) {
        return new Promise((resolve) => {
            const worker = this.workers.find(w => !w.busy);
            if (worker) {
                worker.busy = true;
                worker.onmessage = (e) => {
                    worker.busy = false;
                    resolve(e.data.result);
                };
                worker.postMessage({
                    basisElements,
                    data,
                    start,
                    end,
                    basisFunctions
                });
            }
        });
    }

    terminate() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
    }
}