
import { solveMatrix } from '@/app_lib/matrixOperations';


const L1 = 0.75;
const L2 = 0.75;

const data = [
  { z: 1, y: 1, x: 2 },
  { z: 4, y: 2, x: 5 },
  { z: 9, y: 3, x: 2 },
  { z: 16, y: 4, x: 9 },
  { z: 25, y: 5, x: 4 },
  { z: 36, y: 6, x: 42 },
  { z: 49, y: 7, x: 5 },
  { z: 64, y: 8, x: 1 },
  { z: 81, y: 9, x: 9 },
  { z: 100, y: 10, x: 2 }
];

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


function getPairs(n) {
  const ans = [];
  for (let i = 1; i < n; i++) {
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

    for (let t = 1; t < n; t++) {
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
        v: [1],
        p: [1]
      }
    );
  }

  return basis;
}


function dataProcessing(data, basisFunctions) {
  const basis = ['x^2', 'x'];


  const fields = Object.keys(data[0]);
  console.log(fields)


  const fullBasis = getBasis(fields.length, basis, true, true);


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
  const r2 = R2(fullBasis, weights, data);

  return { A, B, R2: r2, weights };
}

function R2(fullBasis, weights, data) {
  const fields = Object.keys(data[0]);
  
  const predicted = data.map((_, k) => {
    return fullBasis.reduce((sum, b, index) => {
      const func = basisFunctions.getFunction(b.b);
      let val = 1;
      for (let t = 0; t < b.v.length; t++) {
        val *= Math.pow(func(data[k][fields[b.v[t]]]), b.p[t]);
      }
      return sum + weights[index] * val;
    }, 0);
  });

  const mean = data.reduce((sum, val) => sum + val[fields[0]], 0) / data.length;
  const tss = data.reduce((sum, val) => sum + Math.pow(val[fields[0]] - mean, 2), 0);
  const rss = data.reduce((sum, val, i) => sum + Math.pow(val[fields[0]] - predicted[i], 2), 0);

  return 1 - (rss / tss);
}

const ans = dataProcessing(data, basisFunctions);


export { ans }