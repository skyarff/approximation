<template>
  <v-app>
    <Nav />
    <v-main class="main-content">

      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>


    </v-main>


    <v-snackbar class="custom-snackbar" v-model="appStore.notify.snackbar" :multi-line="true" :timeout="2000"
      variant="tonal" :color="appStore.notify.color" location="top end">
      {{ appStore.notify.text }}
      <template #actions>
        <v-btn variant="text" @click="appStore.setSnackbar(false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    
  </v-app>
</template>

<script setup>
import Nav from '@/components/nav.vue';
import '@/assets/styles/defStyle.css';
import '@/assets/styles/defBtn.css';


import { useAppStore } from './store_pinia/app';
const appStore = useAppStore();



</script>


<style scoped>

.main-content {
  height: calc(100vh - 48px);
}

</style>
