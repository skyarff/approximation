
import { solveMatrix } from '@/app_lib/matrixOperations';


const L1 = 0.75;
const L2 = 0.75;

const dataX = [

  [2, 5, 2, 9, 4, 42, 5, 1, 9, 2],
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
]

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


function getPairs(n) {
  const ans = [];
  for (let i = 0; i < n; i++) {
    let j = i + 1;
    for (; j < n; j++) {
      ans.push([i, j])
    }
  }
  return ans;
}

const basis = ['x^3', 'x^2', 'x'];

function getBasis(n, b, correlation = true, constant = true) {

  const pairs = getPairs(n);
  const basis = [];

  for (let i = 0; i < b.length; i++) {
    let base = b[i].split('^');
    const p = base.length > 1 ? base[1] : 1;

    for (let t = 0; t < n; t++) {
      basis.push(
        {
          b: base[0],
          v: [t],
          p: [p]
        }
      );
    }

    for (let k = 0; k < correlation && pairs.length; k++) {
      for (let j = 1; j < p; j++) {
        basis.push(
          {
            b: base[0],
            v: pairs[k],
            p: [p - j, j]
          }
        );
      }


    }
  }

  if (constant) {
    basis.push(
      {
        b: '1',
        v: [0],
        p: [1]
      }
    );
  }

  return basis;
}


function dataProcessing(dataX, dataY, basisFunctions) {
  const basis = ['x^2', 'x'];

  const fullBasis = getBasis(dataX.length, basis, true, true);


  let A = [];
  for (let i = 0; i < fullBasis.length; i++) {
    let row = [];
    for (let j = 0; j < fullBasis.length; j++) {

      const funcI = basisFunctions.getFunction(fullBasis[i].b);
      const funcJ = basisFunctions.getFunction(fullBasis[j].b);

      let sum = 0;
      for (let k = 0; k < dataY.length; k++) {

        let val1 = 1;
        for (let t = 0; t < fullBasis[i].v.length; t++)
          val1 *= Math.pow(funcI(dataX[fullBasis[i].v[t]][k]), fullBasis[i].p[t]);

        let val2 = 1;
        for (let t = 0; t < fullBasis[j].v.length; t++)
          val2 *= Math.pow(funcJ(dataX[fullBasis[j].v[t]][k]), fullBasis[j].p[t]);

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

    for (let i = 0; i < dataY.length; i++) {

      let val = 1;
      for (let t = 0; t < fullBasis[index].v.length; t++)
        val *= Math.pow(func(dataX[fullBasis[index].v[t]][i]), fullBasis[index].p[t]);
      sum += dataY[i] * val;
    }
    return sum - L1;
  });

  const weights = solveMatrix(A, B);
  const r2 = R2(fullBasis, weights, dataX, dataY);

  return { A, B, R2: r2, weights };
}

function R2(fullBasis, weights, dataX, dataY) {

  const predicted = dataY.map((_, k) => {
    return fullBasis.reduce((sum, b, index) => {
      const func = basisFunctions.getFunction(b.b);
      let val = 1;
      for (let t = 0; t < b.v.length; t++) {
        val *= Math.pow(func(dataX[b.v[t]][k]), b.p[t]);
      }
      return sum + weights[index] * val;
    }, 0);
  });

  const mean = dataY.reduce((sum, val) => sum + val, 0) / dataY.length;
  const tss = dataY.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const rss = dataY.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);

  return 1 - (rss / tss);
}

const ans = dataProcessing(dataX, dataY, basisFunctions);


export { ans }