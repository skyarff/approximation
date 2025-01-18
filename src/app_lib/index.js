
import { solveMatrix } from '@/app_lib/matrixOperations';
import { Array } from 'core-js';



const basisFunctions = {
  getFunction: (basis) => {
    switch (basis) {
      case '1':
        return () => 1;
      case 'x':
        return x => x;
      case 'sin':
        return x => Math.sin(x);
      case 'cos':
        return x => Math.cos(x);
      case 'tan':
        return x => Math.tan(x);
      case 'logM':
        return x => Math.log(Math.abs(x));
      case 'exp':
        return x => Math.exp(x);
      case 'abs':
        return x => Math.abs(x);
      case 'tanh':
        return x => Math.tanh(x);
      default:
        console.log(`Неизвестная функция: ${basis}`);
    }
  }
};

function parsePower(powerStr) {
  if (!powerStr) return { val: 1, sign: 1 };

  let power = powerStr;
  let sign = power[0] === '-' ? -1 : 1;

  if (sign === -1) power = power.substring(1);

  if (power.includes('/')) {
    const [num, den] = power.split('/');
    power = Number(num) / Number(den);
  } else {
    power = Number(power);
  }

  return { val: power, sign: sign };
}


function dataNormalization (data, fields, normN = false, k = 1) {

  if (!normN && k === 1) return;

  for (let i = 0; i < data.length; i++) {
    for (let field of fields) {

      if (k !== 1) data[i][field] *= k

      if (normN && Math.abs(data[i][field]) < 1e-20) {
        data[i][field] = 1e-20;
      }

    }
  }

};


function getPairsThrees(n) {
  const ans = [[], []];
  for (let i = 1; i < n; i++) {
    let j = i + 1;
    for (; j < n; j++) {
      ans[0].push([i, j])
      let k = j + 1;
        for (; k < n; k++) {
          ans[1].push([i, j, k])
        }
    }
  }
  return ans;
}


function getBasis(n, b, basis, constant = true, step) {

  const [pairs, threes] = getPairsThrees(n);

  for (let i = 0; i < b.length; i++) {

    const base = b[i].split('^');
    const p = parsePower(base[1]);

    for (let t = 1; t < n; t++) {

      const r = {
        b: Array(1).fill(base[0].substring(1)),
        v: [t],
        p: [p.val * p.sign],
      }
    
      basis[r.b.join('') + r.v.join('') + r.p.join('')] = ({ b: r.b, v: r.v, p: r.p });
    }

    for (let k = 0; k < pairs.length && base[0][0] > 1; k++) {
      for (let j = step; j < p.val; j += step) {

        const r = {
          b: Array(2).fill(base[0].substring(1)),
          v: pairs[k],
          p: [(p.val - j) * p.sign , j * p.sign],
        }
        basis[r.b.join('') + r.v.join('') + r.p.join('')] = ({ b: r.b, v: r.v, p: r.p });

      }
    }

    for (let k = 0; k < threes.length && base[0][0] > 2; k++) {
      for (let j = step; j < p.val - 1; j += step) {
        for (let t = step; t < p.val - j; t += step) {

          const r = {
            b: Array(3).fill(base[0].substring(1)),
            v: threes[k],
            p: [(p.val - j - t) * p.sign , j * p.sign, t * p.sign],
          }
          basis[r.b.join('') + r.v.join('') + r.p.join('')] = ({ b: r.b, v: r.v, p: r.p });
        }
      }

    }

  }

  if (constant) {
    basis['111'] = (
      {
        b: Array(1).fill('1'),
        v: [1],
        p: [1]
      }
    );
  }

  console.log('basis', basis)

  return basis;
}


