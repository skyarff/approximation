<template>
    <div>
        Что-нибудь
    </div>
    <div class="chart_div">
        <chart  />
    </div>

    
</template>


<script>

import chart from './chart.vue';

export default {

    components: {
        chart
    }

}

</script>

<style scoped>
.chart_div {
    height: 80vh;
    width: 100%;
}

</style>