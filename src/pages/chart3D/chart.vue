<template>
    <div>
        <div v-if="chartDivOn" ref="chartDiv" style="width: 100%; height: calc(100vh - 48px);"></div>
    </div>
</template>

<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useChartStore } from '@/store/chart';
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';

const chartDiv = ref(null);
const chartStore = useChartStore();

const axisLength = 200;
const axisTickStep = 5;



let scene, camera, renderer, controls;
let group;
let gridXY, gridXZ, gridYZ;

let valPointsObject, vallAppPointsObject;
let primaryLines, approximatedLines;

let handleKeyDown;

const toggleGrids = () => {
    gridXY.visible = chartStore.grid3D;
    gridXZ.visible = chartStore.grid3D;
    gridYZ.visible = chartStore.grid3D;

    if (renderer && scene && camera) renderer.render(scene, camera);
};

const toggleConnectPoints = () => {

    if (chartStore.pointChart3D) {
        console.log('1')

        if (valPointsObject) {
            const positions = valPointsObject.geometry.attributes.position.array;
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const lineMaterial = new THREE.LineBasicMaterial({
                color: '#0000FF',
                opacity: 0.7,
                transparent: true
            });

            primaryLines = new THREE.Line(lineGeometry, lineMaterial);
            group.add(primaryLines);
        }

        if (vallAppPointsObject) {
            const positions = vallAppPointsObject.geometry.attributes.position.array;
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const lineMaterial = new THREE.LineBasicMaterial({
                color: '#FF0000',
                opacity: 0.7,
                transparent: true
            });

            approximatedLines = new THREE.Line(lineGeometry, lineMaterial);
            group.add(approximatedLines);
        }
    } else {
        console.log('2')
        if (primaryLines) {
            group.remove(primaryLines);
            primaryLines = null;
        }

        if (approximatedLines) {
            group.remove(approximatedLines);
            approximatedLines = null;
        }
    }


    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
};

