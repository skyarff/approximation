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

function getBasisName(basis) {
    let name = '';
    for (let i = 0; i < basis.functions.length; i++)
        name += `*${basis.functions[i]}(${basis.variables[i]})^${basis.powers[i]}`;
    return name.substring(1);
}

function getExtendedBases(variablesInfo, simplifiedBases, allBases, constant = true, stepPower) {

    const [pairs, threes] = simplifiedBases.length > 0 ? getPairsThrees(variablesInfo.length) : [];

    for (let i = 0; i < simplifiedBases.length; i++) {

        const splitedBasis = simplifiedBases[i].split('^')
        const basisInfo = {
            depth: splitedBasis[0][0],
            func: splitedBasis[0].substring(1),
            power: splitedBasis[1],
        }

        const powerObj = parsePower(basisInfo.power);

        for (let t = 1; t < variablesInfo.length; t++) {

            const basis = {
                weight: 1,
                functions: Array(1).fill(basisInfo.func),
                variables: [t].map((i) => variablesInfo.keys[i]),
                powers: [powerObj.val * powerObj.sign],
            }

            allBases[getBasisName(basis)] = basis;
        }

        for (let k = 0; k < pairs.length && basisInfo.depth > 1; k++) {
            for (let j = stepPower; j < powerObj.val; j += stepPower) {

                const basis = {
                    weight: 1,
                    functions: Array(2).fill(basisInfo.func),
                    variables: pairs[k].map((i) => variablesInfo.keys[i]),
                    powers: [(powerObj.val - j) * powerObj.sign, j * powerObj.sign],
                }

                allBases[getBasisName(basis)] = basis;
            }
        }

        for (let k = 0; k < threes.length && basisInfo.depth > 2; k++) {
            for (let j = stepPower; j < powerObj.val - 1; j += stepPower) {
                for (let t = stepPower; t < powerObj.val - j; t += stepPower) {

                    const basis = {
                        weight: 1,
                        functions: Array(3).fill(basisInfo.func),
                        variables: threes[k].map((i) => variablesInfo.keys[i]),
                        powers: [(powerObj.val - j - t) * powerObj.sign, j * powerObj.sign, t * powerObj.sign],
                    }

                    allBases[getBasisName(basis)] = basis;
                }
            }

        }

    }

    if (constant) {
        allBases['1'] = (
            {
                weight: 1,
                functions: Array(1).fill('1'),
                variables: [1].map((i) => variablesInfo.keys[i]),
                powers: [1]
            }
        );
    }

    return allBases;
}

export { basisFunctions, getExtendedBases, getBasisName };