function computeA(data, fullBasis, fields, basisFunctions) {
  const functionCache = new Map();
  
  const precomputedValues = fullBasis.map((basisElement, basisIndex) => {
    
    const key = `${basisElement.b.join()}_${basisIndex}`;
    
    return data.map((dataPoint, dataIndex) => {
      let val = 1;
      for (let t = 0; t < basisElement.v.length; t++) {
        const cacheKey = `${key}_${dataIndex}_${t}`;

        
        let funcResult;
        if (functionCache.has(cacheKey)) {
          funcResult = functionCache.get(cacheKey);
        } else {
          const func = basisFunctions.getFunction(basisElement.b[t]);
          const fieldValue = dataPoint[fields[basisElement.v[t]]];

          funcResult = Math.pow(func(fieldValue), basisElement.p[t]);
          functionCache.set(cacheKey, funcResult);
        }
        
        val *= funcResult;
      }
      return val;
    });
  });

  const A = new Array(fullBasis.length);
  
  /////////////////
  for (let i = 0; i < fullBasis.length; i++) {
    A[i] = new Array(fullBasis.length);
    for (let j = 0; j < fullBasis.length; j++) {
      let sum = 0;
      for (let k = 0; k < data.length; k++)
        sum += precomputedValues[i][k] * precomputedValues[j][k];
      A[i][j] = sum;
    }
  }
  /////////////////
  
  return A;
}

function dataProcessing(data, b, L1 = 0, L2 = 0, step = 1, normN = false, k = 1, basis = {}) {

  const fields = Object.keys(data[0]);

  console.log('k', k)
  dataNormalization(data, fields, normN, k);

  const basisArray = getBasis(fields.length, b, basis, true, step);
  const fullBasis  = Object.values(basisArray);

  console.log('fullBasis', fullBasis)

  const A = computeA(data, fullBasis, fields, basisFunctions);

  console.log('матрица A сформирована')

  for (let i = 0; i < A.length; i++) {
    A[i][i] += 2 * L2;
  }
  

  const B = fullBasis.map((b, index) => {
    
    let sum = 0;

    for (let i = 0; i < data.length; i++) {

      let val = 1;
      for (let t = 0; t < fullBasis[index].v.length; t++) {
        const func = basisFunctions.getFunction(b.b[t]);
        val *= Math.pow(func(data[i][fields[fullBasis[index].v[t]]]), fullBasis[index].p[t]);
      }
        
      sum += data[i][fields[0]] * val;
    }

    return sum - L1;
  });

  console.log('матрица сформирована')
  const weights = solveMatrix(A, B);
  const success = weights.some(w => Number.isFinite(w));
  const r2 = R2(fullBasis, weights, data, success);
  const aic = calculateAIC(fullBasis, weights, data, success);
  const mse = calculateMSE(fullBasis, weights, data);

  return { A, B, R2: r2, weights, success, AIC: aic, MSE: mse };
}

function calculatePredicted(fullBasis, weights, data) {
  const fields = Object.keys(data[0]);
  
  return data.map((_, k) => {
    return fullBasis.reduce((sum, b, index) => {
      
      let val = 1;
      for (let t = 0; t < b.v.length; t++) {
        const func = basisFunctions.getFunction(b.b[t]);
        val *= Math.pow(func(data[k][fields[b.v[t]]]), b.p[t]);
      }
      return sum + weights[index] * val;
    }, 0);
  });
}

function R2(fullBasis, weights, data, success) {
  if (!success) return null;

  const fields = Object.keys(data[0]);
  
  const predicted = calculatePredicted(fullBasis, weights, data);

  const mean = data.reduce((sum, val) => sum + val[fields[0]], 0) / data.length;
  const tss = data.reduce((sum, val) => sum + Math.pow(val[fields[0]] - mean, 2), 0);
  const rss = data.reduce((sum, val, i) => sum + Math.pow(val[fields[0]] - predicted[i], 2), 0);

  return 1 - (rss / tss);
}

function calculateAIC(fullBasis, weights, data, success) {
  if (!success) return null;

  const fields = Object.keys(data[0]);
  const n = data.length;
  const k = fullBasis.length;
  
  const predicted = calculatePredicted(fullBasis, weights, data);
  const rss = data.reduce((sum, val, i) => sum + Math.pow(val[fields[0]] - predicted[i], 2), 0);

  const aic = n * Math.log(rss/n) + 2*k;

  return aic;
}

// MSE (Mean Squared Error) - среднеквадратическая ошибка
function calculateMSE(fullBasis, weights, data) {
  const predicted = calculatePredicted(fullBasis, weights, data);
  const fields = Object.keys(data[0]);
  const n = data.length;
  
  const squaredErrors = data.map((val, i) => 
    Math.pow(val[fields[0]] - predicted[i], 2)
  );
  
  return squaredErrors.reduce((sum, err) => sum + err, 0) / n;
}

export { dataProcessing }