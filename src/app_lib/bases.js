const basisFunctions = {
    getFunction: (funcKey) => {
        switch (funcKey) {
            case '1':
                return () => 1;
            case '':
                return x => x;
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

        if (basis.functions[i])
            name += ` * ${basis.functions[i]}(${basis.variables[i]})^${basis.powers[i]}`;
        else
            name += ` * ${basis.variables[i]}^${basis.powers[i]}`;
    }
        
    name = name.substring(3)

    if (basis.outputFunc) 
        name = `${basis.outputFunc}(${name})`;
    if ('outputDegree' in basis && basis.outputDegree != 1) {
        if (!basis.outputFunc) name = `(${name})`;
        name = `${name}^${basis.outputDegree}`
    }
        

    return name;

}

function getExtendedBases({keys = ['x'], extendedBases = ['1^1'], allBases = {}, constant = true, stepPower = 1} = {}) {

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