#include <stdlib.h>
#include <math.h>
#include <emscripten.h>

/**
 * Оптимизированное решение системы линейных уравнений методом Гаусса
 * Использует подход схожий с JavaScript-версией
 * 
 * @param flat_matrix Плоский массив представляющий матрицу [a11,a12,...,a1n,b1, a21,a22,...,a2n,b2, ...]
 * @param rows Количество строк (уравнений)
 * @param cols Количество столбцов (переменных + 1 для свободных членов)
 * @return Указатель на массив с решением или NULL в случае ошибки
 */
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

/**
 * Освобождает память, выделенную для решения
 */
EMSCRIPTEN_KEEPALIVE
void free_solution(double* solution) {
    if (solution) free(solution);
}

/**
 * Тестовая функция для проверки решателя
 */
EMSCRIPTEN_KEEPALIVE
int test_matrix() {
    // Пример: 2x + y + z = 5, 3x + 5y + 2z = 15, x + 3y + 7z = 25
    double test_data[] = {
        2.0, 1.0, 1.0, 5.0,
        3.0, 5.0, 2.0, 15.0,
        1.0, 3.0, 7.0, 25.0
    };
    
    double* solution = solve_matrix(test_data, 3, 4);
    if (!solution) return -1;
    
    // Проверка результата (должно быть около x=1, y=2, z=3)
    int correct = 1;
    if (fabs(solution[0] - 1.0) > 1e-10) correct = 0;
    if (fabs(solution[1] - 2.0) > 1e-10) correct = 0;
    if (fabs(solution[2] - 3.0) > 1e-10) correct = 0;
    
    free_solution(solution);
    return correct;
}

/**
 * Пустая функция main для компиляции
 */
int main() {
    return 0;
}