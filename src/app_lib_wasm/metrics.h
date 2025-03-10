#ifndef METRICS_H
#define METRICS_H

#include <stdlib.h>

// Перечисление встроенных базисных функций
typedef enum {
    IDENTITY,
    CONSTANT_1,
    LINEAR_2X_3,
    SQRT,
    SIN,
    COS,
    TAN,
    LN,
    LG,
    ATAN,
    ASINH,
    ARCOSH,
    ABS,
    TANH,
    SINH,
    COSH,
    FRAC,
    DIRICHLET_APPROX,
    SAWTOOTH,
    SQUARE,
    TRIANGLE,
    MEANDER,
    JACOBI_SN_APPROX,
    JACOBI_CN_APPROX,
    JACOBI_DN_APPROX,
    FOURIER_EXAMPLE,
    PERIODIC_SPLINE_APPROX,
    WEIERSTRASS_APPROX,
    PERIODIC_HAT,
    MULTI_HARMONIC,
    CUSTOM_FUNCTION
} BasisFunctionType;

// Структура для представления базисной функции
typedef struct {
    int* variables;
    BasisFunctionType* functions;
    char** customFuncBodies;
    double* powers;
    int variablesCount;
    BasisFunctionType outputFunc;
    char* outputFuncBody;
    double outputDegree;
    double weight;
    double impact;
} BasisFunction;

// Функции из metrics.c
void calculatePredicted(double **data, int dataRows, int dataCols,
                        BasisFunction *bases, int basesCount,
                        int metrics, double *predictedOut);

double calculateR2(double **data, int dataRows, int dataCols,
                   BasisFunction *allBases, int basesCount,
                   int success, double *predicted);

double calculateAIC(double **data, int dataRows, int dataCols,
                    BasisFunction *allBases, int basesCount,
                    int success, double *predicted);

double calculateMSE(double **data, int dataRows, int dataCols,
                    BasisFunction *allBases, int basesCount,
                    int success, double *predicted);

#endif /* METRICS_H */