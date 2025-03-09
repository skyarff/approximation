<template>
    <div>
        <div v-if="chartDivOn" ref="chartDiv" style="width: 100%; height: calc(100vh - 48px);"></div>
    </div>
</template>

<script setup>
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useChartStore } from '@/store/chart';
import { ref, onBeforeUnmount, nextTick, onActivated } from 'vue';

const chartDiv = ref(null);
const chartStore = useChartStore();
let chartData = [];



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


let switcher = 0;
const toggleDataVisible = () => {
    if (valPointsObject) {
        if (switcher == 2) {
            valPointsObject.visible = true;
            if (primaryLines) primaryLines.visible = true;
        } else if (switcher == 0) {
            valPointsObject.visible = false;
            if (primaryLines) primaryLines.visible = false;
        }
    }

    if (vallAppPointsObject) {
        if (switcher == 3) {
            vallAppPointsObject.visible = true;
            if (approximatedLines) approximatedLines.visible = true;
        } else if (switcher == 1) {
            vallAppPointsObject.visible = false;
            if (approximatedLines) approximatedLines.visible = false;
        }
    }

    switcher = (switcher + 1) % 4;
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
};



const createPointsFromData = (x1Val, x2Val) => {

    if (valPointsObject) group.remove(valPointsObject);
    if (vallAppPointsObject) group.remove(vallAppPointsObject);

    const keys = Object.keys(chartData[0]);
    let xKeys = keys.slice(1, keys.length - 2).slice(0, 2);

    if (x2Val) xKeys[0] = x2Val;
    if (x1Val) xKeys[1] = x1Val;


    if (x2Val == '-')
        chartData.sort((a, b) => a[xKeys[0]] - b[xKeys[0]]);
    if (x1Val == '-')
        chartData.sort((a, b) => a[xKeys[1]] - b[xKeys[1]]);


    let primaryData = null;
    let approximatedData = null;
    let tempArr;

    tempArr = new Float32Array(chartData.length * 3);

    for (let i = 0; i < chartData.length; i++) {
        tempArr[i * 3] = x1Val != '-' ? chartData[i][xKeys[1]] : 0;
        tempArr[i * 3 + 1] = x2Val != '-' ? chartData[i][xKeys[0]] : 0;
    }

    primaryData = structuredClone(tempArr);
    for (let i = 0; i < chartData.length; i++) {
        primaryData[i * 3 + 2] = chartData[i][chartStore.yKeys[0]];
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
    for (let i = 0; i < chartData.length; i++) {
        approximatedData[i * 3 + 2] = chartData[i][chartStore.yKeys[1]];
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


    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;


    for (let i = 0; i < primaryData?.length; i++) {
        if (primaryData[i] < min) min = primaryData[i];
        if (primaryData[i] > max) max = primaryData[i];

        if (approximatedData[i] < min) min = approximatedData[i];
        if (approximatedData[i] > max) max = approximatedData[i];
    }

    return {
        min, max
    }
};


const initThree = (posAxis, negAxis, gridStep, x1Val, x2Val) => {
    if (!chartDiv.value) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    group = new THREE.Group();
    scene.add(group);

    const width = chartDiv.value.clientWidth;
    const height = chartDiv.value.clientHeight;


    let { min, max } = createPointsFromData(x1Val, x2Val);
    const longSight = (Math.abs(max) + Math.abs(min)) * 2;

    let axisTickStep = Math.round(longSight / 75);
    axisTickStep = Math.ceil(axisTickStep / 5) * 5;


    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, longSight);
    camera.position.set(20, 20, 20);
    camera.up.set(0, 0, 1);


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
            case 'ф':
            case 'Ф':
                panVector.set(-panSpeed, 0, 0);
                break;

            case 'd':
            case 'D':
            case 'в':
            case 'В':
                panVector.set(panSpeed, 0, 0);
                break;

            case 'w':
            case 'W':
            case 'ц':
            case 'Ц':
                panVector.set(0, 0, -panSpeed);
                break;

            case 's':
            case 'S':
            case 'ы':
            case 'Ы':
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

    let letterSize = longSight / 75;
    let tickSize = longSight / 1000;
    let verticalOffset = -longSight / 280;
    let labelOffset = longSight / 400;
    let labelSize = longSight / 20;
    if (gridStep) {
        letterSize *= gridStep / axisTickStep;
        tickSize *= gridStep / axisTickStep;
        verticalOffset *= gridStep / axisTickStep;
        labelOffset *= gridStep / axisTickStep;
        labelSize *= gridStep / axisTickStep;
        axisTickStep = Number(gridStep);
    }


    max = max > 0 ? max : 0;
    const posAxis_ = Number(posAxis ? posAxis : max);
    function createAxisWithTicks(direction, color, length, sign = 1) {
        const axisGroup = new THREE.Group();

        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 3 });

        const axisPoints = [];
        axisPoints.push(new THREE.Vector3(0, 0, 0));

        if (direction === 'x') {
            axisPoints.push(new THREE.Vector3(length * sign, 0, 0));
        } else if (direction === 'y') {
            axisPoints.push(new THREE.Vector3(0, length * sign, 0));
        } else if (direction === 'z') {
            axisPoints.push(new THREE.Vector3(0, 0, length * sign));
        }

        lineGeometry.setFromPoints(axisPoints);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        axisGroup.add(line);


        const tickMaterial = new THREE.LineBasicMaterial({ color: color });


        for (let i = axisTickStep; i < length; i += axisTickStep) {


            const tickGeometry = new THREE.BufferGeometry();
            const tickPoints = [];

            if (direction === 'x') {
                tickPoints.push(new THREE.Vector3(i * sign, 0, -tickSize));
                tickPoints.push(new THREE.Vector3(i * sign, 0, tickSize));

                const label = createTextSprite(`${i * sign}`, '#000', new THREE.Vector3(i * sign, 0, verticalOffset), letterSize);
                axisGroup.add(label);
            } else if (direction === 'y') {
                tickPoints.push(new THREE.Vector3(0, i * sign, -tickSize));
                tickPoints.push(new THREE.Vector3(0, i * sign, tickSize));

                const label = createTextSprite(`${i * sign}`, '#000', new THREE.Vector3(0, i * sign, verticalOffset), letterSize);
                axisGroup.add(label);
            } else if (direction === 'z') {
                tickPoints.push(new THREE.Vector3(-tickSize * sign, 0, i));
                tickPoints.push(new THREE.Vector3(tickSize * sign, 0, i));

                const label = createTextSprite(`${i * sign}`, '#000', new THREE.Vector3(0, verticalOffset, i * sign), letterSize);
                axisGroup.add(label);
            }

            tickGeometry.setFromPoints(tickPoints);
            const tick = new THREE.Line(tickGeometry, tickMaterial);
            axisGroup.add(tick);
        }

        return axisGroup;
    }

    const xAxis = createAxisWithTicks('x', '#FF0000', posAxis_);
    const yAxis = createAxisWithTicks('y', '#00FF00', posAxis_);
    const zAxis = createAxisWithTicks('z', '#0000FF', posAxis_);

    group.add(xAxis);
    group.add(yAxis);
    group.add(zAxis);


    min = min < 0 ? min : 0;
    const negAxis_ = Number(negAxis ? negAxis : -min);
    const negXAxis = createAxisWithTicks('x', '#FF0000', negAxis_, -1);
    const negYAxis = createAxisWithTicks('y', '#00FF00', negAxis_, -1);
    const negZAxis = createAxisWithTicks('z', '#0000FF', negAxis_, -1);

    group.add(negXAxis);
    group.add(negYAxis);
    group.add(negZAxis);


    function createTextSprite(text, color, position, size = 1.0) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;

        const context = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.font = '120px Roboto';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.fillText(text, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
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


    const xLabel = createTextSprite('X', '#FF0000', new THREE.Vector3(posAxis_ + labelOffset, 0, 0), labelSize);
    const yLabel = createTextSprite('Y', '#00FF00', new THREE.Vector3(0, posAxis_ + labelOffset, 0), labelSize);
    const zLabel = createTextSprite('Z', '#0000FF', new THREE.Vector3(0, 0, posAxis_ + labelOffset), labelSize);


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
        toggleDataVisible();
    });

    renderer.domElement.addEventListener('contextmenu', () => {
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


onActivated(() => {
    if (chartStore.newData3D) {
        chartData = [...chartStore.chartData];
        callChart();
        chartStore.newData3D = false;
    }
});


function disposeThree() {
    window.removeEventListener('keydown', handleKeyDown);

    if (chartDiv.value && renderer && renderer.domElement) {
        renderer.domElement.removeEventListener('dblclick', () => { });
        renderer.domElement.removeEventListener('contextmenu', () => { });
    }

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

function callChart(...args) {
    disposeAndCall(
        initThree,
        ...args
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