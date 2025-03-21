<template>
    <v-tabs v-model="path" class="nav-tabs">
      <v-tab 
        v-for="(route, idx) in routes" 
        :key="idx" 
        :text="route.name" 
        :value="route.path" 
        class="nav-tab"
      />
    </v-tabs>
  </template>
  
  <script setup>
  import { routes } from '@/router/routes.ts';
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
    else if (currentPath === '/') {
      router.push(routes[0].path);
    }
  });
  
  watch(path, (newVal) => {
    router.push(newVal);
  });
  </script>
  
  <style scoped>
  .nav-tabs {
    background: linear-gradient(to right, #f5f7fa, #e1e5ea);
    border-bottom: 1px solid #dde3ec;
    height: 48px;
    flex-shrink: 0;
    width: 100%;
    overflow: hidden;
  }
  
  .nav-tab {
    font-size: 14px;
    font-weight: 500;
    min-width: 100px;
    text-transform: none;
    letter-spacing: 0.3px;
    transition: all 0.2s ease;
  }
  
  .nav-tab:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  .nav-tab.v-tab--selected {
    font-weight: 600;
  }
  
  :deep(.v-slide-group__content) {
    padding: 0 16px;
  }
  </style>