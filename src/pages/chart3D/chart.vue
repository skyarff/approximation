<template>
    <div>
      <div ref="chartDiv" style="width: 100%; height: 500px;"></div>
    </div>
  </template>
  
  <script setup>
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { useChartStore } from '@/store/chart';
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  
  const chartDiv = ref(null);
  const chartStore = useChartStore();
  
  // Параметры для параболоида
  let a = 1;  // коэффициент при x²
  let b = 1;  // коэффициент при y²
  const resolution = 50;  // разрешение (количество точек) сетки
  
  let scene, camera, renderer, controls;
  let paraboloid, group;
  
  // Создание параболоида с точками (поменяли Y и Z)
  const createParaboloidWithPoints = () => {
    // Удаляем предыдущий объект, если он существует
    if (paraboloid) {
      group.remove(paraboloid);
    }
    
    // Генерируем точки для параболоида y = a*x² + b*z²
    // (поменяли y и z в формуле)
    const points = [];
    const step = 0.1; // Более мелкий шаг для лучшей детализации
    const range = 3.0; // Диапазон значений x и z
    
    for (let x = -range; x <= range; x += step) {
      for (let z = -range; z <= range; z += step) {
        const y = a * x * x + b * z * z; // Формула параболоида (поменяли y и z)
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
    paraboloid = new THREE.Points(geometry, material);
    // Важно: отключаем автоматическое вращение
    paraboloid.rotation.set(0, 0, 0);
    group.add(paraboloid);
    
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
    
    // Добавляем оси координат и стрелки
    function createAxisArrow(direction, color, length = 4) {
      const arrowGroup = new THREE.Group();
      
      // Создаем линию оси
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
      arrowGroup.add(line);
      
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
      
      arrowGroup.add(cone);
      return arrowGroup;
    }
    
    // Создаем и добавляем оси со стрелками
    const xAxis = createAxisArrow('x', 0xFF0000); // Красная ось X
    const yAxis = createAxisArrow('y', 0x0000FF); // Синяя ось Y (поменяли цвет на синий)
    const zAxis = createAxisArrow('z', 0x00FF00); // Зеленая ось Z (поменяли цвет на зеленый)
    
    group.add(xAxis);
    group.add(yAxis);
    group.add(zAxis);
    
    // Добавляем направления отрицательных осей (более тонкие линии)
    function createNegativeAxisLine(direction, color, length = 4) {
      const lineGeometry = new THREE.BufferGeometry();
      // Используем более светлый оттенок для отрицательных осей
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: color, 
        linewidth: 1,
        opacity: 0.7,
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
    
    const xLabel = createTextSprite('X →', '#FF0000', new THREE.Vector3(4.5, 0, 0), 1.2);
    const yLabel = createTextSprite('Y ⊙', '#00FF00', new THREE.Vector3(0, 0, 4.5), 1.2); // Изменили на синий Y
    const zLabel = createTextSprite('Z ↑', '#0000FF', new THREE.Vector3(0, 4.5, 0), 1.2); // Изменили на зеленый Z
    
    group.add(xLabel);
    group.add(yLabel);
    group.add(zLabel);
    
    // Добавляем плоскость XY (уже есть как сетка)
    const gridHelper = new THREE.GridHelper(10, 10);
    group.add(gridHelper);
    
    // Создаем и добавляем плоскость XZ с измененным цветом
    const planeXZGeometry = new THREE.PlaneGeometry(10, 10);
    const planeXZMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x2196F3, // Синий цвет (поменяли цвет)
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const planeXZ = new THREE.Mesh(planeXZGeometry, planeXZMaterial);
    planeXZ.rotation.x = Math.PI / 2; // Поворачиваем на 90 градусов вокруг оси X
    planeXZ.position.y = 0; // Размещаем на оси Y = 0
    group.add(planeXZ);
    
    // Создаем и добавляем плоскость YZ с измененным цветом
    const planeYZGeometry = new THREE.PlaneGeometry(10, 10);
    const planeYZMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4CAF50, // Зеленый цвет (поменяли цвет)
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    const planeYZ = new THREE.Mesh(planeYZGeometry, planeYZMaterial);
    planeYZ.rotation.y = Math.PI / 2; // Поворачиваем на 90 градусов вокруг оси Y
    planeYZ.position.x = 0; // Размещаем на оси X = 0
    group.add(planeYZ);
    
    // Добавляем линии координатной сетки для плоскости YZ
    const yzGridHelper = new THREE.GridHelper(10, 10);
    yzGridHelper.rotation.x = Math.PI / 2;
    yzGridHelper.rotation.z = Math.PI / 2;
    group.add(yzGridHelper);
    
    // Добавляем линии координатной сетки для плоскости XZ
    const xzGridHelper = new THREE.GridHelper(10, 10);
    xzGridHelper.rotation.x = Math.PI / 2;
    group.add(xzGridHelper);
    
    // Создаем параболоид
    createParaboloidWithPoints();
    
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
    
    // Делаем первоначальный рендер сцены
    renderer.render(scene, camera);
  };
  
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
      if (scene && group && paraboloid) {
        createParaboloidWithPoints();
      }
    }
  });
  </script>
  
  <style scoped>
  /* Можете добавить стили здесь */
  </style>