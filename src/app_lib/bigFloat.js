class ExtFloat {
    constructor(m, e = 0n) {
        this.m = BigInt(m);
        this.e = BigInt(e);
        this.norm();
    }

    norm() {
        if (this.m === 0n) {
            this.e = 0n;
            return this;
        }
        while (this.m % 10n === 0n) {
            this.m /= 10n;
            this.e += 1n;
        }
        return this;
    }

    static fromNum(n) {
        if (n === 0) return new ExtFloat(0n);
        let [m, e] = n.toExponential().split('e');
        m = m.replace('.', '');
        return new ExtFloat(BigInt(m), BigInt(e) - BigInt(m.length) + 1n);
    }

    static fromStr(s) {
        if (s.includes('e') || s.includes('E')) {
            let [n, e] = s.toLowerCase().split('e');
            n = n.replace('.', '');
            let d = n.indexOf('.') !== -1 ? n.length - n.indexOf('.') - 1 : 0;
            return new ExtFloat(BigInt(n.replace('.', '')), BigInt(e) - BigInt(d));
        }
        let [i, f = ''] = s.split('.');
        return new ExtFloat(BigInt(i + f), -BigInt(f.length));
    }

    mul(o) {
        o = o instanceof ExtFloat ? o : ExtFloat.fromNum(o);
        return new ExtFloat(this.m * o.m, this.e + o.e);
    }

    div(o) {
        o = o instanceof ExtFloat ? o : ExtFloat.fromNum(o);
        if (o.m === 0n) throw new Error('Division by zero');
        let m = this.m * (10n ** 40n);
        return new ExtFloat(m / o.m, this.e - o.e - 40n);
    }

    add(o) {
        o = o instanceof ExtFloat ? o : ExtFloat.fromNum(o);
        let d = this.e - o.e;
        let m1, m2;
        if (d > 0) {
            m1 = this.m * (10n ** d);
            m2 = o.m;
        } else {
            m1 = this.m;
            m2 = o.m * (10n ** (-d));
        }
        return new ExtFloat(m1 + m2, d > 0n ? o.e : this.e);
    }

    sub(o) {
        o = o instanceof ExtFloat ? o : ExtFloat.fromNum(o);
        return this.add(new ExtFloat(-o.m, o.e));
    }

    pow(n) {
        if (typeof n === 'number' || typeof n === 'bigint') {
            return new ExtFloat(this.m ** BigInt(n), this.e * BigInt(n));
        }
        // Для нецелых степеней используем приближение через e^(ln(x)*n)
        return this.log().mul(n).exp();
    }

    log() {
        // Приближенное вычисление натурального логарифма
        let str = this.toString();
        let [coef, exp] = str.split('e');
        let logCoef = Math.log(parseFloat(coef));
        let logExp = parseInt(exp) * Math.log(10);
        return ExtFloat.fromNum(logCoef + logExp);
    }

    exp() {
        // Приближенное вычисление e^x
        let num = parseFloat(this.toString());
        return ExtFloat.fromNum(Math.exp(num));
    }

    sqrt() {
        return this.pow(0.5);
    }

    sin() {
        return ExtFloat.fromNum(Math.sin(parseFloat(this.toString())));
    }

    cos() {
        return ExtFloat.fromNum(Math.cos(parseFloat(this.toString())));
    }

    toString() {
        if (this.m === 0n) return "0";
        let sign = this.m < 0n ? "-" : "";
        let abs = this.m < 0n ? -this.m : this.m;
        let str = abs.toString();
        let exp = Number(this.e) + str.length - 1;
        let res = str[0];
        if (str.length > 1) res += "." + str.slice(1);
        res += "e" + exp;
        return sign + res;
    }
}


const x = ExtFloat.fromStr("1.234e+1000");
const y = ExtFloat.fromStr("2");

console.log("x:", x.toString());
console.log("x^2:", x.pow(2).toString());
console.log("sqrt(x):", x.sqrt().toString());
console.log("ln(x):", x.log().toString());
console.log("sin(y):", y.sin().toString());