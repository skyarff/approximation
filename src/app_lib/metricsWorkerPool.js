const metricsWorkerCode = `
  self.onmessage = function(e) {
    const { serializedData, serializedAllBasesArr, chunkStart, chunkEnd, basisFunctions, calculateMode, calculateImpact } = e.data;
    
    const allBasesArr = JSON.parse(serializedAllBasesArr);
    const data = JSON.parse(serializedData);
    
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
        return null;
      }
    }
    
    const deserializedBasisFunctions = deserializeObject(basisFunctions);
    
    const calculatePredictedChunk = () => {
      const res = [];
      
      // Массив для хранения вкладов каждого базисного элемента
      const impacts = calculateImpact ? Array(allBasesArr.length).fill(0) : null;
      
      for (let k = chunkStart; k < chunkEnd; k++) {
        const predictedValue = allBasesArr.reduce((sum, b, bIndex) => {
          let val = 1;
          for (let t = 0; t < b.variables.length; t++) {
            const func = deserializedBasisFunctions.getFunction(b.functions[t]);
            val *= Math.pow(func(data[k][b.variables[t]]), b.powers[t]);
          }
          
          val = deserializedBasisFunctions.getFunction(b.outputFunc)(val);
          
          if ('outputDegree' in b && b.outputDegree != 1)
            val = Math.pow(val, b.outputDegree);
          
          // Считаем impact для каждого базисного элемента
          if (calculateImpact) {
            impacts[bIndex] += b.weight * val;
          }
          
          return sum + b.weight * val;
        }, 0);
        
        res.push(predictedValue);
      }
      
      return { predicted: res, impacts };
    };
    
    const calculateMetricsComponents = (predictedResult) => {
      const fields = Object.keys(data[0]);
      let sum = 0;
      let squaredErrorSum = 0;
      
      for (let i = chunkStart; i < chunkEnd; i++) {
        const actual = data[i][fields[0]];
        const error = actual - predictedResult.predicted[i - chunkStart];
        
        sum += actual;
        squaredErrorSum += error * error;
      }
      
      return { sum, squaredErrorSum, count: chunkEnd - chunkStart };
    };
    
    let result;
    
    if (calculateMode === 'predicted') {
      result = calculatePredictedChunk();
    } else if (calculateMode === 'metrics') {
      const predictedResult = calculatePredictedChunk();
      result = calculateMetricsComponents(predictedResult);
    }
    
    self.postMessage({ result, chunkStart, chunkEnd });
  }
`;

export default class MetricsWorkerPool {
  constructor() {
    this.maxWorkers = navigator.hardwareConcurrency || 2;
    this.optimalSize = Math.min(20, this.maxWorkers * 2);
    
    this.workers = [];
    const blob = new Blob([metricsWorkerCode], { type: 'application/javascript' });
    
    for (let i = 0; i < this.optimalSize; i++) {
      this.workers.push(new Worker(URL.createObjectURL(blob)));
    }
  }
  
  async processChunk(serializedData, serializedAllBasesArr, chunkStart, chunkEnd, basisFunctions, calculateMode = 'predicted', calculateImpact = false) {
    return new Promise((resolve) => {
      const worker = this.workers.find(w => !w.busy);
      if (worker) {
        worker.busy = true;
        worker.onmessage = (e) => {
          worker.busy = false;
          resolve(e.data);
        };
        
        worker.postMessage({
          serializedData,
          serializedAllBasesArr,
          chunkStart,
          chunkEnd,
          basisFunctions,
          calculateMode,
          calculateImpact
        });
      }
    });
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
  }
}