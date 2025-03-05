<template>
    <div>
      <h1 class="text-center text-xl font-bold mb-4">Визуализация параболоида y = a·x² + b·z²</h1>
      <Chart ref="chartRef" />
      
      <div class="controls mt-4">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>
              Управление параметрами
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="px-4 py-2">
                <v-slider
                  v-model="paramA"
                  label="Параметр a"
                  :min="0.1"
                  :max="2"
                  :step="0.1"
                  thumb-label
                  @update:model-value="updateChart"
                ></v-slider>
                
                <v-slider
                  v-model="paramB"
                  label="Параметр b"
                  :min="0.1"
                  :max="2"
                  :step="0.1"
                  thumb-label
                  @update:model-value="updateChart"
                ></v-slider>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        
        <!-- Кнопки управления вращением -->
        <div class="rotation-controls mt-4">
          <v-card>
            <v-card-title class="text-center">Вращение фигуры</v-card-title>
            <v-card-text>
              <v-slider
                v-model="rotationSteps"
                label="Угол вращения (градусы)"
                :min="5"
                :max="45"
                :step="5"
                thumb-label
              ></v-slider>
              
              <div class="d-flex flex-wrap justify-space-between mt-4">
                <div>
                  <div class="text-subtitle-2 mb-2 red--text">Вращение вокруг оси X</div>
                  <div class="d-flex gap-2">
                    <v-btn color="red-lighten-4" @click="rotateX(rotationSteps)">
                      <span class="mr-1">↶</span> {{ rotationSteps }}°
                    </v-btn>
                    <v-btn color="red-lighten-4" @click="rotateX(-rotationSteps)">
                      <span class="mr-1">↷</span> {{ rotationSteps }}°
                    </v-btn>
                  </div>
                </div>
                
                <div>
                  <div class="text-subtitle-2 mb-2 blue--text">Вращение вокруг оси Y</div>
                  <div class="d-flex gap-2">
                    <v-btn color="blue-lighten-4" @click="rotateY(rotationSteps)">
                      <span class="mr-1">↶</span> {{ rotationSteps }}°
                    </v-btn>
                    <v-btn color="blue-lighten-4" @click="rotateY(-rotationSteps)">
                      <span class="mr-1">↷</span> {{ rotationSteps }}°
                    </v-btn>
                  </div>
                </div>
                
                <div>
                  <div class="text-subtitle-2 mb-2 green--text">Вращение вокруг оси Z</div>
                  <div class="d-flex gap-2">
                    <v-btn color="green-lighten-4" @click="rotateZ(rotationSteps)">
                      <span class="mr-1">↶</span> {{ rotationSteps }}°
                    </v-btn>
                    <v-btn color="green-lighten-4" @click="rotateZ(-rotationSteps)">
                      <span class="mr-1">↷</span> {{ rotationSteps }}°
                    </v-btn>
                  </div>
                </div>
              </div>
              
              <div class="d-flex justify-center mt-4">
                <v-btn @click="resetRotation" color="grey-lighten-3">
                  Сбросить положение
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
        
        <div class="mt-4 text-center text-caption text-grey">
          Используйте мышь для произвольного вращения, колесико для масштабирования
        </div>
        
        <v-card class="mt-4">
          <v-card-title class="text-center">Обозначения</v-card-title>
          <v-card-text>
            <div class="d-flex flex-wrap justify-space-around">
              <div class="d-flex align-center">
                <div style="width: 20px; height: 3px; background-color: #FF0000; margin-right: 4px;"></div>
                <span class="font-weight-bold red--text">→</span>
                <span class="ml-1">Ось X (вправо)</span>
              </div>
              <div class="d-flex align-center">
                <div style="width: 20px; height: 3px; background-color: #0000FF; margin-right: 4px;"></div>
                <span class="font-weight-bold blue--text">⊙</span>
                <span class="ml-1">Ось Y (на вас)</span>
              </div>
              <div class="d-flex align-center">
                <div style="width: 20px; height: 3px; background-color: #00FF00; margin-right: 4px;"></div>
                <span class="font-weight-bold green--text">↑</span>
                <span class="ml-1">Ось Z (вверх)</span>
              </div>
            </div>
            
            <div class="d-flex flex-wrap justify-space-around mt-4">
              <div class="d-flex align-center">
                <span class="inline-block" style="width: 12px; height: 12px; background-color: #FF5252; margin-right: 4px;"></span>
                <span>Точки параболоида</span>
              </div>
              <div class="d-flex align-center">
                <span class="inline-block" style="width: 12px; height: 12px; background-color: #0000FF; opacity: 0.5; margin-right: 4px;"></span>
                <span>Плоскость XZ (y=0)</span>
              </div>
              <div class="d-flex align-center">
                <span class="inline-block" style="width: 12px; height: 12px; background-color: #00FF00; opacity: 0.5; margin-right: 4px;"></span>
                <span>Плоскость XY (z=0)</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import Chart from './chart.vue';
  
  const chartRef = ref(null);
  const paramA = ref(1);
  const paramB = ref(1);
  const rotationSteps = ref(15);
  
  const updateChart = () => {
    if (chartRef.value) {
      chartRef.value.updateParaboloid(paramA.value, paramB.value);
    }
  };
  
  // Функции вращения по осям
  const rotateX = (degrees) => {
    if (chartRef.value && chartRef.value.$el.querySelector('canvas')) {
      const event = new CustomEvent('rotateX', { detail: { degrees } });
      chartRef.value.$el.querySelector('canvas').dispatchEvent(event);
    }
  };
  
  const rotateY = (degrees) => {
    if (chartRef.value && chartRef.value.$el.querySelector('canvas')) {
      const event = new CustomEvent('rotateY', { detail: { degrees } });
      chartRef.value.$el.querySelector('canvas').dispatchEvent(event);
    }
  };
  
  const rotateZ = (degrees) => {
    if (chartRef.value && chartRef.value.$el.querySelector('canvas')) {
      const event = new CustomEvent('rotateZ', { detail: { degrees } });
      chartRef.value.$el.querySelector('canvas').dispatchEvent(event);
    }
  };
  
  const resetRotation = () => {
    if (chartRef.value && chartRef.value.$el.querySelector('canvas')) {
      const event = new CustomEvent('resetRotation');
      chartRef.value.$el.querySelector('canvas').dispatchEvent(event);
    }
  };
  
  onMounted(() => {
    // Инициализация при монтировании
    updateChart();
  });
  </script>
  
  <style scoped>
  .controls {
    max-width: 800px;
    margin: 0 auto;
  }
  
  h1 {
    margin-bottom: 20px;
  }
  
  .gap-2 {
    gap: 8px;
  }
  </style>