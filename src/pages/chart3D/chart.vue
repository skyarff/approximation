<template>
    <div>
        <div ref="chartDiv" style="width: 100%; height: calc(100vh - 301.4px);"></div>
    </div>
</template>

<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useChartStore } from '@/store/chart';
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';

const chartDiv = ref(null);
const chartStore = useChartStore();

const axisLength = 500; // Увеличиваем длину осей
const axisTickStep = 1; // Шаг между отметками на осях

let scene, camera, renderer, controls;
let group;
let gridXY, gridXZ, gridYZ;
let valPointsObject, vallAppPointsObject;
let handleKeyDown; // Добавляем ссылку на функцию обработки клавиш

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
 
    if (valPointsObject) group.remove(valPointsObject);
    if (vallAppPointsObject) group.remove(vallAppPointsObject);

    const tempArr = new Float32Array(chartStore.chartData.length * 3);
    let primaryData = null;
    let approximatedData = null;
    
    const keys = Object.keys(chartStore.chartData[0]);
    const yKeys = {
        val: keys[0],
        valApp: keys[keys.length - 2],
        valDiff: keys[keys.length - 1],
    }
    const xKeys = keys.slice(1, keys.length - 2).slice(0, 2);

    for (let i = 0; i < chartStore.chartData.length; i++) {
        tempArr[i * 3] = xKeys.length > 1 ? chartStore.chartData[i][xKeys[1]] : 0;
        tempArr[i * 3 + 1] = chartStore.chartData[i][xKeys[0]];
    }

    primaryData = structuredClone(tempArr);
    for (let i = 0; i < chartStore.chartData.length; i++) {
        primaryData[i * 3 + 2] = chartStore.chartData[i][yKeys.val];
    }
    
    const primaryDataMaterial = new THREE.PointsMaterial({
        color: '#0000FF',
        size: 0.2,
        sizeAttenuation: true
    });
    const valGeometry = new THREE.BufferGeometry();
    valGeometry.setAttribute('position', new THREE.BufferAttribute(primaryData, 3));
    valPointsObject = new THREE.Points(valGeometry, primaryDataMaterial);
    group.add(valPointsObject);
    
    approximatedData = structuredClone(tempArr);
    for (let i = 0; i < chartStore.chartData.length; i++) {
        approximatedData[i * 3 + 2] = chartStore.chartData[i][yKeys.valApp];
    }

    const approximatedDataMaterial = new THREE.PointsMaterial({
        color: '#FF0000',
        size: 0.2,
        sizeAttenuation: true
    });
    const vallAppGeometry = new THREE.BufferGeometry();
    vallAppGeometry.setAttribute('position', new THREE.BufferAttribute(approximatedData, 3));
    vallAppPointsObject = new THREE.Points(vallAppGeometry, approximatedDataMaterial);
    group.add(vallAppPointsObject);

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
};

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
    
    // Добавляем возможность смещения камеры
    controls.enablePan = true;
    controls.panSpeed = 1.0; // Скорость панорамирования
    controls.screenSpacePanning = true; // Перемещение в плоскости экрана, а не только горизонтально

    // Настройка кнопок мыши
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };

    // Добавляем обработчик для панорамирования с клавиатуры
    handleKeyDown = (e) => {
        const panSpeed = 5; // Скорость панорамирования
        const panVector = new THREE.Vector3(); // Вектор для панорамирования
        
        switch (e.key) {
            case 'ArrowLeft':
                // Смещение влево
                panVector.set(-panSpeed, 0, 0);
                break;
            case 'ArrowRight':
                // Смещение вправо
                panVector.set(panSpeed, 0, 0);
                break;
            case 'ArrowUp':
                // Смещение вверх
                panVector.set(0, panSpeed, 0);
                break;
            case 'ArrowDown':
                // Смещение вниз
                panVector.set(0, -panSpeed, 0);
                break;
            default:
                return; // Выходим, если нажата не стрелка
        }
        
        // Преобразуем вектор в локальное пространство камеры
        panVector.applyQuaternion(camera.quaternion);
        
        // Перемещаем камеру и точку, на которую она смотрит
        camera.position.add(panVector);
        controls.target.add(panVector);
        
        // Обновляем контроллер и рендерим сцену
        controls.update();
        renderer.render(scene, camera);
    };
    window.addEventListener('keydown', handleKeyDown);

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

                // Добавляем подпись для этого деления - увеличенного размера
                const label = createTextSprite(`${i}`, color, new THREE.Vector3(i, -0.6, 0), 1.0);
                axisGroup.add(label);
            } else if (direction === 'y') {
                tickPoints.push(new THREE.Vector3(-tickSize, i, 0));
                tickPoints.push(new THREE.Vector3(tickSize, i, 0));

                // Добавляем подпись для этого деления - увеличенного размера
                const label = createTextSprite(`${i}`, color, new THREE.Vector3(-0.6, i, 0), 1.0);
                axisGroup.add(label);
            } else if (direction === 'z') {
                tickPoints.push(new THREE.Vector3(0, -tickSize, i));
                tickPoints.push(new THREE.Vector3(0, tickSize, i));

                // Добавляем подпись для этого деления - увеличенного размера
                const label = createTextSprite(`${i}`, color, new THREE.Vector3(0, -0.6, i), 1.0);
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
        canvas.width = 512; // Larger canvas for higher resolution
        canvas.height = 512;

        const context = canvas.getContext('2d');
        
        // Clear the canvas with a transparent background
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Use a larger, bolder font with better anti-aliasing
        context.font = 'Bold 120px Arial';
        context.fillStyle = color;
        context.strokeStyle = '#FFFFFF'; // Adding white outline for better visibility
        context.lineWidth = 4;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Add a subtle text shadow for depth
        context.shadowColor = 'rgba(0,0,0,0.5)';
        context.shadowBlur = 6;
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        
        // Draw the text
        context.strokeText(text, 256, 256);
        context.fillText(text, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        // Enable mipmapping and anisotropic filtering for sharper text
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true,
            depthWrite: false // Prevents z-fighting with other elements
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.scale.set(size, size, size);

        return sprite;
    }

    // Create larger axis labels with increased size parameter
    const xLabel = createTextSprite('X →', '#FF0000', new THREE.Vector3(axisLength + 1.5, 0, 0), 2.5);
    const yLabel = createTextSprite('Y ⊙', '#0000FF', new THREE.Vector3(0, axisLength + 1.5, 0), 2.5);
    const zLabel = createTextSprite('Z ↑', '#00FF00', new THREE.Vector3(0, 0, axisLength + 1.5), 2.5);

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
    gridYZ.material.opacity = 0.07; // Делаем сетку очень прозрачной
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
    window.removeEventListener('keydown', handleKeyDown); // Удаляем обработчик клавиш

    if (chartDiv.value && renderer && renderer.domElement) {
        // Удаляем слушатели событий для кнопок вращения
        renderer.domElement.removeEventListener('rotateX', handleRotateX);
        renderer.domElement.removeEventListener('rotateY', handleRotateY);
        renderer.domElement.removeEventListener('rotateZ', handleRotateZ);
        renderer.domElement.removeEventListener('resetRotation', handleResetRotation);
        renderer.domElement.removeEventListener('dblclick', () => { });

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
    toggleGrids // Экспортируем функцию для возможности управления сетками извне
});
</script>

<style scoped>
/* Можете добавить стили здесь */
</style>