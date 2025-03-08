const basisFunctions = {
    getFunction: (funcKey) => {

        if (funcKey.startsWith('uf')) {
            return new Function('x', funcKey.split('#')[1]);
          }

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


function getPairsThrees(length) {
    const pairsThrees = [[], []];
    for (let i = 1; i < length; i++) {
        let j = i + 1;
        for (; j < length; j++) {
            pairsThrees[0].push([i, j])
            let k = j + 1;
            for (; k < length; k++) {
                pairsThrees[1].push([i, j, k])
            }
        }
    }
    return pairsThrees;
}

function parsePower(powerStr) {
    if (!powerStr) return { val: 1, sign: 1 };

    let sign = powerStr[0] === '-' ? -1 : 1;
    if (sign === -1) powerStr = powerStr.substring(1);

    if (powerStr.includes('/')) {
        const [num, den] = powerStr.split('/');
        powerStr = Number(num) / Number(den);
    } else {
        powerStr = Number(powerStr);
    }

    return { val: powerStr, sign: sign };
}

function getBasisKey(basis) {
    let name = '';
    for (let i = 0; i < basis.functions.length; i++) {
        const funcName = basis.functions[i].split('#')[0];
        if (funcName)
            name += ` * ${funcName}(${basis.variables[i]})^${basis.powers[i]}`;
        else
            name += ` * ${basis.variables[i]}^${basis.powers[i]}`;
    }

    name = name.substring(3)

    if (basis.outputFunc) {
        const outputFuncName = basis.outputFunc.split('#')[0];
        name = `${outputFuncName}(${name})`;
    }
        
    if ('outputDegree' in basis && basis.outputDegree != 1) {
        if (!basis.outputFunc) name = `(${name})`;
        name = `${name}^${basis.outputDegree}`
    }


    return name;
}

function getExtendedBases({ keys = ['x'], extendedBases = ['1^1'], allBases = {}, constant = true, stepPower = 1 } = {}) {

    stepPower = parseFloat(stepPower);

    const [pairs, threes] = extendedBases.length > 0 ? getPairsThrees(keys.length) : [];

    for (let i = 0; i < extendedBases.length; i++) {

        const funcs = extendedBases[i].split('/');

        let outputFunc = '';
        let outputDegree = 1;
        if (funcs[1]) {
            const output = funcs[1].split('^');
            outputFunc = output[0] ?? '';
            outputDegree = output[1] ?? 1
        }

        const splitedBasis = funcs[0].split('^')
        const basisInfo = {
            depth: splitedBasis[0][0],
            func: splitedBasis[0].substring(1),
            power: splitedBasis[1],
        }

        const powerObj = parsePower(basisInfo.power);

        for (let t = 1; t < keys.length; t++) {

            const basis = {
                weight: 1,
                functions: Array(1).fill(basisInfo.func),
                variables: [t].map((i) => keys[i]),
                powers: [powerObj.val * powerObj.sign],
                outputFunc,
                outputDegree
            }

            allBases[getBasisKey(basis)] = basis;
        }

        for (let k = 0; k < pairs.length && basisInfo.depth > 1; k++) {
            for (let j = stepPower; j < powerObj.val; j += stepPower) {

                const basis = {
                    weight: 1,
                    functions: Array(2).fill(basisInfo.func),
                    variables: pairs[k].map((i) => keys[i]),
                    powers: [(powerObj.val - j) * powerObj.sign, j * powerObj.sign],
                    outputFunc,
                    outputDegree
                }

                allBases[getBasisKey(basis)] = basis;
            }
        }

        for (let k = 0; k < threes.length && basisInfo.depth > 2; k++) {
            for (let j = stepPower; j < powerObj.val - 1; j += stepPower) {
                for (let t = stepPower; t < powerObj.val - j; t += stepPower) {

                    const basis = {
                        weight: 1,
                        functions: Array(3).fill(basisInfo.func),
                        variables: threes[k].map((i) => keys[i]),
                        powers: [(powerObj.val - j - t) * powerObj.sign, j * powerObj.sign, t * powerObj.sign],
                        outputFunc,
                        outputDegree
                    }

                    allBases[getBasisKey(basis)] = basis;
                }
            }

        }

    }

    if (constant) {
        allBases['1'] = (
            {
                weight: 1,
                functions: Array(1).fill('1'),
                variables: [1].map((i) => keys[i]),
                powers: [1],
                outputFunc: '',
                outputDegree: 1
            }
        );
    }

    return allBases;
}

export { basisFunctions, getExtendedBases, getBasisKey };