<template>
  <v-app>
    <v-main>

      <Nav />
      <div>
        <router-view class="h-100 w-100" />

        <v-snackbar class="custom-snackbar" v-model="$store.state.notify.snackbar" :multi-line="true" :timeout="2000"
          variant="tonal" :color="$store.state.notify.color" location="top end">
          {{ $store.state.notify.text }}
          <template #actions>
            <v-btn variant="text" @click="stopReload">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-snackbar>
      </div>


    </v-main>
  </v-app>
</template>

<script>
import Nav from '@/components/nav.vue'
import '@/assets/styles/defStyle.css'
import '@/assets/styles/defBtn.css'

export default {
  name: 'App',
  components: {
    Nav
  },
  data() {
    return {

    }
  },
  methods: {
    stopReload() {
      this.$store.commit('setSnackbar', false)
    }
  }
}
</script>

<style></style>
