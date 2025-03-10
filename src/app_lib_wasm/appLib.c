#include <emscripten.h>


double* solve_matrix(double* flat_matrix, int rows, int cols);


double *build_matrix_from_precomputed(double **precomputed_values, int rows, int cols, double *output_values, int output_length);


int main() {
    return 0;
}