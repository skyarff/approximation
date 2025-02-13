<template>
    <div style="overflow: hidden; background: #262525; margin-top: 10px;">



        <!-- <ExpandIcon />
        <MinusCircleIcon />
        <MenuKebabIcon />
        <ListIcon />
        <EditIcon />
        <TuneIcon />
        <InfoIcon /> -->

        <div class="h-100 w-100 mt-3 d-flex justify-end align-center">

            <div>
                <v-btn @click="$refs.settingsMenu.switchMenu()" class="mr-5" :color="'#262525'" elevation="0" icon
                    size="x-small">
                    <FilterIcon :color="`#fff`" :size="17" />
                </v-btn>
                <settingsMenu @applySettings="apply(settings)" :settings="settings" ref="settingsMenu" />
            </div>

        </div>


        <div class="chart_div">
            <chart ref="chart" />
        </div>
    </div>



</template>


<script>
import icons from '@/assets/icons'
import { defineAsyncComponent } from 'vue'
import chart from './chart.vue';
import settingsMenu from './settingsMenu.vue';
import { settings } from '@/store/modules/settings';


const asyncIcons = Object.entries(icons).reduce((acc, [key, value]) => {
    acc[key] = defineAsyncComponent(value)
    return acc
}, {})

export default {

    components: {
        ...asyncIcons,
        chart,
        settingsMenu
    },
    data() {
        return {
            settings: {
                min: '',
                max: '',
                xVal: 0
            }
        }
    },
    mounted() {

    },
    methods: {
        apply() {
            this.$refs.chart.callChart(this.settings.min, this.settings.max);
        }
    },
}

</script>

<style scoped>
.chart_div {
    height: 89vh;
    width: 100%;
}
</style>