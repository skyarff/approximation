#include <stdlib.h>
#include <math.h>
#include <emscripten.h>


EMSCRIPTEN_KEEPALIVE
double* solve_matrix(double* flat_matrix, int rows, int cols) {
    // Проверка входных данных
    if (!flat_matrix || rows <= 0 || cols <= 0 || cols != rows + 1) {
        return NULL;
    }
    
    // Выделяем память для решения
    double* solution = (double*)malloc(rows * sizeof(double));
    if (!solution) return NULL;

    // Создаем копию входной матрицы
    double* matrix = (double*)malloc(rows * cols * sizeof(double));
    if (!matrix) {
        free(solution);
        return NULL;
    }
    
    // Копируем данные
    for (int i = 0; i < rows * cols; i++) {
        matrix[i] = flat_matrix[i];
    }
    
    // Прямой ход метода Гаусса в стиле JavaScript-версии
    for (int i = 0; i < rows; i++) {
        // Поиск максимального элемента в столбце
        int max_row = i;
        double max_val = fabs(matrix[i * cols + i]);
        
        for (int j = i + 1; j < rows; j++) {
            double val = fabs(matrix[j * cols + i]);
            if (val > max_val) {
                max_val = val;
                max_row = j;
            }
        }
        
        // Обмен строк, если необходимо
        if (max_row != i) {
            for (int j = 0; j < cols; j++) {
                double temp = matrix[i * cols + j];
                matrix[i * cols + j] = matrix[max_row * cols + j];
                matrix[max_row * cols + j] = temp;
            }
        }
        
        // Проверка на вырожденность матрицы
        if (fabs(matrix[i * cols + i]) < 1e-308) {
            free(matrix);
            free(solution);
            return NULL;
        }
        
        // Нормализация строки
        double pivot = matrix[i * cols + i];
        for (int j = i; j < cols; j++) {
            matrix[i * cols + j] /= pivot;
        }
        
        // Исключение переменной из всех других строк
        for (int j = 0; j < rows; j++) {
            if (j != i) {
                double factor = matrix[j * cols + i];
                for (int k = i; k < cols; k++) {
                    matrix[j * cols + k] -= factor * matrix[i * cols + k];
                }
            }
        }
    }
    
    // Извлечение решения (последний столбец)
    for (int i = 0; i < rows; i++) {
        solution[i] = matrix[i * cols + (cols - 1)];
    }
    
    // Освобождаем память
    free(matrix);
    
    return solution;
}


EMSCRIPTEN_KEEPALIVE
void free_solution(double* solution) {
    if (solution) free(solution);
}