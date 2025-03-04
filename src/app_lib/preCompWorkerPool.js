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
            case 'frac':
                return x => x - Math.floor(x);
            case 'dirichlet_approx':
                return x => {
                    const tolerance = 1e-10;
                    for (let q = 1; q <= 100; q++) {
                        for (let p = 0; p <= q; p++) {
                            if (Math.abs(x - p / q) < tolerance) {
                                return 1;
                            }
                        }
                    }
                    return 0;
                };
            case 'sawtooth':
                return x => 2 * (x / (2 * Math.PI) - Math.floor(1 / 2 + x / (2 * Math.PI)));
            case 'square':
                return x => Math.sign(Math.sin(x));
            case 'triangle':
                return x => 2 * Math.abs(2 * (x / (2 * Math.PI) - Math.floor(x / (2 * Math.PI) + 1 / 2))) - 1;
            case 'meander':
                return x => Math.sign(Math.sin(x));

            case 'jacobi_sn_approx':
                return (x, k = 0.5) => Math.sin(x) / (1 + k * Math.sin(x) * Math.sin(x));
            case 'jacobi_cn_approx':
                return (x, k = 0.5) => Math.cos(x) / (1 + k * Math.sin(x) * Math.sin(x));
            case 'jacobi_dn_approx':
                return (x, k = 0.5) => 1 / (1 + k * Math.sin(x) * Math.sin(x));
                
            case 'fourier_example':
                return x => {
                    let sum = 0;
                    for (let n = 1; n <= 5; n++) {
                        sum += Math.sin(n * x) / n;
                    }
                    return sum;
                };
            case 'periodic_spline_approx':
                return x => {
                    const t = x % (2 * Math.PI);
                    if (t < Math.PI) {
                        return t * (Math.PI - t) / (Math.PI * Math.PI);
                    } else {
                        return (t - 2 * Math.PI) * (t - Math.PI) / (Math.PI * Math.PI);
                    }
                };
            case 'weierstrass_approx':
                return (x, a = 0.5, b = 3) => {
                    let sum = 0;
                    for (let n = 0; n < 50; n++) {
                        sum += Math.pow(a, n) * Math.cos(Math.pow(b, n) * Math.PI * x);
                    }
                    return sum;
                };
            case 'periodic_hat':
                return x => {
                    const tx = x % (2 * Math.PI);
                    return tx < Math.PI ? 1 - 2 * Math.abs(tx - Math.PI / 2) / Math.PI : 0;
                };
            case 'multi_harmonic':
                return x => {
                    return 0.5 * Math.sin(x) + 0.3 * Math.sin(2 * x) + 0.1 * Math.sin(3 * x);
                };
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