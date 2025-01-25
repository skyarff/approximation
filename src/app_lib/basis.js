const basisFunctions = {
    getFunction: (basis) => {
        switch (basis) {
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
                return x => Math.log(Math.abs(x));
            case 'exp':
                return x => Math.exp(x);
            case 'abs':
                return x => Math.abs(x);
            case 'tanh':
                return x => Math.tanh(x);
            default:
                return x => x;
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

function getBasisName(basis, vars = []) {
    let name = '';
    for (let i = 0; i < basis.b.length; i++) 
        name += `*${basis.b[i]}(${vars.length < 1 ? basis.v[i] : vars[basis.v[i]]})^${basis.p[i]}`;
    return name.substring(1);
}

function getBasis(n, b, basis, constant = true, step, map = null) {

    const [pairs, threes] = b.length > 0 ? getPairsThrees(n) : [];

    for (let i = 0; i < b.length; i++) {

        const base = b[i].split('^');
        const p = parsePower(base[1]);

        for (let t = 1; t < n; t++) {

            const r = {
                w: 1,
                b: Array(1).fill(base[0].substring(1)),
                v: [t],
                p: [p.val * p.sign],
            }

            basis[getBasisName(r, map)] = ({ b: r.b, v: r.v, p: r.p });
        }

        for (let k = 0; k < pairs.length && base[0][0] > 1; k++) {
            for (let j = step; j < p.val; j += step) {

                const r = {
                    w: 1,
                    b: Array(2).fill(base[0].substring(1)),
                    v: pairs[k],
                    p: [(p.val - j) * p.sign, j * p.sign],
                }
                basis[getBasisName(r, map)] = ({ b: r.b, v: r.v, p: r.p });

            }
        }

        for (let k = 0; k < threes.length && base[0][0] > 2; k++) {
            for (let j = step; j < p.val - 1; j += step) {
                for (let t = step; t < p.val - j; t += step) {

                    const r = {
                        w: 1,
                        b: Array(3).fill(base[0].substring(1)),
                        v: threes[k],
                        p: [(p.val - j - t) * p.sign, j * p.sign, t * p.sign],
                    }
                    basis[getBasisName(r, map)] = ({ b: r.b, v: r.v, p: r.p });
                }
            }

        }

    }

    if (constant) {
        basis['1'] = (
            {
                w: 1,
                b: Array(1).fill('1'),
                v: [1],
                p: [1]
            }
        );
    }

    return basis;
}

export { basisFunctions, getBasis, getBasisName };