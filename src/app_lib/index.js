
import { solveMatrix } from '@/app_lib/matrixOperations';


const L1 = 0.5;
const L2 = 0.5;

const dataX = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  [2, 5, 2, 9, 4, 42, 5, 1, 9, 2],
]


const dataY = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];





const basisFunctions = {
  getFunction: (basis) => {
    if (basis === '1') return () => 1;
    if (basis === 'x') return x => x;
    const power = parseInt(basis.split('^')[1]);
    return x => Math.pow(x, power);
  }
};

function dataProcessing(dataX, dataY, basisFunctions) {
  const basis = ['x^2', 'x'];

 
  const fullBasis = [];
  for (let i = 0; i < dataX.length; i++) {
    basis.forEach(b => {
      fullBasis.push({
        func: b,
        variable: i 
      });
    });
  }

  fullBasis.push({
    func: '1',
    variable: 0
  });

  console.log('fullBasis', fullBasis)

  let A = [];
  for (let i = 0; i < fullBasis.length; i++) {
    let row = [];
    for (let j = 0; j < fullBasis.length; j++) {
      const funcI = basisFunctions.getFunction(fullBasis[i].func);
      const funcJ = basisFunctions.getFunction(fullBasis[j].func);

      let sum = 0;
      for (let k = 0; k < dataY.length; k++) {
        const val1 = funcI(dataX[fullBasis[i].variable][k]);  // значение первой функции
        const val2 = funcJ(dataX[fullBasis[j].variable][k]);  // значение второй функции
        sum += val1 * val2;  // добавляем их произведение к сумме
      }
      row.push(sum);
    }
    A.push(row);
  }

  for (let i = 0; i < A.length; i++) {
    A[i][i] += 2 * L2;
  }


  const B = fullBasis.map(b => {
    const func = basisFunctions.getFunction(b.func);
    let sum = 0;

    for (let i = 0; i < dataY.length; i++) 
      sum += dataY[i] * func(dataX[b.variable][i]);

    return sum - L1;
  });

  return { A, B };
}

const data = dataProcessing(dataX, dataY, basisFunctions);

const ans = [solveMatrix(data.A, data.B), data]




export { ans }