export const settings = {
    namespaced: true,
    state: {
        storeNumParams: {
            constant: true,
            normSmallValues: true,
            multiplicationFactor: 1,
            L1: 1,
            L2: 1,
            stepPower: 1,
        },
        pointChart: false
    },
    mutations: {
        pointChart(state) {
            state.pointChart = !state.pointChart;
        }
    },
}