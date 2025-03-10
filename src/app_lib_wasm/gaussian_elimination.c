#include <stdlib.h>
#include <math.h>
#include <emscripten.h>



EMSCRIPTEN_KEEPALIVE
double* solve_matrix(double* flat_matrix, int rows, int cols) {
    
    if (!flat_matrix || rows <= 0 || cols <= 0 || cols != rows + 1) return NULL;
    
    double* solution = (double*)malloc(rows * sizeof(double));
    if (!solution) return NULL;
    

    for (int i = 0; i < rows; i++) {
        // Поиск максимального элемента в столбце
        int max_row = i;
        double max_val = fabs(flat_matrix[i * cols + i]);
        
        for (int j = i + 1; j < rows; j++) {
            double val = fabs(flat_matrix[j * cols + i]);
            if (val > max_val) {
                max_val = val;
                max_row = j;
            }
        }
        
        // Обмен строк, если необходимо
        if (max_row != i) {
            for (int j = 0; j < cols; j++) {
                double temp = flat_matrix[i * cols + j];
                flat_matrix[i * cols + j] = flat_matrix[max_row * cols + j];
                flat_matrix[max_row * cols + j] = temp;
            }
        }

        // Нормализация строки
        double pivot = flat_matrix[i * cols + i];
        for (int j = i; j < cols; j++)
            flat_matrix[i * cols + j] /= pivot;
        
        // Исключение переменной из всех других строк
        for (int j = 0; j < rows; j++) {
            if (j != i) {
                double factor = flat_matrix[j * cols + i];
                for (int k = i; k < cols; k++) 
                    flat_matrix[j * cols + k] -= factor * flat_matrix[i * cols + k];
            }
        }
    }
    
    // Извлечение решения (последний столбц)
    for (int i = 0; i < rows; i++)
        solution[i] = flat_matrix[i * cols + (cols - 1)];
    
    // Освобождаем память
    free(flat_matrix);
    
    return solution;
}