#include <stdlib.h>
#include <string.h>
#include <emscripten.h>



EMSCRIPTEN_KEEPALIVE
double *build_matrix_from_precomputed(double **precomputed_values, int rows, int cols, double *output_values, int output_length)
{
    if (!precomputed_values || rows <= 0 || cols <= 0 || !output_values || output_length <= 0) return NULL;

    // Выделяем память для матрицы
    double **matrix = (double **)malloc(rows * sizeof(double *));
    if (!matrix) return NULL;

    // Выделяем память для каждой строки матрицы (rows + 1 для включения свободных членов)
    for (int i = 0; i < rows; i++) {
        matrix[i] = (double *)malloc((rows + 1) * sizeof(double));
        if (!matrix[i])
        {
            for (int j = 0; j < i; j++)
                free(matrix[j]);
            free(matrix);
            return NULL;
        }

        memset(matrix[i], 0, (rows + 1) * sizeof(double));
    }


    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < rows; j++)
        {
            double sum = 0.0;
            for (int k = 0; k < output_length; k++)
                sum += precomputed_values[i][k] * precomputed_values[j][k];

            matrix[i][j] = sum;
        }

        double sum = 0.0;
        for (int k = 0; k < output_length; k++)
            sum += precomputed_values[i][k] * output_values[k];

        matrix[i][rows] = sum;
    }

    double *flat_matrix = (double *)malloc(rows * (rows + 1) * sizeof(double));
    if (!flat_matrix)
    {
        for (int i = 0; i < rows; i++)
            free(matrix[i]);
        free(matrix);
        return NULL;
    }

    for (int i = 0; i < rows; i++)
        for (int j = 0; j < rows + 1; j++)
            flat_matrix[i * (rows + 1) + j] = matrix[i][j];


    for (int i = 0; i < rows; i++)
        free(matrix[i]);

    free(matrix);

    return flat_matrix;
}

