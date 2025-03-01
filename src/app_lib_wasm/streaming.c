#include <emscripten.h>

int add(int a, int b);
int sub(int a, int b);
int mul(int a, int b);
int divide(int a, int b);


EMSCRIPTEN_KEEPALIVE
int sumOfNInts(int n)
{
    // return n * (n + 1) / 2;
    return divide(mul(n, add(n, 1)), 2);
}

