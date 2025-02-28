<template>
  <v-app>
    <Nav />
    <v-main>

      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>


    </v-main>
    <v-snackbar class="custom-snackbar" v-model="$store.state.notify.snackbar" :multi-line="true" :timeout="2000"
      variant="tonal" :color="$store.state.notify.color" location="top end">
      {{ $store.state.notify.text }}
      <template #actions>
        <v-btn variant="text" @click="stopReload">
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
import { useStore } from 'vuex';

const store = useStore();

function stopReload() {
  store.commit('setSnackbar', false)
}

</script>


<style></style>
