<template>
    <v-tabs v-model="path">
        <v-tab v-for="(route, idx) in routes" :key="idx" :text="route.name" :value="route.path" />
    </v-tabs>
</template>


<script setup>
import { routes } from '@/router/routes.js';
import { useRouter } from 'vue-router';
import { ref, watch, onMounted } from 'vue';


const router = useRouter();
const path = ref(routes[0].path);

onMounted(() => {
    router.push(path.value);
})

watch(path, (newVal) => {
    router.push(newVal);
});

</script>




<style scoped>

</style>