const createPointsFromData = () => {
    if (valPointsObject) group.remove(valPointsObject);
    if (vallAppPointsObject) group.remove(vallAppPointsObject);

    const tempArr = new Float32Array(chartStore.chartData.length * 3);
    let primaryData = null;
    let approximatedData = null;

    const keys = Object.keys(chartStore.chartData[0]);

    const xKeys = keys.slice(1, keys.length - 2).slice(0, 2);

    for (let i = 0; i < chartStore.chartData.length; i++) {
        tempArr[i * 3] = xKeys.length > 1 ? chartStore.chartData[i][xKeys[1]] : 0;
        tempArr[i * 3 + 1] = chartStore.chartData[i][xKeys[0]];
    }

    primaryData = structuredClone(tempArr);
    for (let i = 0; i < chartStore.chartData.length; i++) {
        primaryData[i * 3 + 2] = chartStore.chartData[i][chartStore.yKeys[0]];
    }

    const primaryDataMaterial = new THREE.PointsMaterial({
        color: '#0000FF',
        size: 0.25,
        sizeAttenuation: true
    });
    const valGeometry = new THREE.BufferGeometry();
    valGeometry.setAttribute('position', new THREE.BufferAttribute(primaryData, 3));
    valPointsObject = new THREE.Points(valGeometry, primaryDataMaterial);
    group.add(valPointsObject);

    approximatedData = structuredClone(tempArr);
    for (let i = 0; i < chartStore.chartData.length; i++) {
        approximatedData[i * 3 + 2] = chartStore.chartData[i][chartStore.yKeys[1]];
    }

    const approximatedDataMaterial = new THREE.PointsMaterial({
        color: '#FF0000',
        size: 0.25,
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

const handleResetRotation = () => {
    if (group) {
        group.rotation.set(0, 0, 0);
        renderer.render(scene, camera);
    }
};


const initThree = (posAxis, negAxis) => {
    if (!chartDiv.value) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    group = new THREE.Group();
    scene.add(group);

    const width = chartDiv.value.clientWidth;
    const height = chartDiv.value.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(20, 20, 20);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    chartDiv.value.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.enablePan = true;
    controls.panSpeed = 1.0;
    controls.screenSpacePanning = true;


    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };


    handleKeyDown = (e) => {
        const panSpeed = 5;
        const panVector = new THREE.Vector3();

        switch (e.key) {
            case 'ArrowLeft':
                panVector.set(-panSpeed, 0, 0);
                break;
            case 'ArrowRight':
                panVector.set(panSpeed, 0, 0);
                break;
            case 'ArrowUp':
                panVector.set(0, panSpeed, 0);
                break;
            case 'ArrowDown':
                panVector.set(0, -panSpeed, 0);
                break;
            case 'a':
            case 'A':
                panVector.set(-panSpeed, 0, 0);
                break;
            case 'd':
            case 'D':
                panVector.set(panSpeed, 0, 0);
                break;
            case 'w':
            case 'W':
                panVector.set(0, 0, -panSpeed);
                break;
            case 's':
            case 'S':
                panVector.set(0, 0, panSpeed);
                break;

            case 'Control':
                panVector.set(0, -panSpeed, 0);
                break;
            case ' ':
                panVector.set(0, panSpeed, 0);
                break;

            default:
                return;
        }

        panVector.applyQuaternion(camera.quaternion);

        camera.position.add(panVector);
        controls.target.add(panVector);

        controls.update();
        renderer.render(scene, camera);
    };
    window.addEventListener('keydown', handleKeyDown);

    controls.addEventListener('change', () => {
        renderer.render(scene, camera);
    });


    

    createPointsFromData();

    const posAxis_ = posAxis ? posAxis : axisLength;
    function createAxisWithTicks(direction, color, length = posAxis_) {
        const axisGroup = new THREE.Group();

        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 3 });

        const axisPoints = [];
        axisPoints.push(new THREE.Vector3(0, 0, 0));

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

        const coneGeometry = new THREE.ConeGeometry(0.2, 0.5, 16);
        const coneMaterial = new THREE.MeshBasicMaterial({ color: color });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);

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

        const tickSize = 0.2;
        const tickMaterial = new THREE.LineBasicMaterial({ color: color });

        for (let i = axisTickStep; i < length; i += axisTickStep) {
            const tickGeometry = new THREE.BufferGeometry();
            const tickPoints = [];

            if (direction === 'x') {
                tickPoints.push(new THREE.Vector3(i, -tickSize, 0));
                tickPoints.push(new THREE.Vector3(i, tickSize, 0));

                const label = createTextSprite(`${i}`, color, new THREE.Vector3(i, -0.75, 0), 2.3);
                axisGroup.add(label);
            } else if (direction === 'y') {
                tickPoints.push(new THREE.Vector3(-tickSize, i, 0));
                tickPoints.push(new THREE.Vector3(tickSize, i, 0));

                const label = createTextSprite(`${i}`, color, new THREE.Vector3(-0.75, i, 0), 2.3);
                axisGroup.add(label);
            } else if (direction === 'z') {
                tickPoints.push(new THREE.Vector3(0, -tickSize, i));
                tickPoints.push(new THREE.Vector3(0, tickSize, i));

                const label = createTextSprite(`${i}`, color, new THREE.Vector3(0, -0.75, i), 2.3);
                axisGroup.add(label);
            }

            tickGeometry.setFromPoints(tickPoints);
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            axisGroup.add(tick);
        }

        return axisGroup;
    }

    const xAxis = createAxisWithTicks('x', 0xFF0000);
    const yAxis = createAxisWithTicks('y', 0x0000FF);
    const zAxis = createAxisWithTicks('z', 0x00FF00);

    group.add(xAxis);
    group.add(yAxis);
    group.add(zAxis);

    const negAxis_ = negAxis ? negAxis : axisLength;
    function createNegativeAxisLine(direction, color, length = negAxis_) {
        const axisGroup = new THREE.Group();

        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
            linewidth: 1,
            opacity: 1,
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
        const line = new THREE.Line(lineGeometry, lineMaterial);
        axisGroup.add(line);

        // Добавляем деления и метки
        const tickSize = 0.2;
        const tickMaterial = new THREE.LineBasicMaterial({ color: color });

        for (let i = -axisTickStep; i > -length; i -= axisTickStep) {
            const tickGeometry = new THREE.BufferGeometry();
            const tickPoints = [];

            if (direction === 'x') {
                tickPoints.push(new THREE.Vector3(i, -tickSize, 0));
                tickPoints.push(new THREE.Vector3(i, tickSize, 0));

                const label = createTextSprite(`${i}`, color, new THREE.Vector3(i, -0.75, 0), 2.3);
                axisGroup.add(label);
            } else if (direction === 'y') {
                tickPoints.push(new THREE.Vector3(-tickSize, i, 0));
                tickPoints.push(new THREE.Vector3(tickSize, i, 0));

                const label = createTextSprite(`${i}`, color, new THREE.Vector3(-0.75, i, 0), 2.3);
                axisGroup.add(label);
            } else if (direction === 'z') {
                tickPoints.push(new THREE.Vector3(0, -tickSize, i));
                tickPoints.push(new THREE.Vector3(0, tickSize, i));

                const label = createTextSprite(`${i}`, color, new THREE.Vector3(0, -0.75, i), 2.3);
                axisGroup.add(label);
            }

            tickGeometry.setFromPoints(tickPoints);
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            axisGroup.add(tick);
        }
        
        return axisGroup;
    }


    const negXAxis = createNegativeAxisLine('x', 0xFF0000);
    const negYAxis = createNegativeAxisLine('y', 0x0000FF);
    const negZAxis = createNegativeAxisLine('z', 0x00FF00);

    group.add(negXAxis);
    group.add(negYAxis);
    group.add(negZAxis);

    // Добавляем подписи осей с поменянными обозначениями
    function createTextSprite(text, color, position, size = 1.0) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;

        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Use a larger, bolder font with better anti-aliasing
        context.font = 'Bold 120px Roboto';
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
            depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.scale.set(size, size, size);

        return sprite;
    }

    const xLabel = createTextSprite('X', '#FF0000', new THREE.Vector3(2.5, 0, 0), 4);
    const yLabel = createTextSprite('Y', '#0000FF', new THREE.Vector3(0, 2.5, 0), 4);
    const zLabel = createTextSprite('Z', '#00FF00', new THREE.Vector3(0, 0, 2.5), 4);



    group.add(xLabel);
    group.add(yLabel);
    group.add(zLabel);



    const gridLength = Math.max(posAxis_, negAxis_) * 2
    gridXY = new THREE.GridHelper(gridLength, gridLength);
    gridXY.material.opacity = 0.055;
    gridXY.material.transparent = true;
    group.add(gridXY);

    gridXZ = new THREE.GridHelper(gridLength, gridLength);
    gridXZ.rotation.x = Math.PI / 2;
    gridXZ.material.opacity = 0.06;
    gridXZ.material.transparent = true;
    group.add(gridXZ);

    gridYZ = new THREE.GridHelper(gridLength, gridLength);
    gridYZ.rotation.x = Math.PI / 2;
    gridYZ.rotation.z = Math.PI / 2;
    gridYZ.material.opacity = 0.06;
    gridYZ.material.transparent = true;
    group.add(gridYZ);

    
    toggleConnectPoints();
    toggleGrids();

    let menuTemp = true;
    renderer.domElement.addEventListener('dblclick', () => {

        if (menuTemp) {
            chartStore.grid3D = !chartStore.grid3D;
            toggleGrids();
            menuTemp = false;
        } else {
            chartStore.pointChart3D = !chartStore.pointChart3D;
            toggleConnectPoints();
            menuTemp = true;
        }


    });

    renderer.render(scene, camera);
};



