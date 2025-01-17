
import { solveMatrix } from '@/app_lib/matrixOperations';


const L1 = 0.75;
const L2 = 0.75;


// const data = [
//   [1, 4, 9, 16, 25, 36, 49, 64, 81, 100],
//   [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
//   [2, 5, 2, 9, 4, 42, 5, 1, 9, 2],
// ]

const dataY = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];


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
      case 'exp':
        return x => Math.exp(x);
      case 'log':
        return x => Math.log(x);
      case 'abs':
        return x => Math.abs(x);
      case 'sqrt':
        return x => Math.sqrt(x);
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


function getBasis(n, b, constant = true, step) {

  const [pairs, threes] = getPairsThrees(n);
  const basis = [];

  for (let i = 0; i < b.length; i++) {

    const base = b[i].split('^');
    const p = parsePower(base[1]);

    for (let t = 1; t < n; t++) {
      basis.push(
        {
          b: base[0].substring(1),
          v: [t],
          p: [p.val * p.sign]
        }
      );
    }

    for (let k = 0; k < pairs.length && base[0][0] > 1; k++) {
      for (let j = step; j < p.val; j += step) {
        basis.push(
          {
            b: base[0].substring(1),
            v: pairs[k],
            p: [(p.val - j) * p.sign , j * p.sign]
          }
        );
      }
    }

    for (let k = 0; k < threes.length && base[0][0]; k++) {
      for (let j = step; j < p.val - 1; j += step) {
        for (let t = step; t < p.val - j; t += step) {
          basis.push(
            {
              b: base[0].substring(1),
              v: threes[k],
              p: [(p.val - j - t) * p.sign , j * p.sign, t * p.sign]
            }
          );
        }
      }

    }

  }

  if (constant) {
    basis.push(
      {
        b: '1',
        v: [1],
        p: [1]
      }
    );
  }

  return basis;
}


function dataProcessing(data, basis, L1 = 0, L2 = 0, step = 1) {

  const fields = Object.keys(data[0]);
  const fullBasis = getBasis(fields.length, basis, true, step);

  console.log('fullBasis', fullBasis)

  let A = [];
  for (let i = 0; i < fullBasis.length; i++) {
    let row = [];
    for (let j = 0; j < fullBasis.length; j++) {

      const funcI = basisFunctions.getFunction(fullBasis[i].b);
      const funcJ = basisFunctions.getFunction(fullBasis[j].b);

      let sum = 0;
      for (let k = 0; k < data.length; k++) {

        let val1 = 1;
        for (let t = 0; t < fullBasis[i].v.length; t++) 
          val1 *= Math.pow(funcI(data[k][fields[fullBasis[i].v[t]]]), fullBasis[i].p[t]);
          

        let val2 = 1;
        for (let t = 0; t < fullBasis[j].v.length; t++)
          val2 *= Math.pow(funcJ(data[k][fields[[fullBasis[j].v[t]]]]), fullBasis[j].p[t]);

        sum += val1 * val2;
      }
      row.push(sum);
    }
    A.push(row);
  }

  for (let i = 0; i < A.length; i++) {
    A[i][i] += 2 * L2;
  }

  const B = fullBasis.map((b, index) => {
    const func = basisFunctions.getFunction(b.b);
    let sum = 0;

    for (let i = 0; i < data.length; i++) {

      let val = 1;
      for (let t = 0; t < fullBasis[index].v.length; t++)
        val *= Math.pow(func(data[i][fields[fullBasis[index].v[t]]]), fullBasis[index].p[t]);
      sum += data[i][fields[0]] * val;
    }

    return sum - L1;
  });

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
      const func = basisFunctions.getFunction(b.b);
      let val = 1;
      for (let t = 0; t < b.v.length; t++) {
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