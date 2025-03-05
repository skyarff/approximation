<template>
    <div>
      <div ref="chartDiv" style="width: 100%; height: 500px;"></div>
    </div>
  </template>
  
  <script setup>
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { useChartStore } from '@/store/chart';
  import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
  
  const chartDiv = ref(null);
  const chartStore = useChartStore();
  
  // Параметры для параболоида (используются только если нет данных)
  let a = 1;  // коэффициент при x²
  let b = 1;  // коэффициент при y²
  const resolution = 50;  // разрешение (количество точек) сетки
  
  // Параметры осей
  const axisLength = 8; // Увеличиваем длину осей
  const axisTickStep = 1; // Шаг между отметками на осях
  
  let scene, camera, renderer, controls;
  let pointsObject, group;
  let gridXY, gridXZ, gridYZ; // Ссылки на сетки вместо цветных плоскостей
  
  // Получаем данные из хранилища и нормализуем их
  const normalizedData = computed(() => {
    // Проверяем, есть ли данные
    if (!chartStore.chartData || chartStore.chartData.length === 0) {
      return [];
    }
  
    // Определяем первый элемент, чтобы понять структуру данных
    const firstItem = chartStore.chartData[0];
    const keys = Object.keys(firstItem);
  
    // Создаем нормализованные данные
    return chartStore.chartData.map(item => {
      // Если есть ключи x, y1, y2 и структура как в примере
      if (keys.includes('x')) {
        // Если есть y1, но нет y2, то это 1 входная и 1 выходная
        if (keys.includes('y1') && !keys.includes('y2')) {
          return { x: 0, y: item.y1, z: item.x };
        }
        // Если есть и y1, и y2, то y1 - выходная (z), y2 - первая входная (y), x - вторая входная (x)
        else if (keys.includes('y1') && keys.includes('y2')) {
          return { x: item.x, y: item.y2, z: item.y1 };
        }
        // Если есть только x, то x - выходная (z), добавляем y=0
        else {
          return { x: 0, y: 0, z: item.x };
        }
      }
      // Если другая структура или неполные данные
      else {
        const result = { x: 0, y: 0, z: 0 };
        
        // Заполняем объект имеющимися данными
        for (const key in item) {
          if (key.toLowerCase() === 'x') result.x = item[key];
          else if (key.toLowerCase() === 'y') result.y = item[key];
          else if (key.toLowerCase() === 'z') result.z = item[key];
        }
        
        return result;
      }
    });
  });
  
  // Функция для включения/выключения видимости сеток
  const toggleGrids = (showXY = true, showXZ = true, showYZ = true) => {
    if (gridXY) gridXY.visible = showXY;
    if (gridXZ) gridXZ.visible = showXZ;
    if (gridYZ) gridYZ.visible = showYZ;
    
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };
  
  // Создание точек из данных
  const createPointsFromData = () => {
    // Удаляем предыдущий объект, если он существует
    if (pointsObject) {
      group.remove(pointsObject);
    }
    
    // Получаем нормализованные данные
    const points = normalizedData.value;
    
    // Если данных нет, используем формулу параболоида
    if (points.length === 0) {
      createParaboloidWithPoints();
      return;
    }
    
    // Материал для точек
    const material = new THREE.PointsMaterial({
      color: 0xFF5252,
      size: 0.2,  // Увеличиваем размер точек для лучшей видимости
      sizeAttenuation: true
    });
    
    // Создаем геометрию для всех точек
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    
    // Находим минимальные и максимальные значения для масштабирования
    const ranges = {
      x: { min: Infinity, max: -Infinity },
      y: { min: Infinity, max: -Infinity },
      z: { min: Infinity, max: -Infinity }
    };
    
    points.forEach(point => {
      ranges.x.min = Math.min(ranges.x.min, point.x);
      ranges.x.max = Math.max(ranges.x.max, point.x);
      ranges.y.min = Math.min(ranges.y.min, point.y);
      ranges.y.max = Math.max(ranges.y.max, point.y);
      ranges.z.min = Math.min(ranges.z.min, point.z);
      ranges.z.max = Math.max(ranges.z.max, point.z);
    });
    
    const scales = {
      x: ranges.x.max - ranges.x.min !== 0 ? 6 / (ranges.x.max - ranges.x.min) : 1,
      y: ranges.y.max - ranges.y.min !== 0 ? 6 / (ranges.y.max - ranges.y.min) : 1,
      z: ranges.z.max - ranges.z.min !== 0 ? 6 / (ranges.z.max - ranges.z.min) : 1
    };
    
    const offsets = {
      x: (ranges.x.max + ranges.x.min) / 2,
      y: (ranges.y.max + ranges.y.min) / 2,
      z: (ranges.z.max + ranges.z.min) / 2
    };
    
    // Заполняем массив позиций с масштабированием
    points.forEach((point, i) => {
      positions[i * 3] = (point.x - offsets.x) * scales.x;
      positions[i * 3 + 1] = (point.y - offsets.y) * scales.y;
      positions[i * 3 + 2] = (point.z - offsets.z) * scales.z;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Создаем объект точек и добавляем его в группу
    pointsObject = new THREE.Points(geometry, material);
    // Важно: отключаем автоматическое вращение
    pointsObject.rotation.set(0, 0, 0);
    group.add(pointsObject);
    
    // Сразу обновляем рендер после добавления точек
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };
  
  // Создание параболоида с точками (для случая, когда нет данных)
  const createParaboloidWithPoints = () => {
    // Удаляем предыдущий объект, если он существует
    if (pointsObject) {
      group.remove(pointsObject);
    }
    
    // Генерируем точки для параболоида y = a*x² + b*z²
    const points = [];
    const step = 0.1; // Более мелкий шаг для лучшей детализации
    const range = 3.0; // Диапазон значений x и z
    
    for (let x = -range; x <= range; x += step) {
      for (let z = -range; z <= range; z += step) {
        const y = a * x * x + b * z * z; // Формула параболоида
        points.push({ x, y, z });
      }
    }
    
    // Материал для точек
    const material = new THREE.PointsMaterial({
      color: 0xFF5252,
      size: 0.05,
      sizeAttenuation: true
    });
    
    // Создаем геометрию для всех точек
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    
    // Заполняем массив позиций
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Создаем объект точек и добавляем его в группу
    pointsObject = new THREE.Points(geometry, material);
    // Важно: отключаем автоматическое вращение
    pointsObject.rotation.set(0, 0, 0);
    group.add(pointsObject);
    
    // Сразу обновляем рендер после добавления параболоида
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  };
  
  // Обработчики для событий кнопок вращения
  const handleRotateX = (e) => {
    if (group) {
      const radians = (e.detail.degrees * Math.PI) / 180;
      group.rotation.x += radians;
      renderer.render(scene, camera);
    }
  };
  
  const handleRotateY = (e) => {
    if (group) {
      const radians = (e.detail.degrees * Math.PI) / 180;
      group.rotation.y += radians;
      renderer.render(scene, camera);
    }
  };
  
  const handleRotateZ = (e) => {
    if (group) {
      const radians = (e.detail.degrees * Math.PI) / 180;
      group.rotation.z += radians;
      renderer.render(scene, camera);
    }
  };
  
  // Обработчик для сброса вращения
  const handleResetRotation = () => {
    if (group) {
      group.rotation.set(0, 0, 0);
      renderer.render(scene, camera);
    }
  };
  
  // Создание сцены и настройка камеры и рендерера
  const initThree = () => {
    if (!chartDiv.value) return;
    
    // Создаем сцену
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Создаем группу для всех объектов
    group = new THREE.Group();
    scene.add(group);
    
    // Настраиваем камеру
    const width = chartDiv.value.clientWidth;
    const height = chartDiv.value.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(7, 7, 7);
    camera.lookAt(0, 0, 0);
    
    // Настраиваем рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    chartDiv.value.appendChild(renderer.domElement);
    
    // Добавляем управление камерой
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Необходимо обновлять сцену при изменении управления
    controls.addEventListener('change', () => {
      renderer.render(scene, camera);
    });
    
    // Добавляем базовое освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    // Функция для создания оси с делениями и подписями
    function createAxisWithTicks(direction, color, length = axisLength) {
      const axisGroup = new THREE.Group();
      
      // Создаем основную линию оси
      const lineGeometry = new THREE.BufferGeometry();
      const lineMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 3 });
      
      const axisPoints = [];
      axisPoints.push(new THREE.Vector3(0, 0, 0));
      
      // Устанавливаем конечную точку в зависимости от направления
      if (direction === 'x') {
        axisPoints.push(new THREE.Vector3(length, 0, 0));
      } else if (direction === 'y') {
        axisPoints.push(new THREE.Vector3(0, length, 0));
      } else if (direction === 'z') {
        axisPoints.push(new THREE.Vector3(0, 0, length));
      }
      
      lineGeometry.setFromPoints(axisPoints);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      axisGroup.add(line);
      
      // Создаем стрелку (конус) на конце оси
      const coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 16);
      const coneMaterial = new THREE.MeshBasicMaterial({ color: color });
      const cone = new THREE.Mesh(coneGeometry, coneMaterial);
      
      // Размещаем и ориентируем конус в зависимости от направления
      if (direction === 'x') {
        cone.position.set(length, 0, 0);
        cone.rotation.z = -Math.PI / 2;
      } else if (direction === 'y') {
        cone.position.set(0, length, 0);
      } else if (direction === 'z') {
        cone.position.set(0, 0, length);
        cone.rotation.x = Math.PI / 2;
      }
      
      axisGroup.add(cone);
      
      // Добавляем деления и подписи на оси
      const tickSize = 0.1;
      const tickMaterial = new THREE.LineBasicMaterial({ color: color });
      
      for (let i = axisTickStep; i < length; i += axisTickStep) {
        const tickGeometry = new THREE.BufferGeometry();
        const tickPoints = [];
        
        if (direction === 'x') {
          tickPoints.push(new THREE.Vector3(i, -tickSize, 0));
          tickPoints.push(new THREE.Vector3(i, tickSize, 0));
          
          // Добавляем подпись для этого деления
          const label = createTextSprite(`${i}`, color, new THREE.Vector3(i, -0.3, 0), 0.6);
          axisGroup.add(label);
        } else if (direction === 'y') {
          tickPoints.push(new THREE.Vector3(-tickSize, i, 0));
          tickPoints.push(new THREE.Vector3(tickSize, i, 0));
          
          // Добавляем подпись для этого деления
          const label = createTextSprite(`${i}`, color, new THREE.Vector3(-0.3, i, 0), 0.6);
          axisGroup.add(label);
        } else if (direction === 'z') {
          tickPoints.push(new THREE.Vector3(0, -tickSize, i));
          tickPoints.push(new THREE.Vector3(0, tickSize, i));
          
          // Добавляем подпись для этого деления
          const label = createTextSprite(`${i}`, color, new THREE.Vector3(0, -0.3, i), 0.6);
          axisGroup.add(label);
        }
        
        tickGeometry.setFromPoints(tickPoints);
        const tick = new THREE.Line(tickGeometry, tickMaterial);
        axisGroup.add(tick);
      }
      
      return axisGroup;
    }
    
    // Создаем и добавляем оси со шкалами
    const xAxis = createAxisWithTicks('x', 0xFF0000); // Красная ось X
    const yAxis = createAxisWithTicks('y', 0x0000FF); // Синяя ось Y
    const zAxis = createAxisWithTicks('z', 0x00FF00); // Зеленая ось Z
    
    group.add(xAxis);
    group.add(yAxis);
    group.add(zAxis);
    
    // Добавляем направления отрицательных осей (более тонкие линии)
    function createNegativeAxisLine(direction, color, length = axisLength / 2) {
      const lineGeometry = new THREE.BufferGeometry();
      // Используем более светлый оттенок для отрицательных осей
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: color, 
        linewidth: 1,
        opacity: 0.5, // Уменьшаем непрозрачность
        transparent: true
      });
      
      const axisPoints = [];
      axisPoints.push(new THREE.Vector3(0, 0, 0));
      
      if (direction === 'x') {
        axisPoints.push(new THREE.Vector3(-length, 0, 0));
      } else if (direction === 'y') {
        axisPoints.push(new THREE.Vector3(0, -length, 0));
      } else if (direction === 'z') {
        axisPoints.push(new THREE.Vector3(0, 0, -length));
      }
      
      lineGeometry.setFromPoints(axisPoints);
      return new THREE.Line(lineGeometry, lineMaterial);
    }
    
    // Добавляем отрицательные оси с поменянными цветами
    group.add(createNegativeAxisLine('x', 0xFF9999)); // Светло-красная отрицательная ось X
    group.add(createNegativeAxisLine('y', 0x9999FF)); // Светло-синяя отрицательная ось Y
    group.add(createNegativeAxisLine('z', 0x99FF99)); // Светло-зеленая отрицательная ось Z
    
    // Добавляем подписи осей с поменянными обозначениями
    function createTextSprite(text, color, position, size = 1.0) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      
      const context = canvas.getContext('2d');
      
      context.font = 'Bold 60px Arial';
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 128, 128);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(position);
      sprite.scale.set(size, size, size);
      
      return sprite;
    }
    
    const xLabel = createTextSprite('X →', '#FF0000', new THREE.Vector3(axisLength + 0.5, 0, 0), 1.2);
    const yLabel = createTextSprite('Y ⊙', '#0000FF', new THREE.Vector3(0, axisLength + 0.5, 0), 1.2);
    const zLabel = createTextSprite('Z ↑', '#00FF00', new THREE.Vector3(0, 0, axisLength + 0.5), 1.2);
    
    group.add(xLabel);
    group.add(yLabel);
    group.add(zLabel);
    
    // Добавляем сетку для плоскости XY (очень прозрачная)
    gridXY = new THREE.GridHelper(axisLength * 2, axisLength * 2);
    gridXY.material.opacity = 0.07; // Делаем сетку очень прозрачной
    gridXY.material.transparent = true;
    group.add(gridXY);
    
    // Создаем и добавляем сетку для плоскости XZ
    gridXZ = new THREE.GridHelper(axisLength * 2, axisLength * 2);
    gridXZ.rotation.x = Math.PI / 2;
    gridXZ.material.opacity = 0.07; // Делаем сетку очень прозрачной
    gridXZ.material.transparent = true;
    group.add(gridXZ);
    
    // Создаем и добавляем сетку для плоскости YZ
    gridYZ = new THREE.GridHelper(axisLength * 2, axisLength * 2);
    gridYZ.rotation.x = Math.PI / 2;
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.material.opacity = 0.07; // Делаем сетку очень прозрачную
    gridYZ.material.transparent = true;
    group.add(gridYZ);
    
    // Создаем точки из данных или параболоид, если данных нет
    createPointsFromData();
    
    // Обработка взаимодействия с мышью для вращения
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    const handleMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
    };
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };
      
      // Применяем вращение к группе в зависимости от движения мыши
      group.rotation.y += deltaMove.x * 0.01;
      group.rotation.x += deltaMove.y * 0.01;
      
      previousMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
      
      renderer.render(scene, camera);
    };
    
    const handleMouseUp = () => {
      isDragging = false;
    };
    
    // Обработка масштабирования колёсиком мыши
    const handleWheel = (e) => {
      e.preventDefault();
      
      // Ограничиваем масштабирование
      camera.position.z = Math.max(2, Math.min(15, camera.position.z + e.deltaY * 0.01));
      renderer.render(scene, camera);
    };
    
    // Добавляем обработчики событий
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    
    // Регистрируем обработчики для кнопок вращения
    renderer.domElement.addEventListener('rotateX', handleRotateX);
    renderer.domElement.addEventListener('rotateY', handleRotateY);
    renderer.domElement.addEventListener('rotateZ', handleRotateZ);
    renderer.domElement.addEventListener('resetRotation', handleResetRotation);
    
    // Обработчик двойного щелчка для переключения видимости сеток
    renderer.domElement.addEventListener('dblclick', () => {
      // Циклический переход между режимами отображения сеток
      if (gridXY.visible && gridXZ.visible && gridYZ.visible) {
        // Показываем только сетку YZ (для лучшего просмотра параболы)
        toggleGrids(false, false, true);
      } else if (!gridXY.visible && !gridXZ.visible && gridYZ.visible) {
        // Показываем все сетки
        toggleGrids(true, true, true);
      } else {
        // Скрываем все сетки
        toggleGrids(false, false, false);
      }
    });
    
    // Делаем первоначальный рендер сцены
    renderer.render(scene, camera);
  };
  
  // Наблюдаем за изменениями в данных
  watch(() => chartStore.chartData, () => {
    if (scene && group) {
      createPointsFromData();
    }
  }, { deep: true });
  
  // Обновление размеров при изменении размера окна
  const handleResize = () => {
    if (!chartDiv.value || !camera || !renderer) return;
    
    const width = chartDiv.value.clientWidth;
    const height = chartDiv.value.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    renderer.render(scene, camera);
  };
  
  // Хук для инициализации сцены после монтирования компонента
  onMounted(() => {
    initThree();
    window.addEventListener('resize', handleResize);
  });
  
  // Хук для очистки ресурсов перед размонтированием компонента
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize);
    
    if (chartDiv.value && renderer && renderer.domElement) {
      // Удаляем слушатели событий для кнопок вращения
      renderer.domElement.removeEventListener('rotateX', handleRotateX);
      renderer.domElement.removeEventListener('rotateY', handleRotateY);
      renderer.domElement.removeEventListener('rotateZ', handleRotateZ);
      renderer.domElement.removeEventListener('resetRotation', handleResetRotation);
      renderer.domElement.removeEventListener('dblclick', () => {});
      
      // Удаляем слушатели событий для мыши
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
    }
    
    window.removeEventListener('mouseup', handleMouseUp);
    
    if (controls) controls.dispose();
    if (renderer) renderer.dispose();
    
    if (scene) {
      scene.traverse((object) => {
        if (object.isMesh || object.isPoints) {
          object.geometry.dispose();
          
          if (object.material.isMaterial) {
            object.material.dispose();
          } else {
            // Если материал является массивом
            for (const material of object.material) {
              material.dispose();
            }
          }
        }
      });
    }
  });
  
  // Экспортируем методы для использования извне компонента
  defineExpose({
    updateParaboloid: (newA, newB) => {
      a = newA;
      b = newB;
      if (scene && group && pointsObject) {
        // Проверяем, есть ли данные в chartStore
        if (chartStore.chartData && chartStore.chartData.length > 0) {
          createPointsFromData();
        } else {
          createParaboloidWithPoints();
        }
      }
    },
    toggleGrids // Экспортируем функцию для возможности управления сетками извне
  });
  </script>
  
  <style scoped>
  /* Можете добавить стили здесь */
  </style>