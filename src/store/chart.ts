import { defineStore } from 'pinia';
import { ref } from 'vue';


type TypeData = Record<string | number, number>[];
type TypeKey = string | number;


type TypePayload = {
    chartData: TypeData,
    xKey: TypeKey,
    xKeys: TypeKey[],
    yKeys: TypeKey[],
    newData: boolean
}


export const useChartStore: any = defineStore('chart', () => {


    const chartData = ref<TypeData>(
        [
            { y1: 120, x: 1.7, 'y (approximated)': 240, 'y (difference)': 120 },
            { y1: 100, x: 1.5, 'y (approximated)': 200, 'y (difference)': 100 },
            { y1: 140, x: 3, 'y (approximated)': 280, 'y (difference)': 140 },
            { y1: 80, x: 4, 'y (approximated)': 160, 'y (difference)': 80 },
            { y1: 180, x: 5, 'y (approximated)': 360, 'y (difference)': 180 },
            { y1: 150, x: 6, 'y (approximated)': 300, 'y (difference)': 150 },
            { y1: 165, x: 7, 'y (approximated)': 330, 'y (difference)': 165 },
            { y1: 145, x: 8, 'y (approximated)': 290, 'y (difference)': 145 },
            { y1: 130, x: 9, 'y (approximated)': 260, 'y (difference)': 130 },
            { y1: 170, x: 10, 'y (approximated)': 340, 'y (difference)': 170 },
            { y1: 90, x: 11, 'y (approximated)': 180, 'y (difference)': 90 },
            { y1: 110, x: 12, 'y (approximated)': 220, 'y (difference)': 110 },
            { y1: 160, x: 13, 'y (approximated)': 320, 'y (difference)': 160 },
            { y1: 135, x: 14, 'y (approximated)': 270, 'y (difference)': 135 },
            { y1: 175, x: 15, 'y (approximated)': 350, 'y (difference)': 175 },
            { y1: 125, x: 16, 'y (approximated)': 250, 'y (difference)': 125 },
            { y1: 155, x: 17, 'y (approximated)': 310, 'y (difference)': 155 },
            { y1: 95, x: 18, 'y (approximated)': 190, 'y (difference)': 95 },
            { y1: 185, x: 19, 'y (approximated)': 370, 'y (difference)': 185 },
            { y1: 115, x: 20, 'y (approximated)': 230, 'y (difference)': 115 }
        ]
    );


    
    const yKeys = ref<TypeKey[]>(['y1', 'y (approximated)', 'y (difference)']);

    const xKey = ref<TypeKey>('x');
    const newData = ref<boolean>(true);
    const pointChart2D = ref<boolean>(false);
    function switchPoint(): void {
        pointChart2D.value = !pointChart2D.value;
    }

    const xKeys = ref<TypeKey[]>(['x']);
    const newData3D = ref<boolean>(true);
    const pointChart3D = ref<boolean>(true);
    const grid3D = ref<boolean>(false);
    function switchPoint3D(): void {
        pointChart3D.value = !pointChart3D.value;
    }


    function setChartData(payload: TypePayload): void {
        chartData.value = payload.chartData;
        xKey.value = payload.xKey;
        xKeys.value = payload.xKeys;
        yKeys.value = payload.yKeys;
        newData.value = true;
        newData3D.value = true;
    }

    return { chartData, 
        xKey, 
        xKeys, 
        yKeys, 
        pointChart2D, 
        newData, 
        pointChart3D,
        grid3D, 
        newData3D, 
        switchPoint, 
        switchPoint3D, 
        setChartData
     };
});

export { TypeData, TypeKey }