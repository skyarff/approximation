const precomputedWorkerCode = `
  const basisFunctions = {
    getFunction: (funcKey) => {
      switch (funcKey) {
        case '1':
          return () => 1;
        case '':
          return x => x;
        case '(2x + 3)':
          return x => 2 * x + 3;
        case 'sqrt':
          return x => Math.sqrt(x);
        case 'sin':
          return x => Math.sin(x);
        case 'cos':
          return x => Math.cos(x);
        case 'tan':
          return x => Math.tan(x);
        case 'ln':
          return x => Math.log(Math.max(Math.abs(x), 1e-20));
        case 'lg':
          return x => Math.log10(Math.max(Math.abs(x), 1e-20));
        case 'atan':
          return x => Math.atan(x);
        case 'asinh':
          return x => Math.asinh(x);
        case 'arcosh':
          return x => Math.cosh(Math.abs(x));
        case 'abs':
          return x => Math.abs(x);
        case 'tanh':
          return x => Math.tanh(x);
        case 'sinh':
          return x => Math.sinh(x);
        case 'cosh':
          return x => Math.cosh(x);
        default:
          return x => x;
      }
    }
  };

  self.onmessage = function(e) {
    const { basisElements, data, start, end } = e.data;

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

    async processChunk(basisElements, data, start, end) {
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
                });
            }
        });
    }

    terminate() {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
    }
}