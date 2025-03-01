#include <stdlib.h>
#include <math.h>
#include <stdio.h>
#include <emscripten.h>
#include <pthread.h>


// Получаем количество ядер через интерфейс Emscripten
EM_JS(int, get_num_cores, (), {
    const cores = Math.max(1, (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) 
                          ? navigator.hardwareConcurrency : 4);
    
    return cores;
});

// Структура для передачи данных потокам
typedef struct {
    double* matrix;
    int start_row;
    int end_row;
    int pivot_row;
    int col_idx;
    int cols;
    pthread_barrier_t* barrier;
} ThreadData;

// Функция определения оптимального количества потоков
int get_optimal_threads(int rows) {
    // Для маленьких матриц используем меньше потоков или однопоточный режим
    if (rows < 4) return 1;
    if (rows < 8) return 2;
    if (rows < 16) return 4;
    
    // Получаем количество доступных ядер
    int num_threads = get_num_cores();
    
    // Ограничиваем максимальное число потоков
    if (num_threads > 16) num_threads = 16;
    
    // Ограничиваем количество потоков, чтобы каждому досталось минимум 4 строки
    int optimal = (rows / 4 < num_threads) ? rows / 4 : num_threads;
    
    char buffer[100];
    
    return optimal;
}

// Функция потока для нормализации строк
void* normalize_rows_thread(void* arg) {
    ThreadData* data = (ThreadData*)arg;
    double* matrix = data->matrix;
    int pivot_row = data->pivot_row;
    int col_idx = data->col_idx;
    int cols = data->cols;
    
    // Получаем значение опорного элемента
    double pivot = matrix[pivot_row * cols + col_idx];
    
    // Если это строка с опорным элементом, нормализуем её
    if (data->start_row <= pivot_row && pivot_row < data->end_row) {
        for (int j = col_idx; j < cols; j++) {
            matrix[pivot_row * cols + j] /= pivot;
        }
    }
    
    // Синхронизация потоков
    int barrier_result = pthread_barrier_wait(data->barrier);
    if (barrier_result != 0 && barrier_result != PTHREAD_BARRIER_SERIAL_THREAD) {
        char buffer[100];
    }
    
    // Исключение переменной из всех других строк в этом диапазоне
    for (int i = data->start_row; i < data->end_row; i++) {
        if (i != pivot_row) {
            double factor = matrix[i * cols + col_idx];
            for (int j = col_idx; j < cols; j++) {
                matrix[i * cols + j] -= factor * matrix[pivot_row * cols + j];
            }
        }
    }
    
    return NULL;
}

// Однопоточная версия для маленьких матриц
EMSCRIPTEN_KEEPALIVE
double* solve_matrix(double* flat_matrix, int rows, int cols) {
    
    // Проверка входных данных
    if (!flat_matrix || rows <= 0 || cols <= 0 || cols != rows + 1) {
        return NULL;
    }
    
    // Выделяем память для решения
    double* solution = (double*)malloc(rows * sizeof(double));
    if (!solution) {
        return NULL;
    }
    
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
    
    // Извлечение решения (последний столбц)
    for (int i = 0; i < rows; i++) {
        solution[i] = matrix[i * cols + (cols - 1)];
    }
    
    // Освобождаем память
    free(matrix);
    
    return solution;
}

// Многопоточная версия
EMSCRIPTEN_KEEPALIVE
double* solve_matrix_mt(double* flat_matrix, int rows, int cols) {
    char buffer[100];
      
    // Проверка входных данных
    if (!flat_matrix || rows <= 0 || cols <= 0 || cols != rows + 1) {
        return NULL;
    }
    
    // Определяем оптимальное количество потоков
    int num_threads = get_optimal_threads(rows);

    
    // Если всего один поток, используем однопоточную версию
    if (num_threads <= 1) {
        return solve_matrix(flat_matrix, rows, cols);
    }
    
    // Выделяем память для решения
    double* solution = (double*)malloc(rows * sizeof(double));
    if (!solution) {
        return NULL;
    }
    
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
    
    // Создаем барьер для синхронизации потоков
    pthread_barrier_t barrier;
    int barrier_init_result = pthread_barrier_init(&barrier, NULL, num_threads);
    if (barrier_init_result != 0) {
        free(matrix);
        free(solution);
        return NULL;
    }
    
    // Создаем данные для потоков
    ThreadData* thread_data = (ThreadData*)malloc(num_threads * sizeof(ThreadData));
    pthread_t* threads = (pthread_t*)malloc(num_threads * sizeof(pthread_t));
    
    if (!thread_data || !threads) {
        free(matrix);
        free(solution);
        free(thread_data);
        free(threads);
        pthread_barrier_destroy(&barrier);
        return NULL;
    }
    
    // Распределяем строки между потоками
    int rows_per_thread = rows / num_threads;
    int remainder = rows % num_threads;
    
    // Прямой ход метода Гаусса
    for (int i = 0; i < rows; i++) {

        
        // Поиск максимального элемента в столбце (делаем однопоточно)
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
            free(thread_data);
            free(threads);
            pthread_barrier_destroy(&barrier);
            return NULL;
        }
        
        // Нормализация и исключение переменной в многопоточном режиме
        int current_pos = 0;
        
        // Создаем потоки
        for (int t = 0; t < num_threads; t++) {
            int thread_rows = rows_per_thread;
            if (t < remainder) thread_rows++;
            
            thread_data[t].matrix = matrix;
            thread_data[t].start_row = current_pos;
            thread_data[t].end_row = current_pos + thread_rows;
            thread_data[t].pivot_row = i;
            thread_data[t].col_idx = i;
            thread_data[t].cols = cols;
            thread_data[t].barrier = &barrier;
            
            int create_result = pthread_create(&threads[t], NULL, normalize_rows_thread, &thread_data[t]);

            
            current_pos += thread_rows;
        }
        

        for (int t = 0; t < num_threads; t++) {
            int join_result = pthread_join(threads[t], NULL);
        }
    }
    
    // Извлечение решения (последний столбец)
    for (int i = 0; i < rows; i++) {
        solution[i] = matrix[i * cols + (cols - 1)];
    }
    
    // Освобождаем ресурсы
    free(matrix);
    free(thread_data);
    free(threads);
    pthread_barrier_destroy(&barrier);
    

    return solution;
}

EMSCRIPTEN_KEEPALIVE 
void free_solution(double* solution) {
    if (solution) free(solution);
}