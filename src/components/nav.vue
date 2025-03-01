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
    const currentPath = router.currentRoute.value.path;
    const matchingRoute = routes.find(route => route.path === currentPath);
    if (matchingRoute) {
        path.value = matchingRoute.path;
    }
    // Только если мы находимся на корневом маршруте, выполняем перенаправление
    else if (currentPath === '/') {
        router.push(routes[0].path);
    }
});

watch(path, (newVal) => {
    router.push(newVal);
});

</script>




<style scoped>

</style>