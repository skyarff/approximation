#include <emscripten.h>

// Прототипы функций
double* solve_matrix(double* flat_matrix, int rows, int cols);

// Прототипы функций из buildMatrix.c
double** build_matrix_from_precomputed(double** precomputed_values, int rows, int cols, double* output_values, int output_length);
void free_matrix(double** matrix, int rows);
double* matrix_to_flat(double** matrix, int rows, int cols);
double** js_array_to_c_array(double* flat_array, int rows, int cols);

int main() {
    return 0;
}