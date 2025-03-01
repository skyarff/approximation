#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <string.h>
#include <emscripten.h>

// Структуры для хранения предвычисленных значений
typedef struct {
    double* values;
    int length;
} PrecomputedValues;

// Функция для обработки предвычисленных значений, полученных из JS
EMSCRIPTEN_KEEPALIVE
double** build_matrix_from_precomputed(double** precomputed_values, int rows, int cols, double* output_values, int output_length) {
    if (!precomputed_values || rows <= 0 || cols <= 0 || !output_values || output_length <= 0) {
        printf("Invalid inputs to build_matrix_from_precomputed\n");
        return NULL;
    }
    
    // Выделяем память для матрицы
    double** matrix = (double**)malloc(rows * sizeof(double*));
    if (!matrix) {
        printf("Failed to allocate memory for matrix rows\n");
        return NULL;
    }
    
    // Выделяем память для каждой строки матрицы (rows + 1 для включения свободных членов)
    for (int i = 0; i < rows; i++) {
        matrix[i] = (double*)malloc((rows + 1) * sizeof(double));
        if (!matrix[i]) {
            printf("Failed to allocate memory for matrix row %d\n", i);
            // Освобождаем уже выделенную память
            for (int j = 0; j < i; j++) {
                free(matrix[j]);
            }
            free(matrix);
            return NULL;
        }
        // Инициализируем нулями
        memset(matrix[i], 0, (rows + 1) * sizeof(double));
    }
    
    // Формируем матрицу системы линейных уравнений
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < rows; j++) {
            // Заполняем элементы матрицы A (коэффициенты при неизвестных)
            double sum = 0.0;
            for (int k = 0; k < output_length; k++) {
                sum += precomputed_values[i][k] * precomputed_values[j][k];
            }
            matrix[i][j] = sum;
        }
        
        // Заполняем свободные члены (вектор b)
        double sum = 0.0;
        for (int k = 0; k < output_length; k++) {
            sum += precomputed_values[i][k] * output_values[k];
        }
        matrix[i][rows] = sum;
    }
    
    return matrix;
}

// Функция для освобождения памяти матрицы
EMSCRIPTEN_KEEPALIVE
void free_matrix(double** matrix, int rows) {
    if (!matrix) return;
    
    for (int i = 0; i < rows; i++) {
        if (matrix[i]) {
            free(matrix[i]);
        }
    }
    free(matrix);
}

// Функция для преобразования матрицы в плоский массив для передачи в solve_matrix
EMSCRIPTEN_KEEPALIVE
double* matrix_to_flat(double** matrix, int rows, int cols) {
    if (!matrix || rows <= 0 || cols <= 0) {
        return NULL;
    }
    
    double* flat_matrix = (double*)malloc(rows * cols * sizeof(double));
    if (!flat_matrix) {
        return NULL;
    }
    
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            flat_matrix[i * cols + j] = matrix[i][j];
        }
    }
    
    return flat_matrix;
}

// Вспомогательная функция для преобразования JS-массива в C-массив
EMSCRIPTEN_KEEPALIVE
double** js_array_to_c_array(double* flat_array, int rows, int cols) {
    if (!flat_array || rows <= 0 || cols <= 0) {
        return NULL;
    }
    
    double** result = (double**)malloc(rows * sizeof(double*));
    if (!result) {
        return NULL;
    }
    
    for (int i = 0; i < rows; i++) {
        result[i] = (double*)malloc(cols * sizeof(double));
        if (!result[i]) {
            // Освобождаем ранее выделенную память
            for (int j = 0; j < i; j++) {
                free(result[j]);
            }
            free(result);
            return NULL;
        }
        
        for (int j = 0; j < cols; j++) {
            result[i][j] = flat_array[i * cols + j];
        }
    }
    
    return result;
}