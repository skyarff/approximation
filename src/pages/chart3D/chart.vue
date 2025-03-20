<template>
    <div>
        <div v-if="chartDivOn" ref="chartDiv" style="width: 100%; height: calc(100vh - 48px);"></div>
    </div>
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useChartStore } from '@/store/chart';
import { ref, onBeforeUnmount, nextTick, onActivated } from 'vue';
import { TypeData, TypeKey } from '@/store/chart';

const chartDiv = ref(null);
const chartStore = useChartStore();
let chartData: TypeData = [];



let scene: any, camera: any, renderer: any, controls: any;
let group: any;
let gridXY: any, gridXZ: any, gridYZ: any;

let valPointsObject: any, vallAppPointsObject: any;
let primaryLines: any, approximatedLines: any;

let handleKeyDown: (e: { key: string }) => void;

const toggleGrids = (): void => {
    gridXY.visible = chartStore.grid3D;
    gridXZ.visible = chartStore.grid3D;
    gridYZ.visible = chartStore.grid3D;

    if (renderer && scene && camera) renderer.render(scene, camera);
};

const toggleConnectPoints = (): void => {

    if (chartStore.pointChart3D) {
        if (valPointsObject) {
            const positions: any = valPointsObject.geometry.attributes.position.array;
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
            const positions: any = vallAppPointsObject.geometry.attributes.position.array;
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


let switcher: number = 0;
const toggleDataVisible = (): void => {
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



const createPointsFromData = (x1Val: TypeKey, x2Val: TypeKey, sortVal: TypeKey): Record<string, number> => {

    if (valPointsObject) group.remove(valPointsObject);
    if (vallAppPointsObject) group.remove(vallAppPointsObject);


    const keys: TypeKey[] = Object.keys(chartData[0]);
    let xKeys: TypeKey[] = keys.slice(1, keys.length - 2).slice(0, 2);

    if (x2Val) xKeys[0] = x2Val;
    if (x1Val) xKeys[1] = x1Val;


    const x2Active: boolean = Boolean(x2Val && x2Val != '-' || !x2Val && xKeys[0]);
    const x1Active: boolean = Boolean(x1Val && x1Val != '-' || !x1Val && xKeys[1]);


    if (sortVal && sortVal != '-')
        chartData.sort((a, b) => a[sortVal] - b[sortVal]);


    let primaryData: Float32Array<ArrayBuffer> = null;
    let approximatedData: Float32Array<ArrayBuffer> = null;
    let tempArr: Float32Array<ArrayBuffer> = null;

    tempArr = new Float32Array(chartData.length * 3);
    for (let i: number = 0; i < chartData.length; i++) {
        tempArr[i * 3] = x1Active ? chartData[i][xKeys[1]] : 0;
        tempArr[i * 3 + 1] = x2Active ? chartData[i][xKeys[0]] : 0;
    }

    primaryData = structuredClone(tempArr);
    for (let i: number = 0; i < chartData.length; i++) {
        primaryData[i * 3 + 2] = chartData[i][chartStore.yKeys[0]];
    }


    approximatedData = structuredClone(tempArr);
    for (let i: number = 0; i < chartData.length; i++) 
        approximatedData[i * 3 + 2] = chartData[i][chartStore.yKeys[1]];


    if (renderer && scene && camera) 
        renderer.render(scene, camera);


    let min: number = Number.MAX_VALUE;
    let max: number = Number.MIN_VALUE;


    for (let i: number = 0; i < primaryData?.length; i++) {
        if (primaryData[i] < min) min = primaryData[i];
        if (primaryData[i] > max) max = primaryData[i];

        if (approximatedData[i] < min) min = approximatedData[i];
        if (approximatedData[i] > max) max = approximatedData[i];
    }

    const longSight: number = (Math.abs(max) + Math.abs(min)) * 2.2;
    const absMax: number = Math.max(Math.abs(max), Math.abs(min));
    const panSpeed: number = 5 * absMax / 370;

    const primaryDataMaterial = new THREE.PointsMaterial({
        color: '#0000FF',
        size: longSight / 500,
        sizeAttenuation: true
    });
    const valGeometry = new THREE.BufferGeometry();
    valGeometry.setAttribute('position', new THREE.BufferAttribute(primaryData, 3));
    valPointsObject = new THREE.Points(valGeometry, primaryDataMaterial);
    group.add(valPointsObject);


    const approximatedDataMaterial = new THREE.PointsMaterial({
        color: '#FF0000',
        size: longSight / 500,
        sizeAttenuation: true
    });
    const vallAppGeometry = new THREE.BufferGeometry();
    vallAppGeometry.setAttribute('position', new THREE.BufferAttribute(approximatedData, 3));
    vallAppPointsObject = new THREE.Points(vallAppGeometry, approximatedDataMaterial);
    group.add(vallAppPointsObject);


    return {
        min, max, longSight, absMax, panSpeed
    }
};


const initThree = (posAxis?: number, negAxis?: number, gridStep?: number, x1Val?: TypeKey, x2Val?: TypeKey, sortVal?: TypeKey): void => {
    if (!chartDiv.value) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    group = new THREE.Group();
    scene.add(group);

    const width: number = chartDiv.value.clientWidth;
    const height: number = chartDiv.value.clientHeight;

    let { min, max, longSight, absMax, panSpeed }: Record<string, number> = createPointsFromData(x1Val, x2Val, sortVal);


    let axisTickStep: number = Math.round(longSight / 60);
    axisTickStep = Math.max(Math.ceil(axisTickStep / 5) * 5, 1);


    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, longSight);


    camera.position.set(0.4 * absMax, 0.3 * absMax, 0.3 * absMax);
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

    let letterSize: number = longSight / 50;
    let tickSize: number = longSight / 1000;
    let verticalOffset: number = -longSight / 200;
    let labelOffset: number = longSight / 400;
    let labelSize: number = longSight / 20;
    if (gridStep) {
        letterSize *= gridStep / axisTickStep;
        tickSize *= gridStep / axisTickStep;
        verticalOffset *= gridStep / axisTickStep;
        labelOffset *= gridStep / axisTickStep;
        labelSize *= gridStep / axisTickStep;
        longSight *= gridStep / axisTickStep;
        axisTickStep = Number(gridStep);
    }

    
    max = max > 0 ? max : 0;
    const posAxis_: number = Number(posAxis) ? posAxis : max;
    function createAxisWithTicks(direction: TypeKey, color: string, length: number, sign: number = 1): THREE.Group<THREE.Object3DEventMap> {
        const axisGroup = new THREE.Group();

        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({ color: color, linewidth: 3 });

        const axisPoints: THREE.Vector3[] = [];
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

        for (let i: number = axisTickStep; i < length; i += axisTickStep) {

            const tickGeometry = new THREE.BufferGeometry();
            const tickPoints: THREE.Vector3[] = [];

            if (direction === 'x') {
                tickPoints.push(new THREE.Vector3(i * sign, 0, -tickSize));
                tickPoints.push(new THREE.Vector3(i * sign, 0, tickSize));

                axisGroup.add(
                    createTextSprite(`${i * sign}`, '#000', new THREE.Vector3(i * sign, 0, verticalOffset), letterSize));
            } else if (direction === 'y') {
                tickPoints.push(new THREE.Vector3(0, i * sign, -tickSize));
                tickPoints.push(new THREE.Vector3(0, i * sign, tickSize));

                axisGroup.add(
                    createTextSprite(`${i * sign}`, '#000', new THREE.Vector3(0, i * sign, verticalOffset), letterSize));
            } else if (direction === 'z') {
                tickPoints.push(new THREE.Vector3(-tickSize * sign, 0, i));
                tickPoints.push(new THREE.Vector3(tickSize * sign, 0, i));

                axisGroup.add(
                    createTextSprite(`${i * sign}`, '#000', new THREE.Vector3(0, verticalOffset, i * sign), letterSize));
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
    const negAxis_: number = Number(negAxis) ? negAxis : -min;
    const negXAxis = createAxisWithTicks('x', '#FF0000', negAxis_, -1);
    const negYAxis = createAxisWithTicks('y', '#00FF00', negAxis_, -1);
    const negZAxis = createAxisWithTicks('z', '#0000FF', negAxis_, -1);

    group.add(negXAxis);
    group.add(negYAxis);
    group.add(negZAxis);


    function createTextSprite(text: string, color: string, position: THREE.Vector3, size: number = 1.0): THREE.Sprite<THREE.Object3DEventMap> {
        const canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;

        const context: CanvasRenderingContext2D = canvas.getContext('2d');

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.font = '120px Roboto';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        context.fillText(text, 256, 256);

        const texture: THREE.CanvasTexture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearMipMapLinearFilter;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        const spriteMaterial: THREE.SpriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false
        });

        const sprite: THREE.Sprite<THREE.Object3DEventMap> = new THREE.Sprite(spriteMaterial);
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


    const gridLength: number = Math.max(posAxis_, negAxis_) * 2;
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


    renderer.domElement.addEventListener('dblclick', () => {
        toggleDataVisible();
    });

    let menuTemp: boolean = true;
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
        setTimeout(() => {
            chartStore.newData3D = false;
        }, 0);
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


const chartDivOn = ref<boolean>(true);
async function disposeAndCall(func: (...args: any) => any, ...args: any[]): Promise<void> {

    disposeThree();

    chartDivOn.value = false;
    await nextTick();
    chartDivOn.value = true;
    await nextTick();

    func(...args);
};

function callChart(...args: any[]): void {
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