#include <emscripten.h>

int add(int a, int b);
int sub(int a, int b);
int mul(int a, int b);
int divide(int a, int b);

long double my_fabsl(long double x);
void swap_rows(long double **matrix, int row1, int row2, int cols);
int find_max_row(long double **matrix, int col, int start_row, int rows);
int solve_gaussian(long double **augmented_matrix, int rows, int cols, long double *solution);
long double* solve_system(long double* flat_matrix, int rows, int cols);
long double* create_solution_array(int size);
long double get_solution_value(long double* solution, int index);
void free_array(void* array);
long double test_gauss();


int main() 
{
    return 0;
}



EMSCRIPTEN_KEEPALIVE
int sumOfNInts(int n)
{
    // return n * (n + 1) / 2;
    return divide(mul(n, add(n, 1)), 2);
}