watch(() => chartStore.chartData, () => {
    if (scene && group) {
        if (primaryLines) {
            group.remove(primaryLines);
            primaryLines.geometry.dispose();
            primaryLines.material.dispose();
        }

        if (approximatedLines) {
            group.remove(approximatedLines);
            approximatedLines.geometry.dispose();
            approximatedLines.material.dispose();
        }

        if (valPointsObject) {
            group.remove(valPointsObject);
            valPointsObject.geometry.dispose();
            valPointsObject.material.dispose();
        }

        if (vallAppPointsObject) {
            group.remove(vallAppPointsObject);
            vallAppPointsObject.geometry.dispose();
            vallAppPointsObject.material.dispose();
        }



        createPointsFromData();
    }
}, { deep: true });



const handleResize = () => {
    if (!chartDiv.value || !camera || !renderer) return;

    const width = chartDiv.value.clientWidth;
    const height = chartDiv.value.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.render(scene, camera);
};

onMounted(() => {
    initThree();
    window.addEventListener('resize', handleResize);
});

function disposeThree() {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('keydown', handleKeyDown);

    if (chartDiv.value && renderer && renderer.domElement) {

        renderer.domElement.removeEventListener('rotateX', handleRotateX);
        renderer.domElement.removeEventListener('rotateY', handleRotateY);
        renderer.domElement.removeEventListener('rotateZ', handleRotateZ);
        renderer.domElement.removeEventListener('resetRotation', handleResetRotation);
        renderer.domElement.removeEventListener('dblclick', () => { });
    }

    // Удаляем линии, если они существуют
    if (primaryLines) {
        group.remove(primaryLines);
        primaryLines.geometry.dispose();
        primaryLines.material.dispose();
    }

    if (approximatedLines) {
        group.remove(approximatedLines);
        approximatedLines.geometry.dispose();
        approximatedLines.material.dispose();
    }

    if (controls) controls.dispose();
    if (renderer) renderer.dispose();

    if (scene) {
        scene.traverse((object) => {
            if (object.isMesh || object.isPoints) {
                object.geometry.dispose();

                if (object.material.isMaterial) {
                    object.material.dispose();
                } else {
                    for (const material of object.material) {
                        material.dispose();
                    }
                }
            }
        });
    }
}


const chartDivOn = ref(true);
async function disposeAndCall(func, ...args) {
    disposeThree();

    chartDivOn.value = false;

    await nextTick();
    chartDivOn.value = true;
    await nextTick();

    func(...args);
};

function callChart(posAxis, negAxis) {
    disposeAndCall(
        initThree,
        posAxis,
        negAxis
    )
};


onBeforeUnmount(() => {
    disposeThree();
});


defineExpose({
    toggleGrids,
    toggleConnectPoints,
    callChart
});
</script>

<style scoped></style>