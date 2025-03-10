#include <emscripten.h>
#include <stdlib.h>


double* solve_matrix(double* flat_matrix, int rows, int cols);
double *build_matrix_from_precomputed(double **precomputed_values, int rows, int cols, double *output_values, int output_length);


double* build_and_solve_matrix(double **precomputed_values, int rows, int cols,
                              double *output_values, int output_length,
                              double L1, double L2) {
    

    double* flat_matrix = build_matrix_from_precomputed(precomputed_values, rows, cols,
                                                       output_values, output_length);
    
    if (!flat_matrix) return NULL;
    
    for (int i = 0; i < rows; i++) {
        flat_matrix[i * (rows + 1) + i] += 2 * L2;
        flat_matrix[i * (rows + 1) + rows] -= L1;
    }
    

    double* solution = solve_matrix(flat_matrix, rows, rows + 1);
    
    return solution;
}



int main() {
    return 0;
}