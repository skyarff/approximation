#include <stdlib.h>
#include <stdio.h>
#include <math.h>
#include <emscripten.h>

// Функция для обмена двух строк матрицы
void swap_rows(long double **matrix, int row1, int row2, int cols) {
    for (int i = 0; i < cols; i++) {
        long double temp = matrix[row1][i];
        matrix[row1][i] = matrix[row2][i];
        matrix[row2][i] = temp;
    }
}

// Функция для поиска максимального элемента в столбце для частичного выбора ведущего элемента
int find_max_row(long double **matrix, int col, int start_row, int rows) {
    int max_row = start_row;
    long double max_val = fabsl(matrix[start_row][col]);
    
    for (int i = start_row + 1; i < rows; i++) {
        if (fabsl(matrix[i][col]) > max_val) {
            max_val = fabsl(matrix[i][col]);
            max_row = i;
        }
    }
    
    return max_row;
}

/**
 * Решает систему линейных уравнений методом Гаусса
 * 
 * @param augmented_matrix Расширенная матрица системы (коэффициенты + свободные члены)
 * @param rows Количество строк (уравнений)
 * @param cols Количество столбцов (переменных + 1 для свободных членов)
 * @param solution Массив для хранения решения (должен быть размером rows)
 * @return 1 если решение найдено, 0 если система несовместна или имеет бесконечно много решений
 */
int solve_gaussian(long double **augmented_matrix, int rows, int cols, long double *solution) {
    // Прямой ход метода Гаусса (приведение к треугольному виду)
    for (int i = 0; i < rows; i++) {
        // Частичный выбор ведущего элемента
        int max_row = find_max_row(augmented_matrix, i, i, rows);
        if (max_row != i) {
            swap_rows(augmented_matrix, i, max_row, cols);
        }
        
        // Если ведущий элемент слишком мал, считаем его нулем
        if (fabsl(augmented_matrix[i][i]) < 1e-10L) {
            return 0; // Система либо несовместна, либо имеет бесконечно много решений
        }
        
        // Нормализация строки i
        long double pivot = augmented_matrix[i][i];
        for (int j = i; j < cols; j++) {
            augmented_matrix[i][j] /= pivot;
        }
        
        // Обнуление элементов ниже ведущего элемента
        for (int k = i + 1; k < rows; k++) {
            long double factor = augmented_matrix[k][i];
            for (int j = i; j < cols; j++) {
                augmented_matrix[k][j] -= factor * augmented_matrix[i][j];
            }
        }
    }
    
    // Обратный ход (решение системы с треугольной матрицей)
    for (int i = rows - 1; i >= 0; i--) {
        solution[i] = augmented_matrix[i][cols - 1]; // Свободный член
        for (int j = i + 1; j < rows; j++) {
            solution[i] -= augmented_matrix[i][j] * solution[j];
        }
    }
    
    return 1; // Решение найдено
}

/**
 * Экспортируемая функция для решения системы линейных уравнений
 * Принимает расширенную матрицу (коэффициенты + свободные члены)
 *
 * @param flat_matrix Одномерный массив, представляющий расширенную матрицу по строкам
 * @param rows Количество строк (уравнений)
 * @param cols Количество столбцов (переменных + 1 для свободных членов)
 * @return Указатель на массив с решением или NULL, если решение не найдено
 */
EMSCRIPTEN_KEEPALIVE
long double* solve_system(long double* flat_matrix, int rows, int cols) {
    // Распределение памяти для решения
    long double* solution = (long double*)malloc(rows * sizeof(long double));
    if (!solution) return NULL;
    
    // Создание двумерного представления матрицы для удобства работы
    long double** matrix = (long double**)malloc(rows * sizeof(long double*));
    if (!matrix) {
        free(solution);
        return NULL;
    }
    
    for (int i = 0; i < rows; i++) {
        matrix[i] = &flat_matrix[i * cols];
    }
    
    // Решение системы
    int result = solve_gaussian(matrix, rows, cols, solution);
    
    // Освобождение памяти матрицы
    free(matrix);
    
    // Возвращаем решение или NULL, если решение не найдено
    if (result) {
        return solution;
    } else {
        free(solution);
        return NULL;
    }
}

/**
 * Создает новый массив для хранения решения системы
 *
 * @param size Размер массива (количество переменных)
 * @return Указатель на созданный массив
 */
EMSCRIPTEN_KEEPALIVE
long double* create_solution_array(int size) {
    return (long double*)malloc(size * sizeof(long double));
}

/**
 * Получает значение из массива решения
 *
 * @param solution Массив с решением
 * @param index Индекс переменной
 * @return Значение переменной
 */
EMSCRIPTEN_KEEPALIVE
long double get_solution_value(long double* solution, int index) {
    return solution[index];
}

/**
 * Освобождает память, занятую массивом
 *
 * @param array Массив для освобождения
 */
EMSCRIPTEN_KEEPALIVE
void free_array(void* array) {
    free(array);
}

/**
 * Решает тестовую систему уравнений и возвращает первую переменную
 * Пример системы:
 * 2x + y + z = 5
 * 3x + 5y + 2z = 15
 * x + 3y + 7z = 25
 *
 * @return Значение первой переменной или -1 в случае ошибки
 */
EMSCRIPTEN_KEEPALIVE
long double test_gauss() {
    // Расширенная матрица системы (включает коэффициенты и свободные члены)
    long double test_matrix[3 * 4] = {
        2, 1, 1, 5,     // 2x + y + z = 5
        3, 5, 2, 15,    // 3x + 5y + 2z = 15
        1, 3, 7, 25     // x + 3y + 7z = 25
    };
    
    // Решаем систему
    long double* solution = solve_system(test_matrix, 3, 4);
    
    if (solution) {
        long double x = solution[0];
        free(solution);
        return x;
    } else {
        return -1.0L;
    }
}